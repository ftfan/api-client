<template>
  <div class="Order" v-loading="loading">
    <el-button type="primary" size="small" @click="visible = true">新增</el-button>

    <el-table :data="tableData">
      <el-table-column prop="OrderNum" label="下单次数"></el-table-column>
      <el-table-column prop="EndNum" label="成交/取消"></el-table-column>
      <el-table-column prop="OrderId" label="订单ID"></el-table-column>
      <el-table-column label="订单信息">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.Data">{{ scope.row.Data.price }}：{{ scope.row.Data.quantity }}张</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="MinPercent" label="挂单范围">
        <el-tag slot-scope="scope">{{ scope.row.MinPercent }}% ~ {{ scope.row.MaxPercent }}%</el-tag>
      </el-table-column>
      <el-table-column prop="Amount" label="挂单张数"></el-table-column>
      <el-table-column prop="Side" label="方向">
        <el-tag slot-scope="scope">{{ scope.row.Side === 'buy' ? '买单' : '卖单' }}</el-tag>
      </el-table-column>
      <el-table-column label="操作">
        <div slot-scope="scope">
          <el-button size="mini" @click="DeleteData(scope.row)">删除</el-button>
        </div>
      </el-table-column>
    </el-table>

    <el-dialog title="新增挂单" :visible.sync="visible">
      <el-radio-group v-model="TempData.Side" size="mini">
        <el-radio-button label="buy">买单</el-radio-button>
        <el-radio-button label="sell">卖单</el-radio-button>
      </el-radio-group>
      <hr />
      <el-input size="mini" style="width:230px;" v-model.number="TempData.Amount" type="number">
        <template slot="prepend">数量</template>
        <template slot="append">张</template>
      </el-input>
      <hr />

      <el-input size="mini" style="width:320px;margin: 0 2px;" v-model.number="TempData.MinPercent" type="number">
        <template slot="prepend">挂单范围(小)</template>
        <template slot="append">%</template>
      </el-input>
      <el-input size="mini" style="width:320px;margin: 0 2px;" v-model.number="TempData.MaxPercent" type="number">
        <template slot="prepend">挂单范围(大)</template>
        <template slot="append">%</template>
      </el-input>

      <span slot="footer" class="dialog-footer">
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" @click="CreateNoOrder">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Loading } from '@/lib/loading';
import { RunnerSetting, FMexNoOrder } from '@/types/Runner';
import { ipcRenderer } from 'electron';
// import { MyIPC } from '../../lib/BrowserWindow';
import { FMex } from '../../api/FMex';
import echarts from 'echarts';
import { EchartReset, EchartSetData } from '../../lib/View';
import lodash from 'lodash';
import '@/data/Runner-Order';

export const Setting = new RunnerSetting({
  Name: 'Order',
  Sort: 3,
  Text: '挂单',
  VuePath: '/Runner/Order',
});

const myChart = null as any;

@Component
export default class Order extends Vue {
  loading = false;
  visible = false;
  TempData = new FMexNoOrder();

  get tableData() {
    return this.$RunnerOrder.localState.OrderList;
  }

  @Loading()
  async mounted() {
    // ipcRenderer.send('main-win-size', 800, 740, true);
  }

  async DeleteData(item: FMexNoOrder) {
    await this.$confirm('确定删除？如果有订单会自动撤单');
    const index = this.tableData.indexOf(item);
    if (index === -1) return;
    this.tableData.splice(index, 1);
    // 取消订单
    if (item.OrderId) {
      const api = await this.$UserStore.GetFirstApiHandler();
      if (api.Error()) return this.$message.error(api.Msg);
      const res = await api.Data.OrderCancel(item.OrderId);
      if (res.Error()) return this.$message.error(res.Msg);
    }
    this.$message.success('删除完成');
  }

  CreateNoOrder() {
    // 校验
    // this.TempData.OrderId; // 先撤单
    const MinPercent = this.TempData.MinPercent;
    const MaxPercent = this.TempData.MaxPercent;
    const Amount = this.TempData.Amount;
    if (isNaN(MinPercent) || isNaN(MaxPercent) || MinPercent >= MaxPercent) return this.$message.error('范围填写错误');
    if (isNaN(Amount) || Amount < 1) return this.$message.error('张数错误');
    this.TempData.MinPercent = MinPercent;
    this.TempData.MaxPercent = MaxPercent;
    this.TempData.Amount = Amount;
    this.tableData.push(this.TempData);
    this.TempData = new FMexNoOrder();
    this.visible = false;
  }
}
</script>

<style scoped lang="scss">
.tag {
  margin: 4px;
}
.Order {
  text-align: left;
}
</style>
