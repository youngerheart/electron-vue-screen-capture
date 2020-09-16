import Vue from 'vue';
import App from './App.vue';
import './assets/iconfont/iconfont.css';
import { ipc } from '@/global/ipc/renderer';

Vue.config.productionTip = false;
Vue.prototype.$ipc = ipc;

new Vue({
  render: (h) => h(App)
}).$mount('#app');
