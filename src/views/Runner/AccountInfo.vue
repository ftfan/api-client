<template>
  <div class="AccountInfo" v-loading="loading">
    <el-row style="margin-bottom:6px;">
      <el-col :span="24">
        <el-tag size="mini">BTCUSD_P：{{ 0 }}({{ $DataStore.state.DepthData.ts | DateFormat('hh:mm:ss') }})</el-tag>

        <el-tag size="mini" type="info" v-for="item in $DataStore.state.ListenIndexArr" :key="item.id">{{ item.name }}: {{ item.value }}</el-tag>
        <br />
        <el-tag v-for="item in AccountInfo" :key="item.Name">{{ item.Name }}({{ item.All }}): 可用 {{ item.Able }}，冻结 {{ item.Disable }}，保证金 {{ item.Bao }}</el-tag>
        <el-button type="primary" size="small" @click="SetLeverage">设置btcusdt_p杠杠倍数</el-button>
        <br />
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
  AccountInfo = [];

  @Loading()
  async mounted() {
    ipcRenderer.send('main-win-size', 800, 740, true);
  }

  SetLeverage() {
    this.$prompt('！！！杠杠设置是通用的，请了解原理再修改，谨防爆仓；1倍最安全', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: '1',
      inputPattern: /[\d]+/,
      inputErrorMessage: '输入格式不正确',
    }).then((res: any) => {
      const leverage = parseInt(res.value) || 0;
      // UserStore.state.FMex.SetLeverage('BTCUSD_P', leverage).then(res => {
      //   if (res.status) return this.$message.error(res.message || res.msg);
      // });
    });
  }
}
</script>

<style scoped lang="scss">
.AccountInfo {
}
</style>
