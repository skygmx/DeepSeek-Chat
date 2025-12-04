// 基础配置
const API_KEY = "sk-4ce40fbc7f2647e194f4ff44b847febd";
const API_URL = "https://api.deepseek.com/chat/completions"; // 请替换为实际API地址

// 发送消息函数
async function chatWithDeepSeek(message) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // 模型名称，根据实际可用模型调整
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error:", error);
    return `请求失败: ${error.message}`;
  }
}

export { chatWithDeepSeek };
// 使用示例
// async function main() {
//   const userMessage = "你好，请介绍一下JavaScript的基本特点";
//   const reply = await chatWithDeepSeek(userMessage);
//   console.log("DeepSeek回复:", reply);
// }

// main();
