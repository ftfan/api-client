<template>
  <div class="Runner" v-loading="loading"></div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import { Loading } from '@/lib/loading';

@Component
export default class Runner extends Vue {
  loading = false;
  mounted() {
    ipcRenderer.send('size', 500, 400, true);
  }
}
</script>

<style scoped lang="scss">
.Runner {
  text-align: center;
  background-color: $color-main;
  overflow: hidden;
}
</style>
