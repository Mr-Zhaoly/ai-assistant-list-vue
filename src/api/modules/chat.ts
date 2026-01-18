import request from '../request'

// Stream API needs special handling with fetch for better stream support
export const chatApi = {
  // Streaming chat
  chat: async (data: { question: string; userId: string; sessionId: string }) => {
    const baseURL = import.meta.env.VITE_API_URL
    const url = `${baseURL}/tool-agent/database/chat`
    
    console.log('[Chat API] Request:', {
      url,
      method: 'POST',
      data
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // 'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      console.error('[Chat API] Error:', {
        status: response.status,
        statusText: response.statusText
      })
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    console.log('[Chat API] Success: Stream started')
    return response.body
  },

  // Feedback API
  feedback: async (data: { feedbacks: any[]; userId: string; sessionId: string }) => {
    const baseURL = import.meta.env.VITE_API_URL
    const url = `${baseURL}/tool-agent/database/feedback`
    
    console.log('[Feedback API] Request:', {
      url,
      method: 'POST',
      data
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      console.error('[Feedback API] Error:', {
        status: response.status,
        statusText: response.statusText
      })
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    console.log('[Feedback API] Success: Stream started')
    return response.body
  }
}
