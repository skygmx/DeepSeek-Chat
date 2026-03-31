<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { Microphone, Mute } from "@element-plus/icons-vue";
import { useChatStore } from "../stores/chatStores";
import {
  startListening,
  stopListening,
  destroySpeechRecognition,
} from "../tools/speechUtils";
import { ElMessage } from "element-plus";

const chatStore = useChatStore();
const isListening = ref(false);
const isSupported = ref(true);
const currentText = ref("");

onMounted(() => {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    isSupported.value = false;
    ElMessage.warning("您的浏览器不支持语音识别功能");
  }
});

onUnmounted(() => {
  destroySpeechRecognition();
});

const toggleSpeechRecognition = () => {
  if (isListening.value) {
    stopListening();
    isListening.value = false;
    return;
  }

  try {
    startListening(
      (transcript, isFinal) => {
        currentText.value = transcript;
        chatStore.updateInputMessage(transcript);

        if (isFinal) {
          stopListening();
          isListening.value = false;
          currentText.value = "";
          ElMessage.success("语音识别完成");
        }
      },
      (error) => {
        console.error("语音识别错误:", error);
        isListening.value = false;
        currentText.value = "";

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
      () => {
        isListening.value = true;
        ElMessage.info("开始语音识别，请说话...");
      },
      () => {
        isListening.value = false;
        currentText.value = "";
      },
    );
  } catch (error) {
    console.error("启动语音识别失败:", error);
    ElMessage.error("启动语音识别失败");
  }
};
</script>

<template>
  <div class="web-speech-container">
    <div class="speech-button-wrapper">
      <el-button
        :type="isListening ? 'danger' : 'primary'"
        :icon="isListening ? Mute : Microphone"
        :disabled="!isSupported"
        circle
        @click="toggleSpeechRecognition"
      />

      <el-tooltip
        v-if="!isSupported"
        content="您的浏览器不支持语音识别功能"
        placement="top"
      >
        <el-icon class="speech-icon-disabled"><Microphone /></el-icon>
      </el-tooltip>
    </div>

    <div v-if="isListening" class="speech-status">
      <el-tag type="danger" size="small">录音中...</el-tag>
      <el-input
        v-if="currentText"
        v-model="currentText"
        readonly
        size="small"
        class="interim-result"
        placeholder="识别中..."
      />
    </div>
  </div>
</template>

<style scoped>
.web-speech-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.speech-button-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.speech-button-wrapper .el-button {
  width: 54px;
  height: 54px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 50%;
  background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
  box-shadow: 0 12px 30px rgba(15, 118, 110, 0.28);
  transition: all 0.2s ease;
}

.speech-button-wrapper .el-button:hover {
  transform: translateY(-1px) scale(1.03);
}

.speech-button-wrapper .el-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  background: #cbd5e1;
  box-shadow: none;
}

.speech-button-wrapper .el-button[type="danger"] {
  background: linear-gradient(135deg, #dc2626 0%, #f97316 100%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

.speech-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(248, 113, 113, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.interim-result {
  width: 220px;
  border-color: #fee2e2;
  border-radius: 10px;
  background-color: #ffffff;
  transition: all 0.2s ease;
}

.interim-result:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.speech-icon-disabled {
  font-size: 24px;
  color: #94a3b8;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .web-speech-container {
    width: 100%;
  }

  .speech-status {
    width: 100%;
  }

  .interim-result {
    flex: 1;
  }
}
</style>
