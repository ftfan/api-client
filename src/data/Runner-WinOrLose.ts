import Data from '@/lib/data';
import Vue from 'vue';
import { WinOrLoseOrder } from '@/types/Runner';
import { FMex } from '@/api/FMex';
import lodash from 'lodash';
import BigNumber from 'bignumber.js';

class Store extends Data {
  readonly state = {
    RunFunThrottle: lodash.throttle(this.Run.bind(this), 200),
    PromiseMap: {} as any,
  };

  readonly sessionState = {};

  readonly localState = {
    WinType: 'close', // 移动止盈
    WinValue: 1, // 止盈 1 %
    LoseType: 'move', // 固定止损
    LoseValue: 1, // 止损 1 %

    Orders: [] as WinOrLoseOrder[],
    HistoryOrders: [] as WinOrLoseOrder[],
  };

  // 模块名称，【必须】不能重复
  // 格式为 AAA:BBB:CCC ，指当前模块属于 AAA.BBB 模块，名为 CCC
  protected name = `fmex:runner-winorlose`;

  constructor() {
    super();
    this.initilization();
    setTimeout(() => {
      Vue.DataStore.state.DataVue.$on('ticker', this.state.RunFunThrottle);
      Vue.DataStore.state.DataVue.$on('candle', this.state.RunFunThrottle);
      Vue.DataStore.state.DataVue.$on('depth', this.state.RunFunThrottle);
      Vue.DataStore.state.DataVue.$on('CheckOrder', this.CheckOrder.bind(this));
    }, 2000);
  }

  /**
   * 获取订单数据，校准挂单信息
   */
  async CheckOrder(resData: any): Promise<any> {
    if (!Vue.DataStore.state.Runing) return Promise.resolve(false);
    this.localState.Orders.forEach((item) => {
      if (!item.LoseOrder && !item.WinOrder) return;

      const LoseOrder = resData.result.filter((order: any) => item.LoseOrder && order.id === item.LoseOrder.id)[0];
      const WinOrder = resData.result.filter((order: any) => item.WinOrder && order.id === item.WinOrder.id)[0];
      if (item.WinOrder) {
        if (WinOrder) return Vue.set(item, 'WinOrder', WinOrder);
        return this.UpdateItem(item);
      }
      if (item.LoseOrder) {
        if (LoseOrder) return Vue.set(item, 'LoseOrder', WinOrder);
        return this.UpdateItem(item);
      }
    });
  }

  AddOrder(order: FMex.OrderDto) {
    Vue.WinOrLose.localState.Orders.push(new WinOrLoseOrder(order));
  }

  Run() {
    if (!Vue.DataStore.state.Runing) return;
    if (!Vue.DataStore.state.ticker) return;
    this.localState.Orders.forEach((item) => {
      const isLong = item.Order.direction === 'long';
      const direction = item.Order.direction === 'long' ? 'SHORT' : 'LONG';
      // 止盈校验
      (() => {
        if (item.WinOrder) return;
        if (this.localState.WinValue === 0) return;
        // 固定止盈
        return this.CreateOrder(item, 'WinOrder', {
          price: (item.Order.price * 10 + this.localState.WinValue * (isLong ? 1 : -1) * 10) / 10,
          direction: direction,
          type: 'LIMIT',
          post_only: true,
        });
      })();

      // 止损校验
      (() => {
        // 移动止损
        // if (item.LoseOrder) return;
        // if (this.localState.LoseType === 'move') {
        //   return this.CreateOrder(item, 'LoseOrder', {
        //     trailing_distance: this.localState.LoseValue,
        //     trigger_direction: direction,
        //     direction: direction,
        //     type: 'MARKET',
        //   });
        // }
        // return this.CreateOrder(item, 'LoseOrder', {
        //   price: (item.Order.price * 10 - this.localState.LoseValue * (isLong ? 1 : -1) * 10) / 10,
        //   direction: direction,
        //   type: 'LIMIT',
        // });
      })();
    });
  }

  async CreateOrder(item: WinOrLoseOrder, okey: 'WinOrder' | 'LoseOrder', params: any) {
    const key = item.Order.id + okey;
    if (this.state.PromiseMap[key]) return this.state.PromiseMap[key];
    return (this.state.PromiseMap[key] = new Promise(async (resolve) => {
      const api = await Vue.UserStore.GetFirstApiHandler();
      if (api.Error()) return Vue.prototype.$message.error(api.Msg);
      api.Data.CreateOrder(
        Object.assign(
          {
            symbol: 'BTCUSD_P',
            quantity: item.quantity,
          },
          params
        )
      ).then((res) => {
        delete this.state.PromiseMap[key];
        if (res.Error()) return Vue.prototype.$message.error(res.Msg);
        item[okey] = res.Data;
      });
    }));
  }

