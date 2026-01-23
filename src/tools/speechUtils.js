// speechUtils.js - Web Speech API 工具函数

// 检测浏览器是否支持 Web Speech API
const isSpeechSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// 获取 SpeechRecognition 构造函数
const getSpeechRecognition = () => {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
};

// 语音识别实例
let recognition = null;
// 回调函数
let onResultCallback = null;
let onErrorCallback = null;
let onStartCallback = null;
let onEndCallback = null;

/**
 * 初始化语音识别
 * @param {Object} options - 配置选项
 * @param {string} options.lang - 语言设置，默认为 'zh-CN'
 * @param {boolean} options.continuous - 是否持续识别，默认为 false
 * @param {boolean} options.interimResults - 是否返回中间结果，默认为 true
 */
export const initSpeechRecognition = (options = {}) => {
  if (!isSpeechSupported()) {
    throw new Error('浏览器不支持 Web Speech API');
  }

  const SpeechRecognition = getSpeechRecognition();
  recognition = new SpeechRecognition();

  // 配置选项
  recognition.lang = options.lang || 'zh-CN';
  recognition.continuous = options.continuous || false;
  recognition.interimResults = options.interimResults || true;

  // 事件监听
  recognition.onresult = (event) => {
    let transcript = '';
    let isFinal = false;

    // 遍历所有结果
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript = event.results[i][0].transcript;
      isFinal = event.results[i].isFinal;
      
      // 如果需要实时结果，立即回调
      if (onResultCallback) {
        onResultCallback(transcript, isFinal);
      }
      
      // 如果是最终结果，结束识别（如果不是持续模式）
      if (isFinal && !recognition.continuous) {
        recognition.stop();
      }
    }
  };

  recognition.onerror = (event) => {
    if (onErrorCallback) {
      onErrorCallback(event.error);
    }
  };

  recognition.onstart = () => {
    if (onStartCallback) {
      onStartCallback();
    }
  };

  recognition.onend = () => {
    if (onEndCallback) {
      onEndCallback();
    }
  };

  return recognition;
};

/**
 * 开始语音识别
 * @param {Function} onResult - 结果回调函数
 * @param {Function} onError - 错误回调函数
 * @param {Function} onStart - 开始回调函数
 * @param {Function} onEnd - 结束回调函数
 */
export const startListening = (onResult, onError, onStart, onEnd) => {
  if (!recognition) {
    // 如果未初始化，先初始化
    initSpeechRecognition();
  }

  // 保存回调函数
  onResultCallback = onResult;
  onErrorCallback = onError;
  onStartCallback = onStart;
  onEndCallback = onEnd;

  // 开始识别
  recognition.start();
};

/**
 * 停止语音识别
 */
export const stopListening = () => {
  if (recognition) {
    recognition.stop();
  }
};

/**
 * 获取当前语音识别实例的状态
 * @returns {Object} 状态对象
 */
export const getRecognitionState = () => {
  if (!recognition) {
    return { initialized: false, listening: false };
  }

  // 注意：SpeechRecognition API 没有直接提供 listening 状态，这里返回初始化状态
  return { initialized: true, listening: recognition.state === 'running' };
};

/**
 * 销毁语音识别实例
 */
export const destroySpeechRecognition = () => {
  if (recognition) {
    recognition.stop();
    recognition = null;
    onResultCallback = null;
    onErrorCallback = null;
    onStartCallback = null;
    onEndCallback = null;
  }
};
