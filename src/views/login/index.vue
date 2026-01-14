<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-container">
          <el-icon class="logo-icon" :size="40" color="#409eff"><Monitor /></el-icon>
        </div>
        <h2 class="title">AI Assistant Admin</h2>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
      >
        <el-form-item prop="account">
          <el-input
            v-model="loginForm.account"
            placeholder="请输入用户名或邮箱"
            :prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="captcha-container">
            <el-input
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              :prefix-icon="Key"
              @keyup.enter="handleLogin"
              style="flex: 1;"
            />
            <el-button
              :loading="captchaLoading"
              :disabled="captchaCountdown > 0"
              type="primary"
              plain
              @click="handleGetCaptcha"
              class="captcha-btn"
            >
              {{ captchaCountdown > 0 ? `${captchaCountdown}秒后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            :loading="loading"
            type="primary"
            class="login-btn"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>提示：请先输入账号并获取验证码</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Monitor, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { authApi } from '@/api/modules/auth'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const captchaLoading = ref(false)
const captchaCountdown = ref(0)

const loginForm = reactive({
  account: '',
  password: '',
  captcha: ''
})

const loginRules = reactive<FormRules>({
  account: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
})

// 获取验证码
const handleGetCaptcha = async () => {
  if (!loginForm.account) {
    ElMessage.warning('请先输入用户名或邮箱')
    return
  }

  captchaLoading.value = true
  try {
    const res: any = await authApi.getCaptcha({ account: loginForm.account })
    if (res.code === 200 || res.success) {
      const captchaData = res.data || res
      ElMessage.success(`验证码已发送：${captchaData.code}（仅用于演示）`)
      
      // 开始倒计时
      captchaCountdown.value = 60
      const timer = setInterval(() => {
        captchaCountdown.value--
        if (captchaCountdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      ElMessage.error(res.message || '获取验证码失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取验证码失败')
  } finally {
    captchaLoading.value = false
  }
}

// 登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm)
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  background-color: #2d3a4b;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  width: 450px;
  padding: 40px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.login-header {
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
  margin: 0 auto;
  font-weight: bold;
}

.login-form {
  position: relative;
}

.captcha-container {
  display: flex;
  gap: 10px;
  width: 100%;
}

.captcha-btn {
  width: 140px;
  flex-shrink: 0;
}

.login-btn {
  width: 100%;
  margin-bottom: 20px;
}

.login-footer {
  text-align: center;
  font-size: 12px;
  color: #999;
}
</style>
