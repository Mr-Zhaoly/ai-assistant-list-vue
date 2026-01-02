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
  const login = async (loginForm: any) => {
    try {
      // 调用真实登录接口
      const res: any = await authApi.login(loginForm)
      // 假设后端返回的数据结构中包含 token
      // 请根据实际后端返回调整，例如 res.data.token
      const userToken = res.token || res.data?.token
      
      if (userToken) {
        token.value = userToken
        localStorage.setItem('token', userToken)
        
        // 登录成功后获取用户信息
        // await getUserInfo() 
        // 暂时模拟用户信息，避免如果 getUserInfo 接口不存在导致登录流程中断
        userInfo.value = {
          name: loginForm.username,
          avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
          roles: ['admin']
        }
      } else {
        throw new Error('登录失败：未获取到 Token')
      }
    } catch (error) {
      throw error
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
  const logout = () => {
    token.value = ''
    userInfo.value = { name: '', avatar: '', roles: [] }
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    login,
    logout
  }
})
