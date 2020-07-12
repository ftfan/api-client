<template>
  <div class="Order" v-loading="loading">
    <el-button type="success" size="small" @click="visible = true">新增挂单</el-button>

    <el-tag type="info" v-if="$DataStore.state.LastData" size="mini" style="margin-left:4px;"> 【{{ $DataStore.state.LastData.ts | DateFormat }}】价格： {{ $DataStore.state.LastData.Price }} </el-tag>
    <el-table :data="tableData" size="mini">
      <el-table-column label="排序" width="50px">
        <el-button slot-scope="scope" v-if="scope.$index !== 0" @click="SortUp(scope.row)" type="success" icon="el-icon-top" size="mini" circle></el-button>
      </el-table-column>
      <el-table-column prop="OrderNum" label="下单次数"></el-table-column>
      <el-table-column prop="EndNum" label="成交/取消"></el-table-column>
      <!-- <el-table-column prop="OrderId" label="订单ID"></el-table-column> -->
      <el-table-column label="订单价格">
        <template slot-scope="scope">
          <span v-if="scope.row.Data">
            {{ scope.row.Data.price }}
            <template v-if="scope.row.OrderType === 'long'">({{ scope.row.Percent | toFixed(2) }}%)</template>
            <template v-else>({{ scope.row.Side === 'buy' ? '买' : '卖' }}{{ scope.row.Percent }})</template>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="MinPercent" label="挂单范围">
        <span slot-scope="scope" v-if="scope.row.OrderType === 'long'">{{ scope.row.MinPercent }}% ~ {{ scope.row.MaxPercent }}%</span>
        <span slot-scope="scope" v-else>{{ scope.row.Side === 'buy' ? '买' : '卖' }}{{ scope.row.MinPercent }} ~ {{ scope.row.Side === 'buy' ? '买' : '卖' }}{{ scope.row.MaxPercent }}</span>
      </el-table-column>
      <el-table-column prop="Amount" label="挂单 USD"></el-table-column>
      <el-table-column prop="Side" label="方向">
        <el-tag slot-scope="scope" size="mini" :type="scope.row.Side === 'buy' ? 'success' : 'warning'">{{ scope.row.Side === 'buy' ? '买单' : '卖单' }}</el-tag>
      </el-table-column>
      <el-table-column label="操作">
        <div slot-scope="scope">
          <el-button type="text" size="mini" @click="DeleteData(scope.row)">删除</el-button>
          <el-switch v-model="scope.row.IsRun" @input="IsRunChange(scope.row)" active-color="#13ce66"></el-switch>
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
        <template slot="prepend">金额</template>
        <template slot="append">USD</template>
      </el-input>
      <hr />

      <el-radio-group v-model="TempData.OrderType" size="mini">
        <el-radio-button label="long">远端挂单</el-radio-button>
        <el-radio-button label="short">近端挂单</el-radio-button>
      </el-radio-group>
      <template v-if="TempData.OrderType === 'long'">
        <el-input size="mini" style="width:320px;margin: 0 2px;" v-model.number="TempData.MinPercent" type="number">
          <template slot="prepend">挂单范围(起始)</template>
          <template slot="append">%</template>
        </el-input>
        <el-input size="mini" style="width:320px;margin: 0 2px;" v-model.number="TempData.MaxPercent" type="number">
          <template slot="prepend">挂单范围(结束)</template>
          <template slot="append">%</template>
        </el-input>
      </template>
      <template v-else>
        <el-input size="mini" style="width:320px;margin: 0 2px;" v-model.number="TempData.MinPercent" type="number">
          <template slot="prepend">档位范围(起始)</template>
          <template slot="append">档</template>
        </el-input>
        <el-input size="mini" style="width:320px;margin: 0 2px;" v-model.number="TempData.MaxPercent" type="number">
          <template slot="prepend">档位范围(结束)</template>
          <template slot="append">档</template>
        </el-input>
      </template>

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

  IsRunChange(item: FMexNoOrder) {
    if (!item.IsRun) {
      this.$RunnerOrder.CancelOrder(item);
    }
    this.$RunnerOrder.Run();
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

  SortUp(item: FMexNoOrder) {
    const index = this.tableData.indexOf(item);
    if (index <= 0) return;
    const bak = this.tableData[index - 1];
    this.tableData.splice(index - 1, 1, item);
    this.tableData.splice(index, 1, bak);
  }

  CreateNoOrder() {
    // 校验
    // this.TempData.OrderId; // 先撤单
    const MinPercent = this.TempData.MinPercent;
    const MaxPercent = this.TempData.MaxPercent;
    const Amount = this.TempData.Amount;
    if (isNaN(MinPercent) || isNaN(MaxPercent) || MinPercent > MaxPercent) return this.$message.error('范围填写错误');
    if (isNaN(Amount) || Amount < 1) return this.$message.error('USD金额错误');
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
