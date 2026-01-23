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
        },
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
/* 导入全局变量 */

/* 语音识别容器 */
.web-speech-container {
  display: flex;
  align-items: center;
  gap: 16px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 语音按钮包装器 */
.speech-button-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 语音按钮样式 */
.speech-button-wrapper .el-button {
  transition: all 0.2s ease;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.speech-button-wrapper .el-button:hover {
  transform: scale(1.05);
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.speech-button-wrapper .el-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 录音中状态按钮 */
.speech-button-wrapper .el-button[type="danger"] {
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

/* 语音状态显示 */
.speech-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
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

/* 临时识别结果输入框 */
.interim-result {
  width: 250px;
  background-color: #ffffff;
  border-color: #fee2e2;
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: all 0.2s ease;
}

.interim-result:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 禁用状态图标 */
.speech-icon-disabled {
  color: #94a3b8;
  font-size: 24px;
  opacity: 0.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .web-speech-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .speech-status {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .interim-result {
    width: 100%;
  }
}
</style>
