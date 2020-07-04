<template>
  <div class="Setting">
    <component v-for="cpt in Cpts" :key="cpt.Name" style="margin:10px;" :is="cpt.Name"></component>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';

// 策略声明注入
const requireComponent = (require as any).context('@/components/Setting', true, /[\w]+\.vue$/);
const Cpts: any[] = [];
const components: any = {};
requireComponent.keys().forEach((fileName: any) => {
  // 获取组件声明文件
  const mod = requireComponent(fileName);
  Cpts.push({
    Sort: mod.Setting.Sort,
    Name: mod.Setting.Name,
  });
  components[mod.Setting.Name] = mod.default;
});

Cpts.sort((a, b) => b.Sort - a.Sort);

@Component({
  components: { ...components },
})
export default class Setting extends Vue {
  Cpts = Cpts;
  mounted() {
    ipcRenderer.send('main-win-size', 500, 400, true);
  }
}
</script>

<style scoped lang="scss">
.Setting {
  text-align: center;
  padding: 20px;
  background-color: rgba($color-main, 0.8);
  overflow: hidden;
  > div {
    display: inline-block;
  }
}
</style>
