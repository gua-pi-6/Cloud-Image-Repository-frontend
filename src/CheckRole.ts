import { useLoginUserStore } from '@/stores/useLoginUserStore'
import router from '@/router'
import { message } from 'ant-design-vue'

let firstFetchLoginUser = true

// 验证用户角色
router.beforeEach(async (to, from, next) => {
    // 在路由守卫内部获取登录用户信息，此时 Pinia 已经初始化
    const loginUserStore = useLoginUserStore()
    // 首次进入页面时获取登录用户信息
    if (firstFetchLoginUser) {
      await loginUserStore.fetchLoginUser()
      firstFetchLoginUser = false
    }
    const userRole = loginUserStore.loginUser.userRole ?? null
    if (to.path.startsWith('/admin')) {
      if (userRole === 'admin') {
        next()
      } else {
        message.error('未登录')
        next(`/user/login`)
      }
    }
    next()
  }
)

