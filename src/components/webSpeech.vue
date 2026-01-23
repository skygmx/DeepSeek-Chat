<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useChatStore } from "../stores/chatStores";
import {
  startListening,
  stopListening,
  destroySpeechRecognition,
} from "../tools/speechUtils";
import { ElMessage } from "element-plus";

const chatStore = useChatStore();

// 语音识别状态
const isListening = ref(false);
const isSupported = ref(true);
const currentText = ref("");

// 检查浏览器支持
onMounted(() => {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    isSupported.value = false;
    ElMessage.warning("您的浏览器不支持语音识别功能");
  }
});

// 组件卸载时销毁语音识别实例
onUnmounted(() => {
  destroySpeechRecognition();
});

// 开始/停止语音识别
const toggleSpeechRecognition = () => {
  if (isListening.value) {
    // 停止识别
    stopListening();
    isListening.value = false;
  } else {
    // 开始识别
    try {
      startListening(
        // 结果回调
        (transcript, isFinal) => {
          currentText.value = transcript;
          // 更新到 chatStore 的输入框
          chatStore.updateInputMessage(transcript);

          if (isFinal) {
            // 最终结果，停止识别
            stopListening();
            isListening.value = false;
            currentText.value = "";
            ElMessage.success("语音识别完成");
          }
        },
        // 错误回调
        (error) => {
          console.error("语音识别错误:", error);
          isListening.value = false;
          currentText.value = "";

          // 处理常见错误
          let errorMsg = "语音识别失败";
          if (error === "not-allowed") {
            errorMsg = "请允许麦克风访问权限";
          } else if (error === "no-speech") {
            errorMsg = "未检测到语音输入";
          } else if (error === "audio-capture") {
            errorMsg = "无法访问麦克风";
          }

          ElMessage.error(errorMsg);
        },
        // 开始回调
        () => {
          isListening.value = true;
          ElMessage.info("开始语音识别，请说话...");
        },
        // 结束回调
        () => {
          isListening.value = false;
          currentText.value = "";
        }
      );
    } catch (error) {
      console.error("启动语音识别失败:", error);
      ElMessage.error("启动语音识别失败");
    }
  }
};
</script>

<template>
  <div class="web-speech-container">
    <div class="speech-button-wrapper">
      <el-button
        :type="isListening ? 'danger' : 'primary'"
        :icon="isListening ? 'el-icon-microphone-slash' : 'el-icon-microphone'"
        @click="toggleSpeechRecognition"
        :disabled="!isSupported"
        circle
        style="width: 70px; padding: 20px"
      >
        <template #default>
          {{ isListening ? "停止录音" : "开始录音" }}
        </template>
      </el-button>

      <el-tooltip
        v-if="!isSupported"
        content="您的浏览器不支持语音识别功能"
        placement="top"
      >
        <el-icon class="speech-icon-disabled"><el-icon-microphone /></el-icon>
      </el-tooltip>
    </div>

    <!-- 语音识别状态显示 -->
    <div v-if="isListening" class="speech-status">
      <el-tag type="danger" size="small">录音中...</el-tag>
      <el-input
        v-if="currentText"
        readonly
        placeholder="识别中..."
        v-model="currentText"
        class="interim-result"
        size="small"
      />
    </div>
  </div>
</template>

<style scoped>
.web-speech-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.speech-button-wrapper {
  display: flex;
  align-items: center;
  gap: 5px;
}

.speech-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.interim-result {
  width: 200px;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
}

.speech-icon-disabled {
  color: #c0c4cc;
  font-size: 20px;
}
</style>
