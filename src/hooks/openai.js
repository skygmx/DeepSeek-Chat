// Please install OpenAI SDK first: `npm install openai`

import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: "sk-4ce40fbc7f2647e194f4ff44b847febd",
});

async function chatWithDeepSeek(userMessage) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "你是一个有帮助的助手。" },
        { role: "user", content: userMessage },
      ],
      model: "deepseek-chat",
      temperature: 0.7, // 控制生成内容的随机性
      max_tokens: 1000, // 控制生成内容的最大长度
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("API调用出错:", error);
    return "抱歉，无法处理你的请求。";
  }
}
export { chatWithDeepSeek };
