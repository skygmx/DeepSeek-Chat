import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { useChatStore } from "./chatStores";

export const useConversationStore = defineStore("conversations", () => {
  const chatStore = useChatStore();
  const STORAGE_KEY = "conversations_data";
  const currentId = ref("");

  function editCurId(id) {
    currentId.value = id;
  }

  const conversations = reactive(new Map());

  function syncChatWithConversation(convId) {
    const targetConv = conversations.get(convId);
    if (!targetConv) return;
    chatStore.getMessage(targetConv);
    editCurId(convId);
  }

  function addConversation() {
    const { id, timeStamp } = getTime();
    conversations.set(
      id,
      reactive({
        id: id,
        messagelist: [],
        timeStamp: timeStamp,
        tittle: "新的对话",
      }),
    );
    syncChatWithConversation(id);
    saveToLocal();
  }

  const conversationList = computed(() => {
    return [...conversations.values()].sort((a, b) => b.timeStamp - a.timeStamp);
  });

  function switchConversation(convId) {
    syncChatWithConversation(convId);
  }

  function renameConversationFromFirstMessage(content) {
    const activeConversation = conversations.get(currentId.value);
    if (!activeConversation || activeConversation.messagelist.length > 1) return;

    activeConversation.tittle = content.trim().slice(0, 18) || "新的对话";
  }

  function saveToLocal() {
    try {
      const mapArr = Array.from(conversations.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapArr));
    } catch (err) {
      console.error("会话保存失败（Map）：", err);
    }
  }

  function initConversations() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedArr = JSON.parse(stored);
        conversations.clear();
        parsedArr.forEach(([key, value]) => {
          conversations.set(key, reactive(value));
        });
        if (conversations.size > 0) {
          syncChatWithConversation(Array.from(conversations.keys())[0]);
        } else {
          addConversation();
        }
      } else {
        addConversation();
      }
    } catch (err) {
      console.error("会话加载失败（Map）：", err);
      conversations.clear();
      addConversation();
    }
  }

  watch(
    chatStore.messages,
    () => {
      const activeConversation = conversations.get(currentId.value);
      if (activeConversation) {
        activeConversation.timeStamp = Date.now();
      }
      saveToLocal();
    },
    { deep: true },
  );

  return {
    saveToLocal,
    initConversations,
    currentId,
    conversations,
    conversationList,
    switchConversation,
    addConversation,
    renameConversationFromFirstMessage,
  };
});

function generateId() {
  return Date.now().toString() + "-" + Math.random().toString(36).slice(2, 6);
}

function getTime() {
  const id = generateId();
  const timeStamp = Date.now();
  return { id, timeStamp };
}
