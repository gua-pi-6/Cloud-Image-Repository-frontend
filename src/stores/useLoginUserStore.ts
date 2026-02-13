import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getLoginUserUsingGet } from '@/api/userController'
import { message } from 'ant-design-vue'

export const useLoginUserStore = defineStore('useLoginUserStore', () => {
  const loginUser = ref<API.LoginUserVO>({
    userName: '未登录'
  })


  async function fetchLoginUser() {
    const result = await getLoginUserUsingGet()
    if (result.data.code === 0 && result.data.data) {
      loginUser.value = result.data.data
    }
  }

  async function setLoginUser(newLoginUser: {}) {
    loginUser.value = newLoginUser
  }


  return {loginUser, fetchLoginUser, setLoginUser}

})


