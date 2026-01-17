<template>
  <div class="login-container">
    <!-- 科技感背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="grid-overlay"></div>
    </div>

    <div class="login-box">
      <div class="login-header">
        <div class="logo-container">
          <div class="logo-glow">
            <el-icon class="logo-icon" :size="48" color="#00f2fe"><Monitor /></el-icon>
          </div>
        </div>
        <h2 class="title">AI 助手管理系统</h2>
        <p class="subtitle">智能连接未来 · 科技赋能管理</p>
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
              class="captcha-btn"
              @click="handleGetCaptcha"
            >
              {{ captchaCountdown > 0 ? `${captchaCountdown}s` : '获取验证码' }}
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
        <div class="footer-tips">提示：请先输入账号并获取验证码</div>
        <div class="footer-links">
          还没有账户？<router-link to="/register" class="register-link">立即注册</router-link>
        </div>
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
  background: radial-gradient(circle at center, #1a2a6c, #b21f1f, #fdbb2d);
  background: #0f172a;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* 科技感背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(rgba(0, 242, 254, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 242, 254, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: #00f2fe;
  top: -100px;
  right: -100px;
  animation: float 10s infinite alternate;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: #4facfe;
  bottom: -50px;
  left: -50px;
  animation: float 8s infinite alternate-reverse;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: #7028e4;
  top: 50%;
  left: 10%;
  animation: float 12s infinite alternate;
}

@keyframes float {
  from { transform: translate(0, 0); }
  to { transform: translate(30px, 30px); }
}

.login-box {
  position: relative;
  z-index: 10;
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-glow {
  display: inline-flex;
  padding: 15px;
  background: rgba(0, 242, 254, 0.1);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0, 242, 254, 0.3);
  margin-bottom: 15px;
}

.title {
  font-size: 28px;
  color: #fff;
  margin: 0;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.login-form :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #00f2fe;
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.2);
}

.login-form :deep(.el-input__inner) {
  color: #fff;
}

.captcha-container {
  display: flex;
  gap: 12px;
  width: 100%;
}

.captcha-btn {
  width: 120px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  font-weight: 600;
}

.login-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 4px;
  margin-top: 10px;
  box-shadow: 0 10px 20px rgba(0, 242, 254, 0.3);
  transition: all 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 25px rgba(0, 242, 254, 0.4);
}

.login-footer {
  text-align: center;
  margin-top: 30px;
}

.footer-tips {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 15px;
}

.footer-links {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.register-link {
  color: #00f2fe;
  text-decoration: none;
  font-weight: 600;
  margin-left: 5px;
}

.register-link:hover {
  text-decoration: underline;
}
</style>
