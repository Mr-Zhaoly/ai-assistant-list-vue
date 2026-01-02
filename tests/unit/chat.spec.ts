import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chatApi } from '@/api/modules/chat'

describe('Chat API', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Mock global fetch
    global.fetch = vi.fn()
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(() => 'mock-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    }
  })

  it('streamChat sends correct request with token', async () => {
    const mockData = {
      question: 'Hello',
      userId: 'test-user',
      sessionId: '123'
    }

    // Mock successful response with stream
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('AI response'))
        controller.close()
      }
    })

    const mockResponse = {
      ok: true,
      body: mockStream
    }

    // Type assertion for mock
    ;(global.fetch as any).mockResolvedValue(mockResponse)

    const result = await chatApi.streamChat(mockData)

    // Verify fetch call
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/database/stream'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(mockData)
      })
    )
    
    expect(result).toBe(mockStream)
  })

  it('streamChat throws error on non-ok response', async () => {
    const mockData = {
      question: 'Error',
      userId: 'user',
      sessionId: '1'
    }

    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    }

    ;(global.fetch as any).mockResolvedValue(mockResponse)

    await expect(chatApi.streamChat(mockData)).rejects.toThrow('HTTP error! status: 500')
  })
})
