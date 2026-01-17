<script setup>
import { ref, nextTick, watch } from 'vue'
import { Plus, ChatDotRound, User, Monitor, Check, Close, Edit, Setting, Connection } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { chatApi } from '@/api/modules/chat'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import 'github-markdown-css/github-markdown-dark.css'

// Configure marked with highlight.js
const renderer = new marked.Renderer()
marked.setOptions({
  renderer: renderer,
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  langPrefix: 'hljs language-',
  pedantic: false,
  gfm: true,
  breaks: true,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
})

const userStore = useUserStore()

// 侧边栏聊天列表数据
const chatList = ref([
  { id: 1, title: '关于 Vue3 的问题' },
  { id: 2, title: '写一段 Python 代码' },
  { id: 3, title: '周报生成' },
  { id: 4, title: '旅行计划助手' },
  { id: 5, title: '代码 Debug' },
])

// 当前选中的聊天 ID
const activeChatId = ref(1)

// 聊天记录数据
const messages = ref([
  { id: 1, role: 'ai', content: '你好！我是你的 AI 助手，有什么可以帮你的吗？' },
  { id: 2, role: 'user', content: '你好，请介绍一下 Vue3' },
  { id: 3, role: 'ai', content: 'Vue 3 是 Vue.js 的最新主要版本，它带来了许多新特性和改进，包括：\n1. 组合式 API (Composition API)\n2. 更快的渲染速度\n3. 更小的包体积\n4.更好的 TypeScript 支持\n\n你想了解具体哪方面的内容呢？' },
])

// 输入框内容
const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainerRef = ref(null)

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
  }
}

// 监听消息变化自动滚动
watch(() => messages.value.length, scrollToBottom)
watch(() => messages.value[messages.value.length - 1]?.content, scrollToBottom)

// 解析流式响应数据
const processStreamResponse = async (stream, aiMessageId, onToolFeedback) => {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let aiMsg = messages.value.find(m => m.id === aiMessageId)
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    buffer += decoder.decode(value, { stream: true })
    let parsing = true
    while (parsing) {
      const start = buffer.indexOf('{')
      if (start === -1) {
        parsing = false
        break
      }
      
      let balance = 0
      let end = -1
      for (let i = start; i < buffer.length; i++) {
        if (buffer[i] === '{') balance++
        if (buffer[i] === '}') balance--
        if (balance === 0) {
          end = i
          break
        }
      }
      
      if (end !== -1) {
        const jsonStr = buffer.substring(start, end + 1)
        try {
          const data = JSON.parse(jsonStr)
          if (data.node === '_AGENT_MODEL_') {
            if (aiMsg && data.chunk) {
              aiMsg.content += data.chunk
            }
          } else if (data.node === '_AGENT_HOOK_HITL') {
             if (data.toolFeedback && onToolFeedback) {
               onToolFeedback(data.toolFeedback)
             }
          }
        } catch (e) {
          console.error('JSON parse error:', e)
        }
        buffer = buffer.substring(end + 1)
      } else {
        parsing = false
      }
    }
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userText = inputMessage.value
  inputMessage.value = ''

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: userText
  })

  const aiMessageId = Date.now() + 1
  messages.value.push({
    id: aiMessageId,
    role: 'ai',
    content: '',
    toolFeedback: null,
    feedbackSubmitted: false
  })

  isLoading.value = true

  try {
    const stream = await chatApi.chat({
      question: userText,
      userId: userStore.userInfo.name || 'user',
      sessionId: activeChatId.value.toString()
    })

    if (!stream) throw new Error('Response body is null')

    await processStreamResponse(stream, aiMessageId, (toolFeedback) => {
       const aiMsg = messages.value.find(m => m.id === aiMessageId)
       if (aiMsg) {
         aiMsg.toolFeedback = toolFeedback.map(tool => ({
           ...tool,
           approved: true,
           feedback: ''
         }))
       }
    })
  } catch (error) {
    console.error('Failed to send message:', error)
    const aiMsg = messages.value.find(m => m.id === aiMessageId)
    if (aiMsg) {
      aiMsg.content += `\n[出错了: ${error.message || '网络请求失败'}]`
    }
  } finally {
    isLoading.value = false
  }
}

