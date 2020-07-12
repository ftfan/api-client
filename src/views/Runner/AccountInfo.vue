<template>
  <div class="AccountInfo" v-loading="loading">
    <el-row style="margin-bottom:6px;">
      <el-col :span="24">
        <el-divider>账户信息</el-divider>
        <el-button type="primary" size="small" :loading="getLoading" @click="AccountInfoShow">获取账户信息</el-button>
        <el-tag class="tag" v-for="item in AccountInfo" :key="item.Name">{{ item.Name }}({{ item.All }}): 可用 {{ item.Able }}，冻结 {{ item.Disable }}，保证金 {{ item.Bao }}</el-tag>

        <el-divider>账户设置</el-divider>
        <el-button type="primary" size="small" @click="SetLeverage">设置btcusdt_p杠杠倍数</el-button>

        <el-divider>其他信息：{{ $DataStore.state.CoinSymbol }}</el-divider>
        <template v-if="$DataStore.state.ticker">
          <el-tag class="tag" size="mini" type="success">{{ $DataStore.state.ticker.ts | DateFormat('YYYY-MM-DD hh:mm:ss') }}</el-tag>
          <el-tag class="tag" size="mini">最新价: {{ $DataStore.state.ticker.ticker[0] }}</el-tag>
          <el-tag class="tag" size="mini">买一: {{ $DataStore.state.ticker.ticker[2] }}</el-tag>
          <el-tag class="tag" size="mini">卖一: {{ $DataStore.state.ticker.ticker[4] }}</el-tag>
          <el-tag class="tag" size="mini">24小时成交: {{ $DataStore.state.ticker.ticker[9] }} USD,（ {{ $DataStore.state.ticker.ticker[10] }} BTC）</el-tag>
        </template>

        <!-- <el-tag class="tag" v-if="$DataStore.state.trade" size="mini">{{ $DataStore.state.CoinSymbol }}: {{ 0 }}({{ $DataStore.state.trade.ts | DateFormat('YYYY-MM-DD hh:mm:ss') }})</el-tag> -->

        <el-divider>其他信息：指数信息</el-divider>
        <el-tag class="tag" size="mini" type="info" v-for="item in $DataStore.state.ListenIndexArr" :key="item.id">{{ item.name }}: {{ item.value }}</el-tag>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Loading } from '@/lib/loading';
import { RunnerSetting } from '@/types/Runner';
import { ipcRenderer } from 'electron';
// import { MyIPC } from '../../lib/BrowserWindow';
import { FMex } from '../../api/FMex';
import echarts from 'echarts';
import { EchartReset, EchartSetData } from '../../lib/View';
import lodash from 'lodash';

export const Setting = new RunnerSetting({
  Name: 'AccountInfo',
  Sort: 1,
  Text: '账户信息',
  VuePath: '/Runner/AccountInfo',
});

const myChart = null as any;

@Component
export default class AccountInfo extends Vue {
  loading = false;
  getLoading = false;
  AccountInfo: any[] = [];

  @Loading()
  async mounted() {
    this.$UserStore.GetFirstWssHandler(); ///
    this.AccountInfoShow();
    // ipcRenderer.send('main-win-size', 800, 740, true);
  }

  // 显示账户信息
  @Loading('getLoading')
  async AccountInfoShow() {
    const api = await this.$UserStore.GetFirstApiHandler();
    if (api.Error()) return this.$message.error(api.Msg);
    const res = await api.Data.FetchBalance();
    if (res.Error()) return this.$message.error(res.Msg);
    this.AccountInfo = [];
    for (const i in res.Data) {
      const val = res.Data[i];
      this.AccountInfo.push({
        Name: i,
        Able: val[0].toFixed(4),
        Disable: val[1].toFixed(4),
        Bao: val[2].toFixed(4),
        All: (val[0] + val[1] + val[2]).toFixed(4),
      });
    }
  }

  SetLeverage() {
    this.$prompt('！！！杠杠设置是通用的，请了解原理，谨慎设置，谨防爆仓；', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: '1',
      inputPattern: /[\d]+/,
      inputErrorMessage: '输入格式不正确',
    }).then(async (res: any) => {
      const leverage = parseInt(res.value) || 0;
      const api = await this.$UserStore.GetFirstApiHandler();
      if (api.Error()) return this.$message.error(api.Msg);
      const post = await api.Data.SetLeverage('BTCUSD_P', leverage);
      if (post.Error()) return this.$message.error(post.Msg);
      this.$message.success('设置成功');
    });
  }
}
</script>

<style scoped lang="scss">
.tag {
  margin: 4px;
}
.AccountInfo {
  text-align: left;
}
</style>
