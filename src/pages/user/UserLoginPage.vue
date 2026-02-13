<template>
  <div id="userLoginPage">

    <h2 class="title">智能云图库 - 用户登录</h2>
    <h3 class="desc">企业级智能云图库</h3>

    <a-form
      :model="formState"
      name="normal_login"
      class="loginForm"
      @finish="handleSubmit"
    >
      <a-form-item
        name="userAccount"
        :rules="[{ required: true, message: '请输入账号' }]"
      >
        <a-input v-model:value="formState.userAccount" placeholder="请输入账号">
          <template #prefix>
            <UserOutlined class="site-form-item-icon" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item
        name="userPassword"
        :rules="[{ required: true, message: '请输入密码' },
                {min: 8, message: '密码长度不能小于8'},]"
      >
        <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码">
          <template #prefix>
            <LockOutlined class="site-form-item-icon" />
          </template>
        </a-input-password>
      </a-form-item>

      <div class="tips">
        没有账号？ 立即
        <router-link to="/user/register">
          注册
        </router-link>
      </div>

      <a-form-item class="loginFormItem">
        <a-button type="primary" html-type="submit" style="width: 100%">登录</a-button>
      </a-form-item>

    </a-form>

  </div>
</template>

<script lang="ts" setup>
import { reactive, computed } from 'vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { userLoginUsingPost } from '@/api/userController'
import router from '@/router'
import { message } from 'ant-design-vue'

// 记录表单输入的值
const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: ''
})

const handleSubmit = async (values: any) => {
  try {
    // 登录
    const result = await userLoginUsingPost(values)

    if (result.data.code === 0 && result.data.data) {
      // 登录成功
      const loginUserStore = useLoginUserStore()
      await loginUserStore.fetchLoginUser()
      message.success('登录成功')
      setTimeout(async () => {
        // 等待 2 秒 跳转到首页
        await router.push({
          path: '/',
          // 跳转后，不能返回
          replace: true
        })
      }, 1000)
    } else {
      message.error('登录失败' + result.data.message)
    }
  } catch (e: any) {
    message.error(e.message)
  }


}


</script>


<style scoped>
#userLoginPage {
  max-width: 400px;
  margin: 0 auto;
}

#userLoginPage .tips {
  text-align: right;
  font-size: 13px;
  color: #bbb;
  margin-bottom: 16px;
}


#userLoginPage .title {
  text-align: center;
  margin-bottom: 16px;
}

#userLoginPage .desc {
  text-align: center;
  color: #bbb;
  margin-bottom: 16px;
}

.loginForm .loginFormItem {
  text-align: center;
}

</style>
