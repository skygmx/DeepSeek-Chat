<script setup>
import { chatWithDeepSeek } from "./hooks/fetch";
import { ref } from "vue";
let message = ref("你好");
let response = ref(null);
function resquest() {
  response.value = "al回答中，请等待...";
  a();
  console.log(message.value);
}
async function a() {
  response.value = await chatWithDeepSeek(message.value);
  message.value = "";
}
</script>
<template>
  <div>
    <el-input
      style="width: 240px"
      :autosize="{ minRows: 1, maxRows: 6 }"
      type="textarea"
      v-model="message"
    />
    <el-button type="primary" @click="resquest">点击发送请求</el-button>
  </div>
  <div>deepseek回复：{{ response }}</div>
</template>
