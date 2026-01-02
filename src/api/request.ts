import axios from 'axios'
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
})

// Request interceptor
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add token if exists
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message, data } = response.data
    // Adjust this condition based on your backend response structure
    if (code === 200 || code === 0 || response.status === 200) {
      return response.data
    } else {
      ElMessage.error(message || 'Error')
      return Promise.reject(new Error(message || 'Error'))
    }
  },
  (error: AxiosError) => {
    ElMessage.error(error.message || 'Request failed')
    return Promise.reject(error)
  }
)

export default service
