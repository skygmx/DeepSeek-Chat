// SSE (Server-Sent Events) 流式输出钩子
import { ref, onUnmounted } from 'vue';

/**
 * 创建SSE连接并处理流式数据
 * @param {string} url - SSE服务器地址
 * @param {Object} options - 配置选项
 * @param {Object} options.headers - 请求头
 * @param {Object} options.body - 请求体数据
 * @param {string} options.method - 请求方法，默认POST
 * @param {Function} options.onMessage - 接收到消息时的回调
 * @param {Function} options.onError - 发生错误时的回调
 * @param {Function} options.onOpen - 连接打开时的回调
 * @param {Function} options.onClose - 连接关闭时的回调
 * @returns {Object} - SSE控制对象
 */
export function useSSE(url, options = {}) {
  const { 
    headers = {}, 
    body = null, 
    method = 'POST',
    onMessage = () => {}, 
    onError = () => {}, 
    onOpen = () => {}, 
    onClose = () => {}
  } = options;
  
  const eventSource = ref(null);
  const isConnected = ref(false);
  const error = ref(null);
  const streamContent = ref('');

  // 初始化SSE连接
  function connect() {
    try {
      // 创建事件源
      eventSource.value = new EventSource(url);
      
      // 处理连接打开
      eventSource.value.onopen = () => {
        isConnected.value = true;
        error.value = null;
        onOpen();
      };

      // 处理消息接收
      eventSource.value.onmessage = (event) => {
        if (event.data === '[DONE]') {
          // 流结束标记
          disconnect();
          return;
        }
        
        try {
          const data = JSON.parse(event.data);
          const content = data.choices?.[0]?.delta?.content || '';
          if (content) {
            streamContent.value += content;
            onMessage(content, streamContent.value);
          }
        } catch (parseError) {
          // 如果不是JSON格式，直接处理
          streamContent.value += event.data;
          onMessage(event.data, streamContent.value);
        }
      };

      // 处理错误
      eventSource.value.onerror = (err) => {
        error.value = err;
        onError(err);
      };

      // 处理连接关闭
      eventSource.value.onclose = () => {
        isConnected.value = false;
        onClose();
      };
    } catch (err) {
      error.value = err;
      onError(err);
    }
  }

  // 使用fetch API实现SSE（兼容更多情况）
  function connectWithFetch() {
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : null
    })  .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (!response.body) {
          throw new Error('Response body is null');
        }
        
        isConnected.value = true;
        error.value = null;
        onOpen();
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        
        function read() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              isConnected.value = false;
              onClose();
              return;
            }
            
            buffer += decoder.decode(value, { stream: true });
            
            // 按行分割数据
            const lines = buffer.split('\n');
            buffer = lines.pop(); // 保存不完整的最后一行
            
            lines.forEach(line => {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  disconnect();
                  return;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    streamContent.value += content;
                    onMessage(content, streamContent.value);
                  }
                } catch (parseError) {
                  // 如果不是JSON格式，直接处理
                  streamContent.value += data;
                  onMessage(data, streamContent.value);
                }
              }
            });
            
            return read();
          }).catch(err => {
            error.value = err;
            onError(err);
            isConnected.value = false;
          });
        }
        
        return read();
      })
      .catch(err => {
        error.value = err;
        onError(err);
      });
  }

  // 断开SSE连接
  function disconnect() {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }
    isConnected.value = false;
  }

  // 重置流内容
  function resetContent() {
    streamContent.value = '';
  }

  // 组件卸载时自动断开连接
  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    error,
    streamContent,
    connect,
    connectWithFetch, // 提供基于fetch的实现（更通用）
    disconnect,
    resetContent
  };
}

/**
 * 用于DeepSeek API的SSE钩子
 * @param {string} apiKey - API密钥
 * @returns {Object} - SSE控制对象
 */
export function useDeepSeekSSE(apiKey) {
  const { 
    isConnected, 
    error, 
    streamContent, 
    connectWithFetch, 
    disconnect, 
    resetContent 
  } = useSSE('', {});

  /**
   * 发送聊天请求并接收流式响应
   * @param {string} message - 用户消息
   * @param {Function} onMessage - 接收到消息片段时的回调
   * @param {Function} onComplete - 流结束时的回调
   */
  function sendMessage(message, onMessage = () => {}, onComplete = () => {}) {
    resetContent();
    
    const url = 'https://api.deepseek.com/chat/completions';
    const body = {
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: message }
      ],
      stream: true, // 启用流式响应
      temperature: 0.7,
      max_tokens: 1000
    };

    connectWithFetch({
      url,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body,
      onMessage: (chunk, fullContent) => {
        onMessage(chunk, fullContent);
      },
      onClose: () => {
        onComplete(streamContent.value);
      },
      onError: (err) => {
        console.error('DeepSeek SSE error:', err);
      }
    });
  }

  return {
    isConnected,
    error,
    streamContent,
    sendMessage,
    disconnect,
    resetContent
  };
}
