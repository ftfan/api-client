<template>
  <div id="app">
    <div class="control">
      <div class="bg g-abs g-drag">{{ $AppStore.state.title }}</div>
      <div class="el-icon-minus GetTired" @click="WinAction('minimize')"></div>
      <div class="el-icon-close GetTired" @click="WinAction('close')"></div>
    </div>
    <!-- <div class="ui-item"></div>
    <div class="ui-item"></div> -->
    <router-view class="g-abs router-view"></router-view>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';

@Component
export default class App extends Vue {
  WinAction(action: string) {
    ipcRenderer.send(action);
  }
}
</script>

<style scoped lang="scss">
#app {
  // box-shadow: 0 0 4px #fff;
  // border-radius: 10px;
  // border: 4px solid $color-main;
  // // background-color: #fff;
  // margin: 4px;
  .router-view {
    // background-color: #fff;
    top: 40px;
    box-shadow: 0 0 4px $color-main;
    border-radius: 4px;
    border-bottom-left-radius: 100px;
    border-bottom-right-radius: 100px;
    border: 2px solid #fff;
    margin: 4px;
  }
}
.ui-item {
  width: 4px;
  height: 14px;
  border-radius: 4px;
  box-shadow: 0 0 2px #fff;
  background-color: $color-main;
  position: absolute;
  top: 34px;
  left: 60px;
  z-index: 10;
  border: 1px solid #fff;
  & + & {
    left: auto;
    right: 60px;
  }
}
.control {
  font-size: 20px;
  color: #fff;
  position: relative;
  text-align: right;
  line-height: 30px;
  background-color: rgba($color-main, 0.9);
  box-shadow: 0 0 4px $color-main;
  border-radius: 4px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border: 2px solid #fff;
  margin: 4px;
  .bg {
    right: 70px;
    padding-left: 70px;
    text-align: center;
  }
  .GetTired {
    margin-right: 10px;
  }
}
</style>
