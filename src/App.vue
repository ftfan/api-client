<template>
  <div id="app">
    <div class="control">
      <!-- 首页 -->
      <div v-if="$route.name === 'Home'" class="exit GetTired" @click="GoBack">登出</div>

      <!-- 其他非首页与非登录页 -->
      <div v-else-if="$route.name !== 'Login'" class="exit GetTired el-icon-s-home" @click="GoBack"></div>
      <div class="bg g-abs g-drag">{{ $AppStore.state.title }}</div>
      <div class="el-icon-minus GetTired" @click="WinAction('main-win-minimize')"></div>
      <div class="el-icon-close GetTired" @click="WinAction('main-win-close')"></div>
    </div>
    <!-- <div class="ui-item"></div>
    <div class="ui-item"></div> -->
    <router-view class="g-abs router-view"></router-view>

    <el-dialog :visible.sync="$AppStore.state.ChooseKey">
      <div class="clearfix">
        <el-card class="box-card fl" shadow="hover" @click.native="SubmitRun(data)" v-for="data in $UserStore.localState.SecretKeys" :key="data.Key">
          <div slot="header" class="clearfix">
            <el-tag size="mini">{{ data.Key }}</el-tag>
          </div>
          <div>
            备注：<el-tag size="small" v-if="data.Desc">{{ data.Desc }}</el-tag>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';

@Component
export default class App extends Vue {
  WinAction(action: string) {
    ipcRenderer.send(action);
  }

  GoBack() {
    if (this.$route.name === 'Home') {
      this.$UserStore.LoginOut();
      this.$router.replace({ name: 'Login' });
    } else {
      // 策略
      if (this.$route.path.match('/Runner/')) {
        ipcRenderer.send('main-win-show');
      } else {
        this.$router.replace({ name: 'Home' });
      }
    }
    // this.$UserStore.LoginOut();
    // this.$router.replace({ name: 'Login' });
  }

  SubmitRun(data: any) {
    this.$AppStore.state.ChooseKey = false;
    this.$AppStore.state.ChooseKeyResolve(data);
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
    left: 70px;
    text-align: center;
  }
  .GetTired {
    margin-right: 10px;
  }
  .el-icon-minus,
  .el-icon-close {
    cursor: pointer;
  }
  .exit {
    float: left;
    font-size: 12px;
    padding-left: 8px;
    cursor: pointer;
    &.el-icon-s-home {
      font-size: 20px;
      padding-top: 6px;
    }
  }
}
</style>
