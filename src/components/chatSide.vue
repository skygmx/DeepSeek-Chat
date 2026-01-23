<script setup>
import { useConversationStore } from "../stores/conversationStores";
const conversationStore = useConversationStore();
</script>

<template>
  <div class="sider">
    <div class="button">
      <el-button type="primary" round @click="conversationStore.addConversation"
        >点击新建对话</el-button
      >
    </div>
    <div class="conversition">
      <div
        class="session"
        v-for="item in conversationStore.conversationList"
        :key="item.id"
        @click="conversationStore.switchConversation(item.id)"
        :class="{ strong: item.id === conversationStore.currentId }"
      >
        <el-card
          style="width: 220px"
          :class="{ strong: item.id === conversationStore.currentId }"
          ><p>{{ item.tittle }}</p>
        </el-card>
      </div>
    </div>
  </div>
</template>
<style scoped>
/* 导入全局变量 */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");

/* 侧边栏容器 */
.sider {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
}

/* 新建对话按钮区域 */
.button {
  padding: 16px;
  margin: 0;
  border-bottom: 1px solid #e2e8f0;
  background-color: #ffffff;
}

/* 会话列表区域 */
.conversition {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  padding: 8px;
  background-color: #f8fafc;
}

/* 会话项样式 */
.session {
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.session:hover {
  transform: translateX(4px);
}

/* 会话卡片样式 */
.session .el-card {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
  background-color: #ffffff;
}

.session .el-card:hover {
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  border-color: #dbeafe;
}

/* 当前选中会话样式 */
.session .el-card.strong {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: #eff6ff;
}

/* 会话标题样式 */
.session .el-card p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 12px;
}

/* 当前选中会话标题样式 */
.session .el-card.strong p {
  color: #3b82f6;
  font-weight: 600;
}

/* 滚动条样式优化 */
.conversition::-webkit-scrollbar {
  width: 6px;
}

.conversition::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.conversition::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.conversition::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .button {
    padding: 12px;
  }

  .conversition {
    padding: 4px;
  }

  .session .el-card p {
    font-size: 13px;
    padding: 10px;
  }
}
</style>
