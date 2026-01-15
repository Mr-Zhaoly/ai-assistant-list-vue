<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <div class="logo-container">
          <el-icon class="logo-icon" :size="40" color="#409eff"><Monitor /></el-icon>
        </div>
        <h2 class="title">AI Assistant Admin</h2>
        <p class="subtitle">创建新账户</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            @keyup.enter="handleRegister"
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            type="email"
            placeholder="请输入邮箱地址"
            :prefix-icon="Message"
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            :loading="loading"
            type="primary"
            class="register-btn"
            @click="handleRegister"
          >
            注 册
          </el-button>
        </el-form-item>

        <div class="register-footer">
          <p>已有账户？<router-link to="/login" class="login-link">立即登录</router-link></p>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Monitor, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { authApi } from '@/api/modules/auth'

const router = useRouter()

const registerFormRef = ref<FormInstance>()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 验证密码是否一致
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请确认密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 验证邮箱格式
const validateEmail = (rule: any, value: any, callback: any) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (value === '') {
    callback(new Error('请输入邮箱地址'))
  } else if (!emailRegex.test(value)) {
    callback(new Error('邮箱格式不正确'))
  } else {
    callback()
  }
}

// 验证用户名
const validateUsername = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入用户名'))
  } else if (value.length < 3) {
    callback(new Error('用户名至少3个字符'))
  } else if (value.length > 20) {
    callback(new Error('用户名最多20个字符'))
  } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    callback(new Error('用户名只能包含字母、数字、下划线和连字符'))
  } else {
    callback()
  }
}

const registerRules = reactive<FormRules>({
  username: [{ validator: validateUsername, trigger: 'blur' }],
  email: [{ validator: validateEmail, trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
})

// 注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res: any = await authApi.register({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password
        })

        if (res.code === 200 || res.success) {
          ElMessage.success('注册成功，请登录')
          // 延迟跳转，让用户看到成功消息
          setTimeout(() => {
            router.push('/login')
          }, 1500)
        } else {
          ElMessage.error(res.message || '注册失败')
        }
      } catch (error: any) {
        // 处理用户名或邮箱已存在的情况
        if (error.message?.includes('已存在')) {
          ElMessage.error(error.message)
        } else {
          ElMessage.error(error.message || '注册失败，请稍后重试')
        }
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  width: 100%;
  background-color: #2d3a4b;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-box {
  width: 450px;
  padding: 40px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-container {
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
}

.title {
  font-size: 26px;
  color: #333;
  margin: 0 auto 10px;
  font-weight: bold;
}

.subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.register-form {
  position: relative;
}

.register-btn {
  width: 100%;
  margin-bottom: 20px;
}

.register-footer {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.login-link {
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.3s;
}

.login-link:hover {
  color: #66b1ff;
}
</style>
