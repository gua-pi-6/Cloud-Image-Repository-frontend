<template>
  <div id="globalHeader">


    <a-row :wrap="false">
      <a-col flex="200px">

        <RouterLink to="/">
          <div class="title-bar">
            <img class="logo" src="../../assets/logo.png" alt="logo" />
            <div class="title">智能云图库</div>
          </div>
        </RouterLink>

      </a-col>

      <a-col flex="auto">

        <a-menu v-model:selectedKeys="current" mode="horizontal" :items="newMenus" @click="doMenuClick" />

      </a-col>

      <a-col flex="120px">


        <div class="userLoginStatus">
          <a>
            <!--用户信息展示 -->
            <div v-if="loginUserStore.loginUser.id">
              <a-dropdown>
                <ASpace>
                  <a-avatar :src="loginUserStore.loginUser.userAvatar" />
                  {{ loginUserStore.loginUser.userName ?? '无名' }}
                  <DownOutlined />
                </ASpace>

                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="doLogout">
                      <LogoutOutlined />
                      退出登录
                    </a-menu-item>
                  </a-menu>
                </template>

              </a-dropdown>


            </div>
            <div v-else>
              <router-link to="/user/login">
                <a-button type="primary" >登录</a-button>
              </router-link>
            </div>
          </a>
        </div>

      </a-col>
    </a-row>


  </div>

</template>

<script lang="ts" setup>
import { computed, h, onMounted, ref } from 'vue'
import { HomeOutlined, DownOutlined, LogoutOutlined } from '@ant-design/icons-vue'
import { type MenuProps, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { userLogoutUsingPost } from '@/api/userController'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'

const loginUserStore = useLoginUserStore()

const items = ref<MenuProps['items']>([
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页'
  },
  {
    key: '/about',
    label: '关于',
    title: '关于'
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理'
  },
  {
    key: '/admin/pictureManage',
    label: '图片管理',
    title: '图片管理',
  },
  {
    key: '/creation/picture',
    label: '图片创建',
    title: '图片创建'
  },
  {
    key: 'others',
    label: h('a', { href: 'https://www.codefather.cn', target: '_blank' }, '编程导航'),
    title: '编程导航'
  }
])

interface mdea{
  onSuccess?: () => void
}

// 过滤菜单
const filterMenus = () => {
  // 得到过滤后的菜单
  return items.value?.filter(item => {
      const userRole = loginUserStore.loginUser.userRole
      // 管理员 直接显示所有菜单
      if (userRole === 'admin') {
        return true
      }
      // 非管理员 只显示非管理员菜单
      else {
        return !item?.key?.startsWith('/admin')
      }
    }
  )


}

const newMenus = computed(() => filterMenus())


const router = useRouter()
// 路由跳转
const doMenuClick = ({ key }: any) => {
  router.push({
    path: key
  })
}

// 切换高亮
const current = ref<string[]>([])
router.afterEach((to, from) => {
  current.value = [to.path]
})

// 退出登录
const doLogout = async () => {
  try {
    const res = await userLogoutUsingPost()
    if (res.data.code === 0) {
      await loginUserStore.setLoginUser({ userName: '未登录' })
      await useSpaceVoStore().setSpaceVo({})
      message.success('退出登录成功')

      setTimeout(() => {
        router.push({
          path: '/user/login',
          replace: true
        })
      }, 1000)
    } else {
      message.error('退出登录失败')
    }
  } catch (e: any) {
    message.error(e.message)
  }
}

</script>


<style scoped>
.title-bar {
  display: flex;
  align-items: center;
}

.title {
  color: black;
  font-size: 18px;
  margin-left: 16px;
}

.logo {
  height: 48px;
}
</style>

