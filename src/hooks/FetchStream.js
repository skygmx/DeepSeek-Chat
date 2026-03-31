// 由于SSE连接发送get请求导致可携带的数据量限制极大，故封装此方法
// 采用fetch发送post请求，然后用getReade函数来处理流式响应。

// 用eventsource-parser解析sse数据流，顺便重构学习一下这个代码。
import { useChatStore } from "../stores/chatStores";
import { createParser } from "eventsource-parser";

export function readableStream(inputText, loading, options = {}) {
  const chatStore = useChatStore();
  let currentAssistantId = "";
  let abortController = null;

  function cancelRequest() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  async function sendRequestWithStream() {
    const trimedText = inputText.value.trim();
    if (!trimedText || loading.value) return;
    inputText.value = "";
    // 添加用户消息
    chatStore.addUserMessage(trimedText);
    options.onUserMessage?.(trimedText);
    // 添加ai消息占位
    currentAssistantId = chatStore.addAssistantMessage();
    // 此时可以发送消息了，发送消息前重置状态
    loading.value = true;
    // 取消之前的请求（避免重复请求）
    cancelRequest();
    abortController = new AbortController();
    // 发送post请求
    try {
      const response = await fetch(
        "http://localhost:3000/api/deepseek/stream",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimedText,
            history: chatStore.formatMessagesForLLM, // 传递所有历史消息（大量数据也没问题）
          }),
          signal: abortController.signal, // 支持取消请求
        },
      );
      if (!response.ok) throw new Error(`请求失败：${response.status}`);
      if (!response.body) throw new Error("服务器不支持流式响应");

      // 4. 流式接收数据（模拟SSE的onmessage效果）
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      // 创建parser实例，定义回调函数
      const parser = createParser({
        onEvent(event) {
          const data = event.data;
          if (data === "[DONE]") return;
          let json;
          try {
            json = JSON.parse(event.data);
          } catch {
            // 如果真的不是 JSON，当纯文本
            chatStore.updateAssistantMessage(currentAssistantId, event.data);
            return;
          }
          const content = json.choices[0]?.delta?.content || "";
          if (content) {
            chatStore.updateAssistantMessage(currentAssistantId, content);
          }
        },
        onError(err) {
          console.error("SSE 协议错误", err);
        },
      });
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // 重构：把解码出来的词传给parser，回调函数处理解析后直接更新到仓库就好了
        parser.feed(chunk);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        // 忽略主动取消的错误
        chatStore.updateAssistantMessage(
          currentAssistantId,
          `❌ 连接失败：${err.message}`,
        );
        console.error("请求异常：", err);
      }
    } finally {
      loading.value = false;
      abortController = null;
    }
  }
  return { cancelRequest, sendRequestWithStream };
}
