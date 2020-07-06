import Data from '@/lib/data';
import Vue from 'vue';
import { FMex } from '@/api/FMex';
import { CodeObj, Code } from '@/types/Code';
import { sleep } from '@/lib/utils';
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
    DataVue: new Vue(),
    CoinSymbol: 'btcusd_p',
    candles: [] as FMex.CandelRes[],
    candlesMap: new Map<number, FMex.CandelRes>(),
    ticker: null as null | FMex.WsTickerRes,
    // trade: null as null | FMex.WsTradeRes,

    // 由各个信息监听，设置
    LastData: null as null | {
      ts: number;
      Price: number;
      BuyPrice: number;
      BuyVol: number;
      SellPrice: number;
      SellVol: number;
    },

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

    Runing: false, // 运行
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
        this.state.DataVue.$emit('candle', data);
        return;
      }
      this.state.candlesMap.set(data.id, data);
      this.state.candles.push(data);
      this.state.DataVue.$emit('candle', data);
    });

    // 监听盘口深度数据
    const subDepth = wss.sub('depth', FMex.DepthLevel.L20, CoinSymbol);
    subDepth.ondata((data) => {
      const bak = this.state.LastData;
      this.state.LastData = {
        ts: data.ts,
        Price: 0,
        BuyPrice: data.bids[0],
        BuyVol: data.bids[1],
        SellPrice: data.asks[0],
        SellVol: data.asks[1],
      };
      const LastData = this.state.LastData;
      if (LastData.Price < LastData.BuyPrice) LastData.Price = LastData.BuyPrice;
      if (LastData.Price > LastData.SellPrice) LastData.Price = LastData.SellPrice;
      if (bak && bak.Price <= LastData.SellPrice && bak.Price >= LastData.BuyPrice) LastData.Price = bak.Price;

      this.state.DepthData = data;
      this.state.DataVue.$emit('depth', data);
    });

    // 监听最新价格
    const subTicker = wss.sub('ticker', CoinSymbol);
    subTicker.ondata((data) => {
      console.log('Data:ticker');

      this.state.LastData = {
        ts: data.ts,
        Price: data.ticker[0],
        BuyPrice: data.ticker[2],
        BuyVol: data.ticker[3],
        SellPrice: data.ticker[4],
        SellVol: data.ticker[5],
      };
      const LastData = this.state.LastData;
      if (LastData.Price < LastData.BuyPrice) LastData.Price = LastData.BuyPrice;
      if (LastData.Price > LastData.SellPrice) LastData.Price = LastData.SellPrice;

      this.state.ticker = data;
      this.state.DataVue.$emit('ticker', data);
    });

    // 监听最近成交
    // const subTrade = wss.sub('trade', CoinSymbol);
    // subTrade.ondata((data) => {
    //   this.state.trade = data;
    // });
  }

  async ListenIndex() {
    this.state.ListenIndexArr.forEach(async (item, index) => {
      if (!wss) return;
      await sleep(index * 100); // 因为请求开始时比较多，这里指数信息缓一缓
      const sub = wss.sub('index', item.id);
      sub.ondata((data) => {
        item.value = data.index[1];
        item.time = data.index[0];
        this.state.DataVue.$emit('index', data);
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
