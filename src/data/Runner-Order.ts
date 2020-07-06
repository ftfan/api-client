import Data from '@/lib/data';
import Vue from 'vue';
import { FMexNoOrder } from '@/types/Runner';
import { CodeObj, Code } from '@/types/Code';
import lodash from 'lodash';
import { FMex } from '@/api/FMex';
import moment from 'moment';

/**
 * 挂单程序思路
 * 实时监控价格，防止挂单被成交；
 * 每 60 秒 获取一次订单列表，校对当前挂单。
 */

class Store extends Data {
  readonly state = {
    PromiseMap: {} as any,
    RunFunThrottle: lodash.throttle(this.Run.bind(this), 200),
  };

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

    setTimeout(() => {
      Vue.DataStore.state.DataVue.$on('ticker', this.state.RunFunThrottle);
      Vue.DataStore.state.DataVue.$on('candle', this.state.RunFunThrottle);
      Vue.DataStore.state.DataVue.$on('depth', this.state.RunFunThrottle);
      this.CheckOrder();
      setInterval(this.CheckOrder.bind(this), 60000);
    }, 2000);
  }

  /**
   * 获取订单数据，校准挂单信息
   */
  async CheckOrder(): Promise<any> {
    const api = await Vue.UserStore.GetFirstApiHandler();
    if (api.Error()) return Vue.prototype.$message.error(api.Msg);
    const res = await api.Data.Orders();
    if (res.Error()) {
      // 出错了。继续调用，
      Vue.prototype.$message.error(res.Msg);
      return this.CheckOrder();
    }
    if (!res.Data.result) return;
    if (!res.Data.result.length) return;
    console.log(res.Data);
    // 遍历一遍当前的挂单列表，校对里面认为有订单的信息；
    this.localState.OrderList.forEach((item) => {
      if (!item.IsRun) return;
      if (!item.Data) return; // 没有订单，无法校准。目前没有唯一标志可以校验。
      const order = res.Data.result.filter((order: any) => order.id === item.Data.id)[0];
      // 订单丢失
      if (!order) {
        Vue.prototype.$message.error('订单丢失:' + item.OrderId);
        item.Data = null;
        item.OrderId = '';
      } else {
        item.Data = order;
      }
      this.state.RunFunThrottle();
    });
  }

  /**
   * 对挂单进行判断
   */
  Run() {
    if (!Vue.DataStore.state.ticker) return;
    console.log('Runner-Order-Run');
    const CurrentDayStr = moment(new Date()).format('YYYY-MM-DD');
    const BuyPrice = Vue.DataStore.state.ticker.ticker[2];
    const SellPrice = Vue.DataStore.state.ticker.ticker[4];
    this.localState.OrderList.forEach((item) => {
      // 不在运行状态
      if (!item.IsRun) {
        if (item.Data) this.CancelOrder(item); // 取消掉的订单
        return;
      }
      if (!item.Data) return this.CreateOrder(item); // 还没有订单的，去补充订单信息

      const BasePrice = item.Side === FMex.SideEnum.Buy ? BuyPrice : SellPrice;
      item.Percent = (Math.abs(BasePrice - item.Data.price) / BasePrice) * 100;

      if (item.Percent <= item.MinPercent || item.Percent >= item.MaxPercent) return this.CancelOrder(item);
      if (moment(new Date(item.Data.created_at)).format('YYYY-MM-DD') !== CurrentDayStr) return this.CancelOrder(item); // 昨天的订单。取消掉
    });
  }

  // 挂单数据取消订单
  async CancelOrder(item: FMexNoOrder) {
    const key = item.Id + ':cancel';
    if (this.state.PromiseMap[key]) return this.state.PromiseMap[key];
    return (this.state.PromiseMap[key] = new Promise(async (resolve) => {
      const api = await Vue.UserStore.GetFirstApiHandler();
      if (api.Error()) return Vue.prototype.$message.error(api.Msg);
      api.Data.OrderCancel(item.OrderId).then((res) => {
        this.state.PromiseMap[key] = null;
        if (res.Error()) {
          Vue.prototype.$message.error(res.Msg);
          // 1797 订单未发现，姑且认定为已取消
          if ([1797].indexOf(res.Code) === -1) return; // 非 【订单已取消、已失效等状态】
        }
        item.Data = null;
        item.OrderId = '';
        this.state.RunFunThrottle();
      });
    }));
  }

  // 挂单数据补充订单
  async CreateOrder(item: FMexNoOrder) {
    if (this.state.PromiseMap[item.Id]) return this.state.PromiseMap[item.Id];
    return (this.state.PromiseMap[item.Id] = new Promise(async (resolve) => {
      if (!Vue.DataStore.state.ticker) return new CodeObj(Code.Error);
      const api = await Vue.UserStore.GetFirstApiHandler();
      if (api.Error()) return Vue.prototype.$message.error(api.Msg);
      api.Data.CreateOrder({
        symbol: 'BTCUSD_P',
        type: 'LIMIT',
        direction: item.Side === 'buy' ? 'LONG' : 'SHORT',
        post_only: true,
        price: ((basePrice, direct) => {
          const diff = ((item.MinPercent + item.MaxPercent) / 200) * direct;
          const price = Math.round(basePrice * 2 * (1 + diff));
          return price / 2;
        })(Vue.DataStore.state.ticker.ticker[0], item.Side === 'buy' ? -1 : 1),
        quantity: item.Amount,
      }).then((res) => {
        this.state.PromiseMap[item.Id] = null;
        if (res.Error()) return Vue.prototype.$message.error(res.Msg);
        item.Data = res.Data;
        item.OrderId = res.Data.id;
        item.OrderNum = (item.OrderNum || 0) + 1;
      });
    }));
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
