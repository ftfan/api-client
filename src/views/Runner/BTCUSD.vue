<template>
  <div class="BTCUSD" v-loading="loading">
    <!-- <el-radio-group size="mini" v-model="ViewOptions.Resolution">
      <el-radio-button v-for="item in Resolutions" :key="item" :label="item"></el-radio-button>
    </el-radio-group> -->
    <el-cascader size="mini" :options="Targets" :props="cascaderprops" :show-all-levels="false" v-model="ViewOptions.Target" :collapse-tags="true"></el-cascader>

    <div id="HomeView" style="width:100%;height:600px;"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Loading } from '@/lib/loading';
import { RunnerSetting } from '@/types/Runner';
import { ipcRenderer } from 'electron';
import { MyIPC } from '../../lib/BrowserWindow';
import { FMex } from '../../api/FMex';
import echarts from 'echarts';
import { EchartReset, EchartSetData } from '../../lib/View';
import lodash from 'lodash';

export const Setting = new RunnerSetting({
  Name: 'BTCUSD',
  Sort: 2,
  Text: 'BTCUSD 行情',
  VuePath: '/Runner/BTCUSD',
});

let myChart = null as any;

@Component
export default class BTCUSD extends Vue {
  loading = false;
  Targets = [
    {
      value: 'MA-移动平均线',
      children: [{ value: 'MA5' }, { value: 'MA15' }, { value: 'MA20' }],
    },
    {
      value: 'BOLL-布林线',
      children: [{ value: 'BOLL10' }, { value: 'BOLL20' }, { value: 'BOLL30' }],
    },
    {
      value: 'OBV-能量潮',
      children: [{ value: 'OBV' }, { value: 'OBV*多空比例净额' }],
    },
  ];
  cascaderprops = { multiple: true, emitPath: false, label: 'value' };
  Resolutions = [
    FMex.Resolution.M1,
    FMex.Resolution.M3,
    FMex.Resolution.M5,
    FMex.Resolution.M15,
    FMex.Resolution.M30,
    FMex.Resolution.H1,
    FMex.Resolution.H4,
    FMex.Resolution.H6,
    FMex.Resolution.D1,
    FMex.Resolution.W1,
    FMex.Resolution.MN,
  ];
  ViewOptions = {
    Resolution: FMex.Resolution.M1,
    Target: ['BOLL20'],
    CoinSymbol: Vue.DataStore.state.CoinSymbol,
  };

  // @Watch('ViewOptions.Resolution', { immediate: true })
  // async ResolutionChange() {
  //   this.$DataStore.state.candles = await MyIPC.req(this.$DataStore.state.CoinSymbol, this.ViewOptions.Resolution);
  // }

  @Loading()
  async mounted() {
    // ipcRenderer.send('main-win-size', 800, 740, true);
    // await this.ResolutionChange();
    this.ResetView();
  }

  @Watch('$DataStore.state.candles', { deep: true })
  OnDataChange = lodash.throttle(() => {
    this.UpdateEchartUi();
  }, 200);

  UpdateEchartUi() {
    if (!myChart) return;
    const candles = this.$DataStore.state.candles.map((item) => {
      return {
        timestamp: item.timestamp,
        open: item.open,
        close: item.close,
        // diff: string;
        low: item.low,
        high: item.high,
        volume: item.base_vol,
        currency_volume: item.quote_vol,
      };
    });
    EchartSetData(myChart, candles, this.ViewOptions);
  }

  ResetView() {
    myChart = echarts.init(document.getElementById('HomeView') as HTMLDivElement);
    EchartReset(myChart);
    this.OnDataChange();
  }
}
</script>

<style scoped lang="scss">
.BTCUSD {
  text-align: left;
}
</style>
