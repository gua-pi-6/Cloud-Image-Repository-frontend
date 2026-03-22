<template>
  <div id="basicLayout">
    <!-- 全局 ConfigProvider，锁定基准颜色 -->
    <a-config-provider
      :theme="{
        token: {
          colorPrimary: '#0d9488',
        },
      }"
    >
      <a-layout class="main-wrapper">
        <!-- 1. 顶部导航 -->
        <a-layout-header class="header">
          <GlobalHeader />
        </a-layout-header>

        <!-- 2. 中间主体区域 -->
        <a-layout class="content-wrapper">
          <!-- 左侧侧边栏 -->
          <a-layout-sider
            width="240"
            class="sider"
            theme="light"
            :trigger="null"
          >
            <div class="sider-content">
              <!-- 【核心修改】移除模板中写死的标签，完全使用 :items="menuItems" 数据驱动渲染 -->
              <a-menu
                v-model:selectedKeys="selectedKeys"
                v-model:openKeys="openKeys"
                mode="inline"
                class="custom-menu"
                :items="menuItems"
                @click="handleMenuClick"
              />
            </div>
          </a-layout-sider>

          <!-- 右侧内容区域 -->
          <a-layout-content class="content">
            <RouterView />
          </a-layout-content>
        </a-layout>

        <!-- 3. 底部 Footer -->
        <a-layout-footer class="footer">
          <a href="https://guapistudio.com" target="_blank">
            智能云图库 by 程序员瓜皮
          </a>
        </a-layout-footer>
      </a-layout>
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router';
import GlobalHeader from '@/components/layout/GlobalHeader.vue';
import {
  PictureOutlined,
  UserOutlined,
  TeamOutlined,
  ApartmentOutlined
} from '@ant-design/icons-vue';
import gsap from 'gsap';
// 如果 SPACE_TYPE_ENUM 在你的实际项目中有用到，保留引入
import { SPACE_TYPE_ENUM } from '@/constants/SpaceConstant'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

// --- 路由与菜单逻辑 ---
const router = useRouter();
const selectedKeys = ref<string[]>([]);
const openKeys = ref<string[]>(['my-teams']); // 默认展开 key 为 'my-teams' 的下拉列表

// 点击菜单项跳转
const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key);
};

// --- 数据中心 ---
const loginUserStore = useLoginUserStore()
const teamSpaceList = ref<API.SpaceUserVO[]>([])

// 固定的三个基础菜单项 (将 class 注入，以便 GSAP 动画能抓取)
const fixedMenuItems = [
  {
    key: '/',
    label: '公共图库',
    title: '公共图库',
    icon: () => h(PictureOutlined),
    class: 'side-menu-item'
  },
  {
    key: '/space',
    label: '我的空间',
    title: '我的空间',
    icon: () => h(UserOutlined),
    class: 'side-menu-item'
  },
  {
    key: '/creation/teamSpace',
    label: '团队空间',
    title: '团队空间',
    icon: () => h(TeamOutlined),
    class: 'side-menu-item'
  },
]

/**
 * 动态生成菜单项
 * 逻辑：未登录或没有团队 -> 渲染3个固定项 | 登录且有团队 -> 渲染3个固定项 + 我的团队下拉列表
 */
const menuItems = computed(() => {
  // 1. 未登录状态：只展示三个固定菜单
  if (!loginUserStore.loginUser?.id) {
    return fixedMenuItems;
  }

  // 2. 已登录，但没有团队空间数据：也只展示固定菜单
  if (teamSpaceList.value.length < 1) {
    return fixedMenuItems;
  }

  // 3. 已登录且有数据：构建“我的团队”可折叠下拉列表
  const teamSpaceSubMenus = teamSpaceList.value.map((spaceUser) => {
    const space = spaceUser.space
    return {
      key: '/space/' + spaceUser.spaceId,
      label: space?.spaceName,
      title: space?.spaceName,
      class: 'side-menu-item'
    }
  })

  const teamSpaceMenuGroup = {
    key: 'my-teams', // 必须与 openKeys 中的对应，保证默认展开
    label: '我的团队',
    title: '我的团队',
    icon: () => h(ApartmentOutlined),
    class: 'side-menu-submenu',
    children: teamSpaceSubMenus, // 使用 children 就会自动渲染成可折叠的 SubMenu
  }

  return [...fixedMenuItems, teamSpaceMenuGroup]
})

// 加载团队空间列表
const fetchTeamSpaceList = async () => {
  const res = await listMyTeamSpaceUsingPost()
  if (res.data.code === 0 && res.data.data) {
    teamSpaceList.value = res.data.data
  } else {
    message.error('加载我的团队空间失败，' + res.data.message)
  }
}

/**
 * 监听变量，登录状态改变时触发数据的重新加载
 */
watchEffect(() => {
  if (loginUserStore.loginUser?.id) {
    fetchTeamSpaceList()
  }
})

// --- GSAP 动画 ---
onMounted(() => {
  // 依然可以根据注入的 class 生效
  gsap.from('.side-menu-item, .side-menu-submenu', {
    x: -30,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 0.2
  });
});
</script>

<style scoped>
/* 保持所有样式不变，未做删减 */
#basicLayout {
  min-height: 100vh;
  background: #f9fafb;
}

.main-wrapper {
  background: transparent;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

#basicLayout .header {
  padding-inline: 32px;
  background: white;
  color: unset;
  border-bottom: 1px solid #f0f0f0;
  z-index: 10;
}

.content-wrapper {
  flex: 1;
  background: transparent;
  width: 100%;
  padding-top: 24px;
}

.sider {
  background: transparent !important;
  padding-left: 32px;
}

.sider-content {
  background: white;
  border-radius: 12px;
  padding: 16px 0;
  height: calc(100vh - 180px);
  position: sticky;
  top: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  /* 解决内部滚动条问题 */
  overflow-y: auto;
}

/* 隐藏侧边栏自定义滚动条，使其更美观 */
.sider-content::-webkit-scrollbar {
  width: 4px;
}
.sider-content::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 4px;
}

:deep(.custom-menu) {
  border-right: none !important;
}

/* 选中状态样式定制 (保持你原本的青色主题) */
:deep(.ant-menu-item-selected) {
  background-color: #f0fdfa !important;
  color: #0d9488 !important;
  font-weight: 600;
}

:deep(.ant-menu-item-selected)::after {
  border-right: 3px solid #0d9488 !important;
}

/* 菜单项和子菜单标题的 Hover 状态 */
:deep(.ant-menu-item:hover),
:deep(.ant-menu-submenu-title:hover) {
  color: #0d9488 !important;
}

:deep(.ant-menu-item .anticon),
:deep(.ant-menu-submenu-title .anticon) {
  font-size: 16px;
}

/* 子菜单项的缩进微调，使其层次感更好 */
:deep(.ant-menu-sub.ant-menu-inline > .ant-menu-item) {
  padding-left: 48px !important;
}

#basicLayout .content {
  margin: 0 32px 80px 32px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  min-height: 400px;
}

#basicLayout .footer {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 16px;
  position: fixed;
  z-index: 1000;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}
</style>
