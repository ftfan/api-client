import Data from '@/lib/data';
import Vue from 'vue';
import { SecretKey } from '@/types/Secret';

class Store extends Data {
  readonly state = {
    title: 'FMex.Fun',

    ChooseKey: false,
    ChooseKeyResolve: (data: any) => {
      //
    },
  };

  readonly sessionState = {};

  readonly localState = {
    Setting: {
      affiliate_code: 'pd56gp', // 市商ID
      OpenNotification: false, // 桌面通知
      FMexApiBaseUrl: 'api.fmextest.net', // 当前 api 请求地址
      FMexApiBaseUrlSign: 'api.fmextest.net', // 当前 api 签名使用域名
      FMexWssBaseUrl: 'api.fmextest.net', // 当前 wss 请求地址
      FMexWssBaseUrlSign: 'api.fmextest.net', // 当前 wss 签名使用域名
    },
  };

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

  async ChooseKey(): Promise<SecretKey> {
    return new Promise((resolve) => {
      this.state.ChooseKey = true;
      this.state.ChooseKeyResolve = resolve;
    });
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
