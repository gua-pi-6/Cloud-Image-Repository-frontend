<template>
  <div id="userRegisterPage">

    <h2 class="title">智能云图库 - 用户注册</h2>
    <h3 class="desc">企业级智能云图库</h3>

    <a-form
      :model="formState"
      name="normal_login"
      class="registerForm"
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

      <a-form-item
        name="checkPassword"
        :rules="[{ required: true, message: '请输入确认密码' },
                {min: 8, message: '密码长度不能小于8'},]"
      >
        <a-input-password v-model:value="formState.checkPassword" placeholder="请再次输入密码">
          <template #prefix>
            <LockOutlined class="site-form-item-icon" />
          </template>
        </a-input-password>
      </a-form-item>

      <div class="tips">
        有账号？ 立即
        <router-link to="/user/login">
          登录
        </router-link>
      </div>

      <a-form-item class="registerFormItem">
        <a-button type="primary" html-type="submit" style="width: 100%">注册</a-button>
      </a-form-item>

    </a-form>

  </div>
</template>

<script lang="ts" setup>
import { reactive, computed } from 'vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import router from '@/router'
import { message } from 'ant-design-vue'
import { userRegisterUsingPost } from '@/api/userController'

// 记录表单输入的值
const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: ''
})

const handleSubmit = async (values: any) => {
  try {
    // 注册
    const result = await userRegisterUsingPost(values)

    if (result.data.code === 0 && result.data.data) {
      // 注册成功
      // 跳转到登录页
      message.success('注册成功')
       setTimeout(async () => {
        // 等待 2 秒跳转
        await router.push({
          path: '/user/login',
          // 跳转后，不能返回
          replace: true
        })
      }, 1000)

    } else {
      message.error('登录失败' + result.data.message)
    }
  } catch (e: any) {
    message.error('注册失败' + e.message)
  }


}


</script>


<style scoped>
#userRegisterPage {
  max-width: 400px;
  margin: 0 auto;
}

#userRegisterPage .tips {
  text-align: right;
  font-size: 13px;
  color: #bbb;
  margin-bottom: 16px;
}


#userRegisterPage .title {
  text-align: center;
  margin-bottom: 16px;
}

#userRegisterPage .desc {
  text-align: center;
  color: #bbb;
  margin-bottom: 16px;
}

.registerForm .registerFormItem {
  text-align: center;
}

</style>
