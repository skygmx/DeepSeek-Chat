import { createApp } from "vue";
import { createPinia } from "pinia";
// 引入element组件库
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
// 引入markdown语法css文件
import "github-markdown-css/github-markdown.css";
import "highlight.js/styles/github-dark.css";

import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();
app.use(ElementPlus);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  // 注册为全局组件，名称与图标组件名一致（如 ElIconSearch → Search）
  app.component(key, component);
}
app.use(pinia);
app.mount("#app");
