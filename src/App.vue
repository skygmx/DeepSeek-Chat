<script setup>
import { marked } from "marked";
import hljs from "highlight.js";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useChatStore } from "./stores/chatStores";
import { readableStream } from "./hooks/FetchStream";
import chatSide from "./components/chatSide.vue";
import webSpeech from "./components/webSpeech.vue";
import { useConversationStore } from "./stores/conversationStores";
// 使用pinia仓库状态管理
const chatStore = useChatStore();
const conversationStore = useConversationStore();

// 组件初始化时
// 1. 页面加载初始化会话
onMounted(() => {
  conversationStore.initConversations();

  // 添加监听事件，监听用户离开页面时，执行保存消息操作
  window.addEventListener("beforeunload", () => {
    conversationStore.saveToLocal(); //
  });
});
// 定义响应式输入输出变量
let loading = ref(false); // 加载状态

// 从chatStore获取用户输入内容
const message = computed({
  get: () => chatStore.inputMessage,
  set: (value) => chatStore.updateInputMessage(value),
});

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
  loading,
);

function sendRequestWithKey(e) {
  // 如果按的是 Shift + Enter，允许换行
  if (e.shiftKey) {
    return; // 不阻止默认行为，正常换行
  }
  // 单独按 Enter，阻止换行，执行发送
  e.preventDefault();
  conversationStore.saveToLocal;
  sendRequestWithStream();
}

// ======================组件卸载时保存消息到本地，取消请求 ======================
onUnmounted(() => {
  window.removeEventListener("beforeunload", () => {
    conversationStore.saveToLocal();
  });
});
// 组件卸载时取消请求
onUnmounted(() => {
  if (abortController) abortController.abort();
});
</script>

<template>
  <div class="main-container">
    <!-- 多轮对话侧边栏 -->

    <div class="sider">
      <chat-side></chat-side>
    </div>
    <div class="chat-container">
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
        <web-speech></web-speech>
        <el-button
          type="primary"
          @click="sendRequestWithStream"
          :disabled="loading"
          >点击发送请求</el-button
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 全局变量定义 */
:root {
  --primary-color: #3b82f6;
  --primary-light: #eff6ff;
  --primary-border: #dbeafe;
  --secondary-color: #10b981;
  --secondary-light: #ecfdf5;
  --secondary-border: #d1fae5;
  --background-color: #ffffff;
  --surface-color: #81a060;
  --border-color: #e2e8f0;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg:
    0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}

/* 基础样式重置 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  font-size: var(--font-size-lg);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
  background-color: var(--background-color);
}

/* 主容器布局 */
.main-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--surface-color);
}

/* 侧边栏样式 */
.sider {
  width: 280px;
  border-right: 1px solid var(--border-color);
  background-color: var(--background-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

/* 聊天容器样式 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  background-color: rgb(191, 218, 142);
}

/* 聊天历史区域 */
.chat-history {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  min-height: 600px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  background-color: var(--background-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

/* 消息项样式 */
.message-item {
  margin-bottom: var(--spacing-lg);
  max-width: 80%;
  animation: fadeIn 0.3s ease-out;
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.role-user {
  margin-left: auto;
  align-items: flex-end;
}

.role-assistant {
  margin-right: auto;
  align-items: flex-start;
}

/* 角色标签样式 */
.role-label {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-xs);
  box-shadow: var(--shadow-sm);
}

.user-message .role-label {
  background-color: var(--primary-color);
  color: white;
}

.assistant-message .role-label {
  background-color: var(--secondary-color);
  color: white;
}

/* 消息内容样式 */
.content {
  padding: var(--spacing-md);
  line-height: var(--line-height-relaxed);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
  position: relative;
  word-wrap: break-word;
}

.content:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.user-message .content {
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: var(--border-radius-lg) var(--border-radius-sm)
    var(--border-radius-lg) var(--border-radius-lg);
  border-left: 4px solid var(--primary-color);
}

.assistant-message .content {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm) var(--border-radius-lg)
    var(--border-radius-lg) var(--border-radius-lg);
  border-left: 4px solid var(--secondary-color);
}

/* 输入区域样式 */
.button {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  flex-wrap: wrap;
}

.button:focus-within {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  border-color: var(--primary-color);
}

/* 输入框样式 */
.button .el-input {
  flex: 1;
  min-width: 300px;
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
}

.button .el-input:hover {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 发送按钮样式 */
.button .el-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;
  min-width: 120px;
}

.button .el-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button .el-button:active {
  transform: translateY(0);
}

/* 语音识别组件容器 */
.button :deep(.web-speech-container) {
  align-self: flex-end;
}

/* 输出区域样式（已废弃，保留用于兼容性） */
.output-area {
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  width: 100%;
  min-height: 400px;
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  background-color: var(--background-color);
  box-shadow: var(--shadow-sm);
}

/* 代码块样式优化 */
:deep(.hljs) {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin: var(--spacing-md) 0;
  font-family: "Fira Code", "Courier New", Courier, monospace;
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

:deep(.hljs:hover) {
  box-shadow: var(--shadow-md);
}

/* Markdown 样式优化 */
:deep(p) {
  margin: var(--spacing-md) 0;
}

:deep(pre) {
  margin: var(--spacing-md) 0;
}

:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
  margin: var(--spacing-lg) 0 var(--spacing-md) 0;
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--text-primary);
}

:deep(h1) {
  font-size: 2rem;
}

:deep(h2) {
  font-size: 1.5rem;
}

:deep(h3) {
  font-size: 1.25rem;
}

:deep(ul),
:deep(ol) {
  margin: var(--spacing-md) 0;
  padding-left: var(--spacing-xl);
}

:deep(li) {
  margin: var(--spacing-xs) 0;
}

:deep(a) {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.2s ease;
}

:deep(a:hover) {
  text-decoration: underline;
  color: #2563eb;
}

:deep(blockquote) {
  border-left: 4px solid var(--primary-color);
  padding-left: var(--spacing-md);
  margin: var(--spacing-md) 0;
  color: var(--text-secondary);
  font-style: italic;
}

/* 滚动条样式优化 */
.chat-history::-webkit-scrollbar {
  width: 8px;
}

.chat-history::-webkit-scrollbar-track {
  background: var(--surface-color);
  border-radius: var(--border-radius-sm);
}

.chat-history::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: var(--border-radius-sm);
  transition: background 0.2s ease;
}

.chat-history::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }

  .sider {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    padding: var(--spacing-md);
  }

  .chat-container {
    padding: var(--spacing-md);
  }

  .chat-history {
    max-height: 500px;
  }

  .message-item {
    max-width: 90%;
  }

  .button {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
