import request from '../request'

export const authApi = {
  login: (data: any) => {
    return request({
      url: '/auth/login', // 假设登录接口为 /auth/login，如果不同请修改此处
      method: 'post',
      data
    })
  },
  logout: () => {
    return request({
      url: '/auth/logout',
      method: 'post'
    })
  },
  getUserInfo: () => {
    return request({
      url: '/user/info',
      method: 'get'
    })
  }
}
