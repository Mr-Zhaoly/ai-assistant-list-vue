import request from '../request'

export const authApi = {
  // 获取验证码
  getCaptcha: (data: { account: string }) => {
    return request({
      url: '/business/user/captcha',
      method: 'post',
      data
    })
  },
  // 登录
  login: (data: { account: string; password: string; captcha: string }) => {
    return request({
      url: '/business/user/login',
      method: 'post',
      data
    })
  },
  // 注册
  register: (data: { username: string; email: string; password: string }) => {
    return request({
      url: '/business/user/register',
      method: 'post',
      data
    })
  },
  // 退出登录
  logout: () => {
    return request({
      url: '/business/user/logout',
      method: 'post'
    })
  },
  // 获取用户信息
  getUserInfo: () => {
    return request({
      url: '/business/user/info',
      method: 'get'
    })
  }
}
