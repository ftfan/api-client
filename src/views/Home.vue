<template>
  <div class="Home clearfix" v-loading="$isloading">
    <div v-for="item in List" :key="item.Name" class="GetTired" @click="Action(item.Name)">
      <div class="name">{{ item.Name }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { ipcRenderer, shell } from 'electron';

@Component({
  beforeRouteEnter: (to, from, next) => {
    if (Vue.UserStore.sessionState.login) return next();
    next({ name: 'Login', replace: true });
  },
})
export default class Home extends Vue {
  List = [{ Name: '秘钥管理' }, { Name: '策略管理' }, { Name: '联系我们' }, { Name: '项目源码' }];

  Action(type: string) {
    switch (type) {
      case '项目源码':
        return shell.openExternal('https://github.com/ftfan/api-client');
      case '联系我们':
        return shell.openExternal('https://fmex.fun/#/About');
    }
  }
  mounted() {
    ipcRenderer.send('size', 500, 600, true);
  }
}
</script>

<style scoped lang="scss">
.Home {
  background-color: rgba($color-main, 0.5);
  padding-top: 100px;
  > div {
    float: left;
    margin-left: 66px;
    margin-bottom: 60px;
    border: 1px solid #fff;
    border-radius: 10px;
    text-align: center;
    color: #fff;
    width: 120px;
    padding: 40px 10px;
    background-color: rgba($color-main, 0.5);
    cursor: pointer;
    user-select: none;
    transition: all ease 0.4s;
    &:hover {
      background-color: rgba(#000, 0.3);
    }
  }
}
</style>