  // 取消订单
  async CancelOrder(id: number, item: WinOrLoseOrder, del: 'WinOrder' | 'LoseOrder', type: 'delete' | 'update' = 'delete') {
    const key = id + ':cancel';
    if (this.state.PromiseMap[key]) return this.state.PromiseMap[key];
    return (this.state.PromiseMap[key] = new Promise(async (resolve) => {
      const api = await Vue.UserStore.GetFirstApiHandler();
      if (api.Error()) return Vue.prototype.$message.error(api.Msg);
      api.Data.OrderCancel(id).then(async (res) => {
        delete this.state.PromiseMap[key];
        if (res.Error()) {
          const ord = await api.Data.OrderById(id);
          if (ord.Error()) return Vue.prototype.$message.error(ord.Msg);
          res.Data = ord.Data;
        }
        // 被成交的订单
        if (res.Data && FMex.OrderStateEnded.indexOf(res.Data.status) > -1) {
          Vue.prototype.$message.error('订单被成交，无法撤销');
        } else {
          if (type === 'delete') {
            item[del] = null;
          } else {
            item[del] = res.Data;
            this.UpdateItemInfo(item);
          }
        }
      });
    }));
  }

  async UpdateItem(item: WinOrLoseOrder) {
    const key = item.Order.id + 'update';
    if (this.state.PromiseMap[key]) return this.state.PromiseMap[key];
    return (this.state.PromiseMap[key] = new Promise(async (resolve) => {
      const api = await Vue.UserStore.GetFirstApiHandler();
      if (api.Error()) return Vue.prototype.$message.error(api.Msg);
      const [win, lose] = await Promise.all([item.WinOrder ? api.Data.OrderById(item.WinOrder.id) : null, item.LoseOrder ? api.Data.OrderById(item.LoseOrder.id) : null]);
      delete this.state.PromiseMap[key];
      if (win && win.Error()) Vue.prototype.$message.error(win.Msg);
      if (lose && lose.Error()) Vue.prototype.$message.error(lose.Msg);
      if (win && win.Data) Vue.set(item, 'WinOrder', win.Data);
      if (lose && lose.Data) Vue.set(item, 'LoseOrder', lose.Data);
      const EndOrder = () => {
        const index = this.localState.Orders.indexOf(item);
        if (index === -1) return;
        this.localState.Orders.splice(index, 1);
        this.localState.HistoryOrders.unshift(item);
        if (this.localState.HistoryOrders.length >= 200) this.localState.HistoryOrders.pop();
        this.UpdateItemInfo(item);
      };

      // 结算
      if (item.WinOrder && FMex.OrderStateEnded.indexOf(item.WinOrder.status) > -1) {
        if (item.LoseOrder) this.CancelOrder(item.LoseOrder.id, item, 'LoseOrder', 'update');
        EndOrder();
        return;
      }
      if (item.LoseOrder && FMex.OrderStateEnded.indexOf(item.LoseOrder.status) > -1) {
        if (item.WinOrder) this.CancelOrder(item.WinOrder.id, item, 'WinOrder', 'update');
        EndOrder();
        return;
      }
    }));
  }

  // 对数据进行结算
  UpdateItemInfo(item: WinOrLoseOrder) {
    const isLong = item.Order.direction === 'long';
    const play = new BigNumber(item.quantity).dividedBy(item.Order.fill_price);
    const WinOrder = item.WinOrder ? new BigNumber(item.quantity).dividedBy(item.WinOrder.fill_price) : 0;
    const LoseOrder = item.LoseOrder ? new BigNumber(item.quantity).dividedBy(item.LoseOrder.fill_price) : 0;
    if (WinOrder && LoseOrder) return (item.error = '限价止盈和移动止损订单同时被成交');

    // 一共付出的手续费。
    const fee = new BigNumber(item.Order.fee).plus(item.WinOrder ? item.WinOrder.fee : 0).plus(item.LoseOrder ? item.LoseOrder.fee : 0);
    let diff = play.minus(WinOrder || LoseOrder).multipliedBy(-1); // WinOrder || LoseOrder - play;
    if (!isLong) diff = diff.multipliedBy(-1);
    diff = diff.minus(fee);
    const diffP = diff.dividedBy(item.Order.fill_price).multipliedBy(100);
    item.diff = diff.toNumber();
    item.diffP = diffP.toNumber();
  }
}

export const WinOrLose = new Store();

declare module 'vue/types/vue' {
  interface Vue {
    $WinOrLose: Store;
  }
  interface VueConstructor {
    WinOrLose: Store;
  }
}

Vue.use((Vue) => {
  Vue.prototype.$WinOrLose = WinOrLose;
  Vue.WinOrLose = WinOrLose;
});
