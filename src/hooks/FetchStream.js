// 由于SSE连接发送get请求导致可携带的数据量限制极大，故封装此方法

// 采用fetch发送post请求，然后用getReade函数来处理流式响应。

import { useChatStore } from "../stores/chatStores";

export function readableStream(inputText, loading) {
  const chatStore = useChatStore();
  let currentAssistantId = "";
  let abortController = null;
  async function sendRequestWithStream() {
    const trimedText = inputText.value.trim();
    inputText.value = "";
    if (!trimedText || loading.value) return;
    // 添加用户消息
    chatStore.addUserMessage(trimedText);
    // 添加ai消息占位
    currentAssistantId = chatStore.addAssistantMessage();
    // 此时可以发送消息了，发送消息前重置状态
    loading.value = true;
    // 取消之前的请求（避免重复请求）
    if (abortController) abortController.abort();
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
        }
      );
      if (!response.ok) throw new Error(`请求失败：${response.status}`);
      if (!response.body) throw new Error("服务器不支持流式响应");

      // 4. 流式接收数据（模拟SSE的onmessage效果）
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              if (json.error) {
                chatStore.updateAssistantMessage(
                  currentAssistantId,
                  `❌ 错误：${json.error}`
                );
                reader.cancel();
                loading.value = false;
                return;
              }
              const content = json.choices[0]?.delta?.content || "";
              if (content) {
                chatStore.updateAssistantMessage(currentAssistantId, content);
              }
            } catch (err) {
              chatStore.updateAssistantMessage(
                currentAssistantId,
                `\n\n⚠️ 解析异常：${err.message}`
              );
              reader.cancel();
              loading.value = false;
              return;
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        // 忽略主动取消的错误
        chatStore.updateAssistantMessage(
          currentAssistantId,
          `❌ 连接失败：${err.message}`
        );
        console.error("请求异常：", err);
      }
    } finally {
      loading.value = false;
    }
  }
  return { abortController, sendRequestWithStream };
}
