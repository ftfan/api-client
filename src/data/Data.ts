import Data from '@/lib/data';
import Vue from 'vue';
import { FMex } from '@/api/FMex';
import { CodeObj, Code } from '@/types/Code';
let wss: null | FMex.Ws = null;

const error = new CodeObj(Code.Error);

const DepthData: FMex.WsDepthRes = {
  type: '',
  ts: 0,
  seq: 0,
  bids: [],
  asks: [],
};

class Store extends Data {
  readonly state = {
    CoinSymbol: 'btcusd_p',
    candles: [] as FMex.CandelRes[],
    candlesMap: new Map<number, FMex.CandelRes>(),
    ticker: null as null | FMex.WsTickerRes,
    // trade: null as null | FMex.WsTradeRes,

    DepthData: DepthData,

    ListenIndexArr: [
      { id: '.btcins1d', name: '风险准备金1D', value: 0, time: 0 },
      { id: '.btcins1h', name: '风险准备金1H', value: 0, time: 0 },
      { id: '.btcusd_spot', name: '指数价格', value: 0, time: 0 },
      { id: '.btcusdfair', name: '标记价格', value: 0, time: 0 },
      { id: '.btcusdfr', name: '预估资金费率', value: 0, time: 0 },
      { id: '.btcusdfr8h', name: '资金费率8H', value: 0, time: 0 },
      { id: '.btcusdlr1d', name: '利息差率指数', value: 0, time: 0 },
      { id: '.btcusdpi', name: '溢价指数', value: 0, time: 0 },
      { id: '.btcusdpi8h', name: '溢价8H指数', value: 0, time: 0 },
      { id: '.btcusdpimax', name: '最大溢价边界值指数', value: 0, time: 0 },
    ],
  };

  readonly sessionState = {};

  readonly localState = {};

  // 模块名称，【必须】不能重复
  // 格式为 AAA:BBB:CCC ，指当前模块属于 AAA.BBB 模块，名为 CCC
  protected name = `fmex:data`;

  constructor() {
    super();
    this.initilization();
  }

  /**
   * 启动行情数据监控
   * 因为多窗口之间数据要保持一致，又不想让费CPU和带宽。
   * 所以使用主窗口在策略界面启动该程序，其他窗口监听行情即可。
   */
  async Run() {
    wss = new FMex.Ws();
    await this.LoadSymbol(this.state.CoinSymbol);
  }

  async LoadSymbol(CoinSymbol: string) {
    if (!wss) return error;
    this.ListenIndex();
    const res = await wss.req('candle', FMex.Resolution.M1, CoinSymbol, 1441, Date.now());
    if (!res.data) return error;
    this.state.candles = res.data;
    res.data.forEach((candle) => {
      this.state.candlesMap.set(candle.id, candle);
    });

    // 监听K线数据
    const subCandle = wss.sub('candle', FMex.Resolution.M1, CoinSymbol);
    subCandle.ondata((data) => {
      const old = this.state.candlesMap.get(data.id);
      if (old) {
        Object.assign(old, data);
        return;
      }
      this.state.candlesMap.set(data.id, data);
      this.state.candles.push(data);
    });

    // 监听盘口深度数据
    const subDepth = wss.sub('depth', FMex.DepthLevel.L20, CoinSymbol);
    subDepth.ondata((data) => {
      this.state.DepthData = data;
    });

    // 监听最新价格
    const subTicker = wss.sub('ticker', CoinSymbol);
    subTicker.ondata((data) => {
      this.state.ticker = data;
    });

    // 监听最近成交
    // const subTrade = wss.sub('trade', CoinSymbol);
    // subTrade.ondata((data) => {
    //   this.state.trade = data;
    // });
  }

  ListenIndex() {
    this.state.ListenIndexArr.forEach((item) => {
      if (!wss) return;
      const sub = wss.sub('index', item.id);
      sub.ondata((data) => {
        item.value = data.index[1];
        item.time = data.index[0];
      });
    });
  }
}

export const DataStore = new Store();

declare module 'vue/types/vue' {
  interface Vue {
    $DataStore: Store;
  }
  interface VueConstructor {
    DataStore: Store;
  }
}

Vue.use((Vue) => {
  Vue.prototype.$DataStore = DataStore;
  Vue.DataStore = DataStore;
});
