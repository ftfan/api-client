import Data from '@/lib/data';
import Vue from 'vue';
import { FMexNoOrder } from '@/types/Runner';

class Store extends Data {
  readonly state = {};

  readonly sessionState = {};

  readonly localState = {
    OrderList: [] as FMexNoOrder[],
  };

  // 模块名称，【必须】不能重复
  // 格式为 AAA:BBB:CCC ，指当前模块属于 AAA.BBB 模块，名为 CCC
  protected name = `fmex:runner-order`;

  constructor() {
    super();
    this.initilization();
  }
}

export const RunnerOrder = new Store();

declare module 'vue/types/vue' {
  interface Vue {
    $RunnerOrder: Store;
  }
  interface VueConstructor {
    RunnerOrder: Store;
  }
}

Vue.use((Vue) => {
  Vue.prototype.$RunnerOrder = RunnerOrder;
  Vue.RunnerOrder = RunnerOrder;
});