// 提交反馈
const submitFeedback = async (messageId) => {
  const aiMsg = messages.value.find(m => m.id === messageId)
  if (!aiMsg || !aiMsg.toolFeedback) return
  
  const feedbacks = aiMsg.toolFeedback.map(item => ({
    approved: item.approved,
    feedback: item.feedback || ''
  }))
  
  aiMsg.feedbackSubmitted = true
  isLoading.value = true
  
  try {
    const stream = await chatApi.feedback({
      feedbacks,
      userId: userStore.userInfo.name || 'user',
      sessionId: activeChatId.value.toString()
    })
    
    if (!stream) throw new Error('Response body is null')
    
    await processStreamResponse(stream, messageId, (toolFeedback) => {
       aiMsg.toolFeedback = toolFeedback.map(tool => ({
           ...tool,
           approved: true,
           feedback: ''
       }))
       aiMsg.feedbackSubmitted = false
    })
  } catch (error) {
     console.error('Failed to submit feedback:', error)
     aiMsg.content += `\n[反馈提交失败: ${error.message}]`
     aiMsg.feedbackSubmitted = false
  } finally {
    isLoading.value = false
  }
}

// 新建对话
const createNewChat = () => {
  const newId = Date.now()
  chatList.value.unshift({
    id: newId,
    title: '新对话 ' + new Date().toLocaleTimeString()
  })
  activeChatId.value = newId
  messages.value = [{ id: Date.now(), role: 'ai', content: '你好！这是一个新的对话。' }]
}

// 切换对话
const selectChat = (id) => {
  activeChatId.value = id
  if (id === 1) {
    messages.value = [
      { id: 1, role: 'ai', content: '你好！我是你的 AI 助手，有什么可以帮你的吗？' },
      { id: 2, role: 'user', content: '你好，请介绍一下 Vue3' },
      { id: 3, role: 'ai', content: 'Vue 3 是 Vue.js 的最新主要版本，它带来了许多新特性和改进，包括：\n1. 组合式 API (Composition API)\n2. 更快的渲染速度\n3. 更小的包体积\n4.更好的 TypeScript 支持\n\n你想了解具体哪方面的内容呢？' },
    ]
  } else {
    messages.value = [
      { id: Date.now(), role: 'ai', content: `你切换到了对话 ID: ${id}` }
    ]
  }
}
</script>

<template>
  <el-container class="chat-container">
    <!-- 左侧菜单 (聊天列表) -->
    <el-aside width="280px" class="aside">
      <div class="aside-header">
        <div class="logo">
          <el-icon color="#00f2fe"><Connection /></el-icon>
          <span>AI Assistant</span>
        </div>
        <el-button type="primary" class="new-chat-btn" :icon="Plus" @click="createNewChat">
          新建对话
        </el-button>
      </div>
      
      <div class="chat-list">
        <div 
          v-for="chat in chatList" 
          :key="chat.id" 
          :class="['chat-item', { active: activeChatId === chat.id }]"
          @click="selectChat(chat.id)"
        >
          <el-icon><ChatDotRound /></el-icon>
          <span class="chat-title">{{ chat.title }}</span>
        </div>
      </div>

      <div class="aside-footer">
        <div class="user-info">
          <el-avatar :size="32" :icon="User" />
          <span class="username">{{ userStore.userInfo.username || '管理员' }}</span>
        </div>
        <el-icon class="setting-icon"><Setting /></el-icon>
      </div>
    </el-aside>
    
    <!-- 主内容区 -->
    <el-main class="main-content">
      <!-- 聊天记录区域 -->
      <div class="messages-container" ref="messagesContainerRef">
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          :class="['message-row', msg.role === 'user' ? 'message-user' : 'message-ai']"
        >
          <div class="avatar">
            <el-avatar v-if="msg.role === 'user'" :icon="User" class="user-avatar" />
            <div v-else class="ai-avatar">
              <el-icon><Monitor /></el-icon>
            </div>
          </div>
          <div class="message-bubble">
            <div class="message-text" v-if="msg.role === 'user'">{{ msg.content }}</div>
            <div class="message-text markdown-body" v-else v-html="marked.parse(msg.content)"></div>
            <span v-if="msg.role === 'ai' && msg.content === '' && isLoading && !msg.toolFeedback" class="typing-indicator">
              <span></span><span></span><span></span>
            </span>
            
            <!-- 工具调用反馈卡片 -->
            <div v-if="msg.toolFeedback && !msg.feedbackSubmitted" class="tool-feedback-card">
              <div class="tool-feedback-header">
                <el-icon><Monitor /></el-icon>
                <span>人工介入请求</span>
              </div>
              <div v-for="tool in msg.toolFeedback" :key="tool.id" class="tool-item">
                <div class="tool-info">
                  <div class="tool-name">{{ tool.name }}</div>
                  <div class="tool-desc">{{ tool.description }}</div>
                  <div class="tool-args">
                    <pre>{{ JSON.parse(tool.arguments) }}</pre>
                  </div>
                </div>
                <div class="tool-actions">
                  <div class="approval-switch">
                    <span>是否批准:</span>
                    <el-switch
                      v-model="tool.approved"
                      active-text="批准"
                      inactive-text="拒绝"
                      inline-prompt
                    />
                  </div>
                  <el-input
                    v-if="!tool.approved"
                    v-model="tool.feedback"
                    type="textarea"
                    placeholder="请输入拒绝原因或修改建议..."
                    rows="2"
                  />
                </div>
              </div>
              <div class="feedback-submit">
                <el-button type="primary" @click="submitFeedback(msg.id)" :loading="isLoading">
                  提交反馈
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-wrapper">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入消息，按 Enter 发送..."
            resize="none"
            @keyup.enter.exact.prevent="sendMessage"
          />
          <div class="input-footer">
            <span class="input-tips">使用 Shift + Enter 换行</span>
            <el-button 
              type="primary" 
              :disabled="!inputMessage.trim() || isLoading"
              @click="sendMessage"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<style scoped>
