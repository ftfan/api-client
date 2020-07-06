<template>
  <div class="RunnerIndex" v-loading="loading"></div>
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
