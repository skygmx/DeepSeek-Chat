import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useChatStore = defineStore("chat", () => {
  // 定义用户消息列表
  const messages = ref([]);
  // 定义用户输入框内容
  const inputMessage = ref("");

  // 从对话列表中获取message
  function getMessage(object) {
    messages.value = object.messagelist;
  }

  // 更新用户输入框内容
  function updateInputMessage(content) {
    inputMessage.value = content;
  }

  // 清空用户输入框内容
  function clearInputMessage() {
    inputMessage.value = "";
  }
  // 添加用户消息
  function addUserMessage(content) {
    const message = {
      id: `user-${Date.now()}`, // 用时间戳生成唯一ID
      role: "user", // 用户角色
      content: content, // 消息内容
      timestamp: Date.now(), // 时间戳（用于排序）
    };
    messages.value.push(message);
  }
  // 添加AI消息（初始为空，用于流式输出占位）
  function addAssistantMessage() {
    const message = {
      id: `assistant-${Date.now()}`,
      role: "assistant", // AI角色
      content: "", // 初始为空，后续逐步更新
      timestamp: Date.now(),
    };
    messages.value.push(message);
    return message.id; // 返回ID，方便后续更新内容
  }
  // 更新AI流式消息（逐步拼接内容）
  function updateAssistantMessage(id, content) {
    const msg = messages.value.find((m) => m.id === id);
    if (msg) {
      msg.content += content; // 累加内容，实现流式效果
    }
  }

  // 清空对话历史
  function clearMessages() {
    messages.value = [];
  }

  //   计算属性

  // 按时间排序对话历史，最晚的消息在最后面
  const recentMessages = computed(() => {
    return [...messages.value].sort((a, b) => a.timestamp - b.timestamp);
  });
  // 将历史消息转化为大模型需要的形式
  const formatMessagesForLLM = computed(() => {
    return messages.value.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  });
  return {
    messages,
    inputMessage,
    getMessage,
    addAssistantMessage,
    addUserMessage,
    updateAssistantMessage,
    clearMessages,
    updateInputMessage,
    clearInputMessage,
    recentMessages,
    formatMessagesForLLM,
  };
});