.chat-container {
  height: 100vh;
  background-color: #0f172a;
  color: #e2e8f0;
}

.aside {
  background-color: #1e293b;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.aside-header {
  padding: 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #00f2fe;
  margin-bottom: 20px;
}

.new-chat-btn {
  width: 100%;
  background: rgba(0, 242, 254, 0.1);
  border: 1px solid rgba(0, 242, 254, 0.3);
  color: #00f2fe;
  font-weight: 600;
}

.new-chat-btn:hover {
  background: rgba(0, 242, 254, 0.2);
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  margin-bottom: 5px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #94a3b8;
}

.chat-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #f8fafc;
}

.chat-item.active {
  background-color: rgba(0, 242, 254, 0.1);
  color: #00f2fe;
}

.chat-title {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.aside-footer {
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-size: 14px;
  font-weight: 500;
}

.setting-icon {
  cursor: pointer;
  color: #94a3b8;
}

.main-content {
  display: flex;
  flex-direction: column;
  padding: 0;
  position: relative;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 40px 20% 20px;
}

.message-row {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-user {
  flex-direction: row-reverse;
}

.avatar {
  flex-shrink: 0;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.user-avatar {
  background-color: #64748b;
}

.message-bubble {
  max-width: 85%;
  padding: 15px 20px;
  border-radius: 15px;
  line-height: 1.6;
  font-size: 15px;
}

.message-ai .message-bubble {
  background-color: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  border-top-left-radius: 2px;
}

.message-user .message-bubble {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-top-right-radius: 2px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background-color: #00f2fe;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.input-area {
  padding: 20px 20% 40px;
  background: linear-gradient(to top, #0f172a 80%, transparent);
}

.input-wrapper {
  background-color: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.input-wrapper :deep(.el-textarea__inner) {
  background: transparent;
  border: none;
  box-shadow: none;
  color: #f8fafc;
  font-size: 15px;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding: 0 5px;
}

.input-tips {
  font-size: 12px;
  color: #64748b;
}

.tool-feedback-card {
  margin-top: 15px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 242, 254, 0.2);
  border-radius: 10px;
  padding: 15px;
}

.tool-feedback-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00f2fe;
  font-weight: 600;
  margin-bottom: 15px;
}

.tool-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.tool-name {
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 5px;
}

.tool-desc {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 10px;
}

.tool-args pre {
  background: #0f172a;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  color: #00f2fe;
  overflow-x: auto;
}

.tool-actions {
  margin-top: 15px;
}

.approval-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;
}

.feedback-submit {
  text-align: right;
  margin-top: 15px;
}

/* Markdown Styles Overrides */
.markdown-body {
  background-color: transparent !important;
  color: inherit !important;
  font-size: 15px !important;
}

.markdown-body pre {
  background-color: #0f172a !important;
}
</style>
