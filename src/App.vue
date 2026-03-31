<script setup>
import { marked } from "marked";
import hljs from "highlight.js";
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useChatStore } from "./stores/chatStores";
import { readableStream } from "./hooks/FetchStream";
import chatSide from "./components/chatSide.vue";
import webSpeech from "./components/webSpeech.vue";
import { useConversationStore } from "./stores/conversationStores";

const chatStore = useChatStore();
const conversationStore = useConversationStore();
const chatHistoryRef = ref(null);
const loading = ref(false);

const message = computed({
  get: () => chatStore.inputMessage,
  set: (value) => chatStore.updateInputMessage(value),
});

marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderedMarkdown(content) {
  if (!content) return "<div>思考中...</div>";
  return marked.parse(escapeHtml(content));
}

const currentConversation = computed(() =>
  conversationStore.conversations.get(conversationStore.currentId),
);

const chatStats = computed(() => ({
  totalMessages: chatStore.recentMessages.length,
  userMessages: chatStore.recentMessages.filter((msg) => msg.role === "user").length,
}));

const { cancelRequest, sendRequestWithStream } = readableStream(message, loading, {
  onUserMessage(content) {
    conversationStore.renameConversationFromFirstMessage(content);
  },
});

const beforeUnloadHandler = () => {
  conversationStore.saveToLocal();
};

async function scrollToBottom() {
  await nextTick();
  const container = chatHistoryRef.value;
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

watch(
  () => chatStore.recentMessages.length,
  () => {
    scrollToBottom();
  },
);

onMounted(() => {
  conversationStore.initConversations();
  window.addEventListener("beforeunload", beforeUnloadHandler);
  scrollToBottom();
});

function sendRequestWithKey(event) {
  if (event.shiftKey) return;
  event.preventDefault();
  sendRequestWithStream();
}

onUnmounted(() => {
  window.removeEventListener("beforeunload", beforeUnloadHandler);
  conversationStore.saveToLocal();
  cancelRequest();
});
</script>

<template>
  <div class="main-container">
    <aside class="sider">
      <chat-side></chat-side>
    </aside>

    <main class="chat-container">
      <header class="chat-shell">
        <div>
          <p class="overline">AI Assistant</p>
          <h1>{{ currentConversation?.tittle || "新的对话" }}</h1>
          <p class="subline">
            流式聊天、Markdown 渲染和语音输入都已经接在同一条会话链路上。
          </p>
        </div>

        <div class="stats-panel">
          <div>
            <strong>{{ chatStats.totalMessages }}</strong>
            <span>消息总数</span>
          </div>
          <div>
            <strong>{{ chatStats.userMessages }}</strong>
            <span>你的提问</span>
          </div>
        </div>
      </header>

      <section ref="chatHistoryRef" class="chat-history">
        <div v-if="!chatStore.recentMessages.length" class="empty-state">
          <p class="empty-title">开始一段新的对话</p>
          <p class="empty-copy">问一个具体问题，或者试试语音输入，让这条会话先动起来。</p>
        </div>

        <div
          v-for="msg in chatStore.recentMessages"
          :key="msg.id"
          :class="['message-item', `role-${msg.role}`]"
        >
          <div v-if="msg.role === 'user'" class="user-message">
            <span class="role-label">你</span>
            <div class="content">{{ msg.content }}</div>
          </div>

          <div v-if="msg.role === 'assistant'" class="assistant-message">
            <span class="role-label">DeepSeek</span>
            <div class="markdown-body content" v-html="renderedMarkdown(msg.content)"></div>
          </div>
        </div>
      </section>

      <section class="composer">
        <div class="composer-head">
          <span>Message</span>
          <span>{{ loading ? "正在生成回复..." : "Enter 发送，Shift + Enter 换行" }}</span>
        </div>

        <div class="button">
          <el-input
            v-model="message"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 6 }"
            placeholder="请输入你要发送的文本"
            @keydown.enter="sendRequestWithKey"
          />

          <div class="composer-actions">
            <web-speech></web-speech>
            <el-button type="primary" :loading="loading" @click="sendRequestWithStream">
              发送消息
            </el-button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
:global(html),
:global(body),
:global(#app) {
  height: 100%;
  margin: 0;
  overflow: hidden;
}

