import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api/modules/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref({
    name: '',
    avatar: '',
    roles: [] as string[]
  })

  // 登录
  const login = async (loginForm: { account: string; password: string; captcha: string }) => {
    try {
      // 调用真实登录接口
      const res: any = await authApi.login(loginForm)
      
      // 根据后端返回的数据结构提取 token
      // 后端返回格式：{ code: 200, data: { token: "...", expiresInSeconds: 7200 } }
      let userToken = ''
      if (res.code === 200 || res.success) {
        userToken = res.data?.token || res.token
      } else {
        throw new Error(res.message || '登录失败')
      }
      
      if (userToken) {
        token.value = userToken
        localStorage.setItem('token', userToken)
        
        // 登录成功后设置用户信息
        userInfo.value = {
          name: loginForm.account,
          avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
          roles: ['admin']
        }
      } else {
        throw new Error('登录失败：未获取到 Token')
      }
    } catch (error: any) {
      throw new Error(error.message || error.msg || '登录失败')
    }
  }

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const res: any = await authApi.getUserInfo()
      userInfo.value = res.data
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.warn('Logout API failed:', error)
    } finally {
      token.value = ''
      userInfo.value = { name: '', avatar: '', roles: [] }
      localStorage.removeItem('token')
    }
  }

  return {
    token,
    userInfo,
    login,
    getUserInfo,
    logout
  }
})
