<template>
  <div class="RunnerIndex" v-loading="loading">
    开启这个开关，才会运行挂单等程序：
    <el-switch v-model="$DataStore.state.Runing" active-color="#13ce66"></el-switch>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Loading } from '@/lib/loading';
import { RunnerSetting } from '@/types/Runner';

export const Setting = new RunnerSetting({
  Name: 'RunnerIndex',
  Sort: 0,
  Text: '首页',
  VuePath: '/Runner/',
});

@Component
export default class RunnerIndex extends Vue {
  loading = false;
}
</script>

<style scoped lang="scss"></style>