:root {
  --page-bg: #eef4ff;
  --panel-bg: rgba(255, 255, 255, 0.72);
  --panel-strong: rgba(255, 255, 255, 0.88);
  --line: rgba(148, 163, 184, 0.18);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --brand: #2563eb;
  --assistant: #0f766e;
  --shadow-lg: 0 30px 80px rgba(37, 99, 235, 0.15);
  --shadow-md: 0 16px 38px rgba(15, 23, 42, 0.12);
  --radius-xl: 28px;
  --radius-lg: 22px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.main-container {
  display: flex;
  height: 100vh;
  gap: 24px;
  padding: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 28%),
    radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.16), transparent 30%),
    linear-gradient(180deg, #f8fbff 0%, var(--page-bg) 100%);
}

.sider {
  width: 320px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  background: var(--panel-bg);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow-lg);
}

.chat-shell {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.overline {
  margin-bottom: 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
}

.chat-shell h1 {
  font-size: 36px;
  line-height: 1.05;
  color: var(--text-primary);
}

.subline {
  margin-top: 10px;
  max-width: 720px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.stats-panel {
  display: flex;
  gap: 12px;
}

.stats-panel div {
  min-width: 118px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--panel-strong);
}

.stats-panel strong {
  display: block;
  font-size: 24px;
  color: var(--text-primary);
}

.stats-panel span {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.chat-history {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.88));
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 220px;
  margin-bottom: 20px;
  border: 1px dashed rgba(148, 163, 184, 0.4);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  text-align: center;
  color: var(--text-secondary);
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.empty-copy {
  margin-top: 10px;
  max-width: 420px;
  line-height: 1.6;
}

.message-item {
  display: flex;
  flex-direction: column;
  max-width: min(78%, 760px);
  margin-bottom: 22px;
  animation: fadeIn 0.32s ease-out;
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

.role-label {
  display: inline-block;
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.user-message .role-label {
  background-color: var(--brand);
  color: #fff;
}

.assistant-message .role-label {
  background-color: var(--assistant);
  color: #fff;
}

.content {
  padding: 18px 20px;
  line-height: 1.8;
  word-wrap: break-word;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease;
}

.content:hover {
  transform: translateY(-2px);
}

.user-message .content {
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 24px 24px 8px 24px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.assistant-message .content {
  border: 1px solid rgba(15, 118, 110, 0.12);
  border-radius: 24px 24px 24px 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%);
}

.composer {
  flex-shrink: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--panel-strong);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}

.composer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.button {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  padding: 18px 20px 20px;
}

.button :deep(.el-textarea) {
  flex: 1;
}

.button :deep(.el-textarea__inner) {
  min-height: 98px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
}

.button :deep(.el-textarea__inner:focus) {
  border-color: rgba(37, 99, 235, 0.35);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.composer-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.composer-actions .el-button {
  min-width: 132px;
  min-height: 52px;
  border: none;
  border-radius: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.22);
}

:deep(.hljs) {
  margin: 16px 0;
  padding: 18px;
  border-radius: 16px;
  font-family: "Fira Code", "Courier New", Courier, monospace;
  font-size: 14px;
  line-height: 1.6;
}

:deep(p) {
  margin: 12px 0;
}

:deep(pre) {
  margin: 16px 0;
}

:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
  margin: 20px 0 10px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
}

:deep(ul),
:deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

:deep(li) {
  margin: 4px 0;
}

:deep(a) {
  color: var(--brand);
  text-decoration: none;
}

:deep(blockquote) {
  margin: 16px 0;
  padding-left: 16px;
  border-left: 4px solid var(--brand);
  color: var(--text-secondary);
}

.chat-history::-webkit-scrollbar {
  width: 8px;
}

.chat-history::-webkit-scrollbar-track {
  background: transparent;
}

.chat-history::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.42);
}

.chat-history::-webkit-scrollbar-thumb:hover {
  background: rgba(37, 99, 235, 0.35);
}

@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    height: 100vh;
  }

  .sider {
    width: 100%;
    flex-shrink: 0;
  }

  .chat-container {
    padding: 18px;
  }

  .chat-shell {
    flex-direction: column;
  }

  .stats-panel {
    width: 100%;
  }

  .stats-panel div {
    flex: 1;
  }

  .message-item {
    max-width: 90%;
  }

  .composer-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .button {
    flex-direction: column;
    align-items: stretch;
  }

  .composer-actions {
    width: 100%;
    justify-content: space-between;
  }

  .composer-actions .el-button {
    flex: 1;
  }
}
</style>
