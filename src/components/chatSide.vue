<script setup>
import { useConversationStore } from "../stores/conversationStores";

const conversationStore = useConversationStore();
</script>

<template>
  <div class="sider">
    <div class="sidebar-header">
      <p class="eyebrow">Workspace</p>
      <h2>DeepSeek Chat</h2>
      <p class="sidebar-copy">在这里切换上下文，保留每一段对话痕迹。</p>
      <el-button type="primary" round @click="conversationStore.addConversation">
        新建对话
      </el-button>
    </div>

    <div class="conversation-list">
      <div
        v-for="item in conversationStore.conversationList"
        :key="item.id"
        class="session"
        :class="{ strong: item.id === conversationStore.currentId }"
        @click="conversationStore.switchConversation(item.id)"
      >
        <el-card :class="{ strong: item.id === conversationStore.currentId }">
          <p>{{ item.tittle }}</p>
          <span>{{ item.messagelist.length }} 条消息</span>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sider {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  color: #f8fafc;
  background:
    radial-gradient(circle at top, rgba(96, 165, 250, 0.25), transparent 35%),
    linear-gradient(180deg, #0f172a 0%, #111827 100%);
}

.sidebar-header {
  padding: 28px 22px 22px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #93c5fd;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
}

.sidebar-copy {
  margin: 10px 0 18px;
  line-height: 1.5;
  color: rgba(226, 232, 240, 0.8);
}

.sidebar-header .el-button {
  width: 100%;
  min-height: 44px;
  border: none;
  font-weight: 600;
  background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%);
}

.conversation-list {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  padding: 14px 12px 18px;
}

.session {
  margin-bottom: 10px;
  transition: transform 0.2s ease;
}

.session:hover {
  transform: translateX(4px);
}

.session .el-card {
  width: 100%;
  cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.66);
  backdrop-filter: blur(14px);
  box-shadow: none;
  transition: all 0.2s ease;
}

.session .el-card:hover {
  border-color: rgba(125, 211, 252, 0.4);
  background: rgba(30, 41, 59, 0.86);
}

.session .el-card.strong {
  border-color: rgba(56, 189, 248, 0.6);
  background:
    linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(59, 130, 246, 0.2)),
    rgba(15, 23, 42, 0.92);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.25);
}

.session .el-card p {
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
}

.session .el-card span {
  font-size: 12px;
  color: rgba(191, 219, 254, 0.72);
}

.conversation-list::-webkit-scrollbar {
  width: 6px;
}

.conversation-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-list::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: rgba(148, 163, 184, 0.35);
}

.conversation-list::-webkit-scrollbar-thumb:hover {
  background: rgba(125, 211, 252, 0.45);
}

@media (max-width: 768px) {
  .sidebar-header {
    padding: 22px 18px 18px;
  }

  .sidebar-header h2 {
    font-size: 24px;
  }

  .conversation-list {
    padding: 10px;
  }
}
</style>
