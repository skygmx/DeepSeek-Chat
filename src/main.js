import { createApp } from "vue";
import { createPinia } from "pinia";
// 引入element组件库
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
// 引入markdown语法css文件
import "github-markdown-css/github-markdown.css";
import "highlight.js/styles/github-dark.css";

import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();
app.use(ElementPlus);
app.use(pinia);
app.mount("#app");
