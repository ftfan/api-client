import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

Vue.use(VueRouter);

const RunnerRoutes: Array<RouteConfig> = [{ path: '', name: 'Runner' }];

const routes: Array<RouteConfig> = [
  { path: '/', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/Login', name: 'Login', component: () => import('@/views/Login.vue') },
  { path: '/Setting', name: 'Setting', component: () => import('@/views/Setting.vue') },
  { path: '/Runner', component: () => import('@/views/Runner.vue'), children: RunnerRoutes },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
  },
];

// 策略声明注入
const requireComponent = (require as any).context('@/views/Runner', true, /[\w]+\.vue$/);
requireComponent.keys().forEach((fileName: any) => {
  const modName = fileName.replace(/\.\//, '').replace(/\.vue/, '');
  const mod = requireComponent(fileName);
  if (!mod.Setting) return;
  // console.log(modName);
  RunnerRoutes.push({
    path: `${modName}`,
    name: `Runner${modName}`,
    component: mod.default,
  });
});

const router = new VueRouter({
  routes,
});

export default router;
