<script setup>
import { marked } from "marked";
import hljs from "highlight.js";
import { ref, computed, onUnmounted } from "vue";
import { useChatStore } from "./stores/chatStores";
import { readableStream } from "./hooks/readableStream";

// 使用pinia仓库状态管理
const chatStore = useChatStore();
// 定义响应式输入输出变量
let message = ref("");
let loading = ref(false); // 加载状态
let eventSource = null; // SSE连接实例（全局变量，方便卸载时关闭）

// markdown渲染处理区域，这块也可以拖出去封装，后面做吧。

// markdown配置
marked.setOptions({
  // 代码块高亮
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  sanitize: true, // 防止XSS攻击
  breaks: true, // 换行符转<br>
  gfm: true, // 支持GitHub风格Markdown
});
const responseText = ref("");
// 实时渲染Markdown（文本变化自动重新渲染）
const renderedMarkdown = (content) => {
  if (!content) return "<div>思考中...</div>";
  marked.setOptions({
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
    sanitize: true,
    breaks: true,
    gfm: true,
  });
  return marked.parse(content);
};

// ====================== 使用改进后的请求处理函数 ======================
const { abortController, sendRequestWithStream } = readableStream(
  message,
  loading
);

function sendRequestWithKey(e) {
  // 如果按的是 Shift + Enter，允许换行
  if (e.shiftKey) {
    return; // 不阻止默认行为，正常换行
  }

  // 单独按 Enter，阻止换行，执行发送
  e.preventDefault();
  sendRequestWithStream();
}
// 组件卸载时取消请求
onUnmounted(() => {
  if (abortController) abortController.abort();
});

// ===================================================================

// ====================== 3. SSE流式请求核心逻辑 ======================
let currentAssistantId = "";
const sendRequestWithSSE = () => {
  // 空输入校验
  const trimedText = message.value.trim();
  if (!trimedText || loading.value) return;
  message.value = "";
  // 添加用户消息
  chatStore.addUserMessage(trimedText);
  // 添加ai消息占位
  currentAssistantId = chatStore.addAssistantMessage();
  // 重置状态
  loading.value = true;
  responseText.value = "";
  // 关闭之前的SSE连接（避免重复连接）
  if (eventSource) eventSource.close();

  // 构建SSE请求地址（拼接参数，encodeURIComponent处理特殊字符）
  const history = JSON.stringify(chatStore.formatMessagesForLLM);
  const sseUrl = `http://localhost:3000/api/deepseek/sse?message=${encodeURIComponent(
    history
  )}`;

  // 建立SSE连接
  eventSource = new EventSource(sseUrl);

  // ✅ 监听SSE消息（核心：接收后端推送的流式数据）
  eventSource.onmessage = (e) => {
    // 后端发送[DONE]表示流式结束
    if (e.data === "[DONE]") {
      eventSource.close();
      loading.value = false;
      return;
    }

    try {
      // 解析后端转发的DeepSeek数据
      const json = JSON.parse(e.data);
      // 处理错误（后端返回的异常）
      if (json.error) {
        responseText.value = `❌ 错误：${json.error}`;
        eventSource.close();
        loading.value = false;
        return;
      }
      // 提取流式内容并累积
      const content = json.choices[0]?.delta?.content || "";
      if (content) {
        chatStore.updateAssistantMessage(currentAssistantId, content);
      }
    } catch (err) {
      // 解析失败的容错处理
      responseText.value += `\n\n⚠️ 数据解析异常：${err.message}`;
      eventSource.close();
      loading.value = false;
    }
  };

  // ✅ 监听SSE连接错误
  eventSource.onerror = (err) => {
    console.error("SSE连接异常：", err);
    responseText.value = `❌ 连接失败：${
      err.message || "请检查后端代理是否启动"
    }`;
    eventSource.close();
    loading.value = false;
  };

  // ✅ 监听SSE连接成功
  eventSource.onopen = () => {
    console.log("✅ SSE连接已建立，等待回答...");
  };
};

// ====================== 4. 组件卸载时清理资源 ======================
onUnmounted(() => {
  // 关闭SSE连接，防止内存泄漏
  if (eventSource) eventSource.close();
});
</script>

<template>
  <div class="container">
    <div class="chat-history">
      <!-- 遍历Pinia中的对话历史 -->
      <div
        v-for="msg in chatStore.recentMessages"
        :key="msg.id"
        :class="['message-item', `role-${msg.role}`]"
      >
        <!-- 用户消息 -->
        <div v-if="msg.role === 'user'" class="user-message">
          <span class="role-label">你</span>
          <div class="content">{{ msg.content }}</div>
        </div>

        <!-- AI消息（Markdown渲染） -->
        <div v-if="msg.role === 'assistant'" class="assistant-message">
          <span class="role-label">DeepSeek</span>
          <div
            class="markdown-body content"
            v-html="renderedMarkdown(msg.content)"
          ></div>
        </div>
      </div>
    </div>
    <!-- ai回复渲染,直接渲染的这个不要了，用markdown渲染的 -->
    <!-- <div>deepseek回复：{{ response }}</div> -->
    <!-- markdown输出渲染区域 -->
    <!-- <div class="markdown-body output-area" v-html="renderedMarkdown"></div> -->
    <!-- input组件绑定输入框消息 -->
    <div class="button">
      <el-input
        style="width: 400px"
        :autosize="{ minRows: 1, maxRows: 6 }"
        type="textarea"
        v-model="message"
        placeholder="请输入你要发送的文本"
        @keydown.enter="sendRequestWithKey"
      />
      <el-button
        type="primary"
        @click="sendRequestWithStream"
        :disabled="loading"
        >点击发送请求</el-button
      >
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.chat-history {
  width: 90%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  min-height: 600px;
  max-height: 750px;
  overflow-y: auto;
  background-color: #fafafa;
}

.message-item {
  margin-bottom: 20px;
  max-width: 80%;
}

.role-user {
  margin-left: auto;
}

.role-assistant {
  margin-right: auto;
}

.role-label {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px 4px 0 0;
}

.user-message .role-label {
  background-color: #3b82f6;
  color: white;
}

.assistant-message .role-label {
  background-color: #10b981;
  color: white;
}

.content {
  padding: 12px;
  border-radius: 0 4px 4px 4px;
  line-height: 1.6;
}

.user-message .content {
  background-color: #eff6ff;
  border: 1px solid #dbeafe;
}

.assistant-message .content {
  background-color: white;
  border: 1px solid #e2e8f0;
}
.button {
  padding: 20px;
}
.output-area {
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 800px;
  min-height: 400px;
  font-size: 15px;
  line-height: 1.7;
  background-color: #d9cfcf;
}

/* 适配代码块样式 */
:deep(.hljs) {
  padding: 16px;
  border-radius: 6px;
  margin: 8px 0;
}

:deep(p) {
  margin: 8px 0;
}

:deep(pre) {
  margin: 16px 0;
}
</style>
