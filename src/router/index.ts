import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  { path: '/', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/Login', name: 'Login', component: () => import('@/views/Login.vue') },
  { path: '/Setting', name: 'Setting', component: () => import('@/views/Setting.vue') },
  { path: '/Runner', name: 'Runner', component: () => import('@/views/Runner.vue') },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
  },
];

const router = new VueRouter({
  routes,
});

export default router;
