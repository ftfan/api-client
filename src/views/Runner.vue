<template>
  <div class="Runner" v-loading="loading">
    <div class="clearfix">
      <div v-for="cpt in Cpts" :key="cpt.Name" :class="{ active: $route.path === cpt.VuePath }" @click="OpenRunner(cpt)" class="item">
        {{ cpt.Text }}
      </div>
    </div>

    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import { Loading } from '@/lib/loading';
import { RunnerSetting } from '../types/Runner';

// 策略声明注入
const requireComponent = (require as any).context('@/views/Runner', true, /[\w]+\.vue$/);
const Cpts: RunnerSetting[] = [];
const components: any = {};
requireComponent.keys().forEach((fileName: any) => {
  // 获取组件声明文件
  const mod = requireComponent(fileName);
  if (!mod.Setting) return;
  if (components[mod.Setting.Name]) return; // 重复
  Cpts.push(mod.Setting);
  components[mod.Setting.Name] = mod.default;
});

Cpts.sort((a, b) => a.Sort - b.Sort);

@Component({
  components: { ...components },
})
export default class Runner extends Vue {
  Cpts = Cpts;
  loading = false;

  mounted() {
    // 启动行情监控程序
    this.$DataStore.Run();
    ipcRenderer.send('main-win-size', 800, 740, true);
  }

  OpenRunner(cpt: RunnerSetting) {
    if (this.$route.path === cpt.VuePath) return;
    this.$router.push({ path: cpt.VuePath });
  }
}
</script>

<style scoped lang="scss">
.Runner {
  text-align: center;
  background-color: rgba($color-main, 0.8);
  overflow: hidden;
  padding: 10px;
  .item {
    margin: 10px;
    padding: 10px;
    color: #fff;
    background-color: rgba($color-main, 0.7);
    cursor: pointer;
    float: left;
    transition: all ease 0.2s;
    font-size: 12px;
    &:hover {
      box-shadow: 0 0 4px 1px #fff;
      border-radius: 8px;
    }
    &.active {
      background-color: rgba(0, 72, 90, 0.7);
    }
  }
}
</style>
