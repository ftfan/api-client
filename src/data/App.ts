import Data from '@/lib/data';
import Vue from 'vue';

class Store extends Data {
  readonly state = {
    title: 'FMex.Fun',
  };

  readonly sessionState = {};

  readonly localState = {};

  // 模块名称，【必须】不能重复
  // 格式为 AAA:BBB:CCC ，指当前模块属于 AAA.BBB 模块，名为 CCC
  protected name = `fmex:app`;

  constructor() {
    super();
    this.initilization();
  }
  /**
   * 因为用户忘记密码等原因，重置软件数据
   */
  Reset() {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  }
}

export const AppStore = new Store();

declare module 'vue/types/vue' {
  interface Vue {
    $AppStore: Store;
  }
  interface VueConstructor {
    AppStore: Store;
  }
}

Vue.use((Vue) => {
  Vue.prototype.$AppStore = AppStore;
  Vue.AppStore = AppStore;
});
