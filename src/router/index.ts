import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: 'Dashboard', icon: 'dashboard' }
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    children: [
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/system/user/index.vue'), // This file doesn't exist yet, but I'll create a dummy
        meta: { title: 'User', icon: 'user' }
      },
       {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/system/role/index.vue'), // Dummy
        meta: { title: 'Role', icon: 'role' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: 'Login'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: {
      title: 'Register'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 白名单，不需要登录即可访问的页面
const whiteList = ['/login', '/register']

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (token) {
    if (to.path === '/login') {
      // 已登录，访问登录页则跳转到首页
      next({ path: '/' })
    } else {
      // 已登录，访问其他页面直接放行
      next()
    }
  } else {
    // 未登录
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next()
    } else {
      // 否则全部重定向到登录页
      next(`/login?redirect=${to.path}`)
    }
  }
})

export default router
