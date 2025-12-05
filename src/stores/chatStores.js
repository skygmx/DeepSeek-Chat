import { defineStore } from "pinia";
import { computed, reactive } from "vue";

export const useChatStore = defineStore("chat", () => {
  // 定义用户消息列表
  const messages = reactive([]);
  // 添加用户消息
  function addUserMessage(content) {
    const message = {
      id: `user-${Date.now()}`, // 用时间戳生成唯一ID
      role: "user", // 用户角色
      content: content, // 消息内容
      timestamp: Date.now(), // 时间戳（用于排序）
    };
    messages.push(message);
  }
  // 添加AI消息（初始为空，用于流式输出占位）
  function addAssistantMessage() {
    const message = {
      id: `assistant-${Date.now()}`,
      role: "assistant", // AI角色
      content: "", // 初始为空，后续逐步更新
      timestamp: Date.now(),
    };
    messages.push(message);
    return message.id; // 返回ID，方便后续更新内容
  }
  // 更新AI流式消息（逐步拼接内容）
  function updateAssistantMessage(id, content) {
    const msg = messages.find((m) => m.id === id);
    if (msg) {
      msg.content += content; // 累加内容，实现流式效果
    }
  }

  // 清空对话历史
  function clearMessages() {
    messages = [];
  }

  //   计算属性

  // 按时间排序对话历史，最晚的消息在最后面
  const recentMessages = computed(() => {
    return [...messages].sort((a, b) => a.timestamp - b.timestamp);
  });
  //   将历史消息转化为大模型需要的形式
  const formatMessagesForLLM = computed(() => {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  });
  return {
    messages,
    addAssistantMessage,
    addUserMessage,
    updateAssistantMessage,
    clearMessages,
    recentMessages,
    formatMessagesForLLM,
  };
});
