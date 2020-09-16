import Vue from 'vue';

import App from './views/App.vue';
import { ipc } from '@/global/ipc/renderer';

Vue.prototype.$ipc = ipc;

new Vue({
  render: (h) => h(App)
}).$mount('#app');
