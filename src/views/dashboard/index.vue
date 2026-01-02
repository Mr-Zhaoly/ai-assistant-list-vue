<script setup>
import { ref, nextTick, watch } from 'vue'
import { Plus, ChatDotRound, User, Monitor } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { chatApi } from '@/api/modules/chat'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import 'github-markdown-css/github-markdown.css'

// Configure marked with highlight.js
const renderer = new marked.Renderer()
marked.setOptions({
  renderer: renderer,
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  langPrefix: 'hljs language-', // highlight.js css expects a top-level 'hljs' class.
  pedantic: false,
  gfm: true,
  breaks: true,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
})

// Markdown render helper
const renderMarkdown = (content) => {
  return marked.parse(content)
}

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

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userText = inputMessage.value
  inputMessage.value = ''

  // 添加用户消息
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: userText
  })

  // 添加 AI 消息占位符
  const aiMessageId = Date.now() + 1
  messages.value.push({
    id: aiMessageId,
    role: 'ai',
    content: ''
  })

  isLoading.value = true

  try {
    const stream = await chatApi.streamChat({
      question: userText,
      userId: userStore.userInfo.name || 'user',
      sessionId: activeChatId.value.toString()
    })

    if (!stream) {
      throw new Error('Response body is null')
    }

    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let aiMsg = messages.value.find(m => m.id === aiMessageId)
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        if (buffer && aiMsg) {
          // 处理剩余的 buffer
          const lines = buffer.split('\n')
          for (const line of lines) {
             if (line.trim() === '') continue
             if (line.startsWith('data:')) {
                let content = line.substring(5)
                if (content.startsWith(' ')) {
                  content = content.substring(1)
                }
                aiMsg.content += content
              }
           }
         }
         break
       }
       
       buffer += decoder.decode(value, { stream: true })
       const lines = buffer.split('\n')
       buffer = lines.pop() // 保留最后一行（可能是因为不完整）
       
       for (const line of lines) {
        // 跳过空行（通常是 SSE 的分隔符）
        if (line.trim() === '') continue
        
        if (line.startsWith('data:')) {
          // 提取 data: 后的内容
          let content = line.substring(5)
          if (content.startsWith(' ')) {
            content = content.substring(1)
          }
          if (aiMsg) {
            aiMsg.content += content
          }
        } else {
          // 不以 data: 开头的非空行，通常是上一行的延续（原文本中的换行）
          // 需要补上被 split 消耗掉的换行符
          if (aiMsg) {
            aiMsg.content += '\n' + line
          }
        }
      }
    }

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
  // 模拟切换对话加载消息 (实际项目中应该从后端加载)
  // 这里为了演示，如果是原来的 ID 1，显示原来的示例数据，否则显示空对话
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
    <el-aside width="260px" class="aside">
      <div class="new-chat-wrapper">
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
            <div v-else class="ai-avatar">AI</div>
          </div>
          <div class="message-bubble">
            <div class="message-text" v-if="msg.role === 'user'">{{ msg.content }}</div>
            <!-- <div class="message-text" v-else v-html="msg.content"></div> -->
            <div class="message-text markdown-body" v-else v-html="marked.parse(msg.content)"></div>
            <span v-if="msg.role === 'ai' && msg.content === '' && isLoading" class="typing-indicator">...</span>
          </div>
        </div>
      </div>
      
      <!-- 输入框区域 -->
      <div class="input-container">
        <div class="input-wrapper">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题... (按 Enter 发送)"
            resize="none"
            :disabled="isLoading"
            @keydown.enter.prevent="sendMessage"
          />
          <div class="input-actions">
            <el-button type="primary" @click="sendMessage" :loading="isLoading">发送</el-button>
          </div>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
}

.aside {
  background-color: #f5f7fa;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
}

.new-chat-wrapper {
  padding: 20px;
}

.new-chat-btn {
  width: 100%;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  margin-bottom: 5px;
  border-radius: 6px;
  cursor: pointer;
  color: #606266;
  transition: background-color 0.2s;
}

.chat-item:hover {
  background-color: #e6e8eb;
}

.chat-item.active {
  background-color: #e6f0ff;
  color: #409eff;
}

.chat-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.main-content {
  padding: 0;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  position: relative;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 20px;
}

.message-row {
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
}

.message-user {
  flex-direction: row-reverse;
}

.message-ai {
  flex-direction: row;
}

.avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.ai-avatar {
  width: 36px;
  height: 36px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.user-avatar {
  background-color: #909399;
}

.message-bubble {
  max-width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap; /* 保持换行 */
}

.message-ai .message-bubble {
  background-color: #f4f4f5;
  color: #303133;
  border-top-left-radius: 0;
}

.message-user .message-bubble {
  background-color: #409eff;
  color: white;
  border-top-right-radius: 0;
}

.input-container {
  padding: 20px;
  border-top: 1px solid #dcdfe6;
  background-color: #ffffff;
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.input-actions {
  position: absolute;
  bottom: 10px;
  right: 10px;
}

.typing-indicator {
  display: inline-block;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}

/* Markdown 样式覆盖 */
.markdown-body {
  background-color: transparent !important;
  font-size: 14px;
  padding: 0 !important;
  min-width: 0 !important;
  width: auto !important;
  box-sizing: border-box !important;
}

.markdown-body p,
.markdown-body ul,
.markdown-body ol,
.markdown-body dl,
.markdown-body blockquote,
.markdown-body pre,
.markdown-body table {
  margin-bottom: 0.8em;
  margin-top: 0;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 1.2em;
  margin-bottom: 0.8em;
  line-height: 1.4;
}

.markdown-body pre {
  background-color: #ffffff;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto; /* 代码块过长时显示滚动条 */
}
</style>
