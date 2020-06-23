import Vue from 'vue';
import App from './App.vue';
import router from './router';
import './plugins/element.ts';
import '@/assets/main.scss';
import Component from 'vue-class-component';

// Register the router hooks with their names
Component.registerHooks([
  'beforeRouteEnter',
  'beforeRouteLeave',
  'beforeRouteUpdate', // for vue-router 2.2+
]);

Vue.config.productionTip = false;

process.on('unhandledRejection', (error) => {
  console.error(error);
});

import '@/data/App';
import '@/data/User';
import './lib/loading';

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
