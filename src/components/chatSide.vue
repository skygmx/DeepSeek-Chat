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
.sider {
  height: 100%;
  width: 100%;
}
.button {
  padding: 20px;
  margin: 0;
}
.conversition {
  width: 100%;
}
.session {
  background-color: bisque !important;
}
.strong {
  background-color: bisque !important;
}
</style>
