import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { useChatStore } from "./chatStores";

export const useConversationStore = defineStore("conversations", () => {
  const chatStore = useChatStore();
  //   记录当前对话id
  const currentId = ref("1765182848589-dfse");
  //   改变当前对话id
  function editCurId(id) {
    currentId.value = id;
  }
  //   对话列表用map管理
  const conversations = reactive(
    new Map([
      [
        "1765182848589-dfse",
        {
          id: "1765182848589-dfse",
          messagelist: [],
          timeStamp: 1765182848589,
          tittle: "新对话",
        },
      ],
    ])
  );
  //   添加对话列表函数
  function addConversation() {
    const { id, timeStamp } = getTime();
    conversations.set(
      id,
      reactive({
        id: id,
        messagelist: [],
        timeStamp: timeStamp,
        tittle: "新的对话",
      })
    );
    editCurId(id);
  }
  //   获取消息列表用于边框消息渲染
  const conversationList = computed(() => {
    return [...conversations.values()].sort(
      (a, b) => b.timeStamp - a.timeStamp
    );
  });
  //   切换对话函数,切换对话时，将message转为当前对话中的消息列表
  function switchConversation(convId) {
    const targetConv = conversations.get(convId);
    if (targetConv) {
      // 若保留chatStore，可把当前会话消息同步到chatStore：
      chatStore.getMessage(targetConv);
    }
    editCurId(convId);
  }

  // localStorage存储键
  const STORAGE_KEY = "conversations_data";
  //  持久化：保存到localStorage
  function saveToLocal() {
    try {
      const mapArr = Array.from(conversations.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapArr));
    } catch (err) {
      console.error("会话保存失败（Map）：", err);
    }
  }

  //初始化：从localStorage加载会话
  function initConversations() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedArr = JSON.parse(stored);
        // ✅ 关键：数组转回 Map
        // 清空现有数据
        conversations.clear();
        // 逐个添加新数据
        parsedArr.forEach(([key, value]) => {
          conversations.set(key, reactive(value)); // 保持内部对象的响应性
        });
        // 激活第一个会话
        if (conversations.size > 0) {
          currentId.value = Array.from(conversations.keys())[0];
          switchConversation(currentId.value);
        }
      } else {
        // 首次打开，创建默认会话
        addConversation();
      }
    } catch (err) {
      console.error("会话加载失败（Map）：", err);
      addConversation(); // 加载失败则创建默认会话
    }
  }
  return {
    saveToLocal,
    initConversations,
    currentId,
    conversations,
    conversationList,
    switchConversation,
    addConversation,
  };
});
// 生成唯一ID（避免重复）
function generateId() {
  return Date.now().toString() + "-" + Math.random().toString(36).slice(2, 6);
}

//   获取时间函数
function getTime() {
  const id = generateId();
  const timeStamp = Date.now();
  return { id, timeStamp };
}
