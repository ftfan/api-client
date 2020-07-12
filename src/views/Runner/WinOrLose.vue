<template>
  <div class="WinOrLose" v-loading="loading">
    <!-- <div style="display:inline-block;">
      <el-radio-group v-model="$WinOrLose.localState.LoseType" size="mini">
        <el-radio-button label="move">移动止损</el-radio-button>
        <el-radio-button label="static">固定止损</el-radio-button>
      </el-radio-group>
      <el-input style="margin-left:10px;width:250px;" size="mini" v-model.number="$WinOrLose.localState.LoseValue">
        <template slot="prepend">移动止损</template>
        <template slot="append">USD</template>
      </el-input>
    </div> -->
    <div style="display:inline-block;">
      <!-- <el-radio-group v-model="$WinOrLose.localState.WinType" size="mini">
        <el-radio-button label="open">固定止盈【开】</el-radio-button>
        <el-radio-button label="close">固定止盈【关】</el-radio-button>
      </el-radio-group> -->
      <el-input style="margin-left:10px;width:250px;" size="mini" v-model.number="$WinOrLose.localState.WinValue">
        <template slot="prepend">止盈价差</template>
        <template slot="append">USD</template>
      </el-input>
    </div>
    <br />
    <br />
    <el-radio-group v-model="switchSource" size="small">
      <el-radio-button label="Orders">未完成订单</el-radio-button>
      <el-radio-button label="HistoryOrders">已完结订单</el-radio-button>
    </el-radio-group>

    <el-button type="warning" @click="ClearHistory" size="mini" v-if="switchSource === 'HistoryOrders'" style="margin-left:20px">清空</el-button>

    <el-table :data="tableData" size="mini" height="500px">
      <el-table-column label="排序" width="50px">
        <el-button slot-scope="scope" v-if="scope.$index !== 0" @click="SortUp(scope.row)" type="success" icon="el-icon-top" size="mini" circle></el-button>
      </el-table-column>
      <el-table-column label="订单信息">
        <template slot-scope="scope" v-if="scope.row.Order">
          <span v-if="scope.row.Order.direction === 'long'">
            <el-tag type="success" size="mini">{{ scope.row.Order.price }}</el-tag>
            做多
            {{ scope.row.Order.quantity }} USD
          </span>
          <span v-else>
            <el-tag type="warning" size="mini">{{ scope.row.Order.price }}</el-tag>
            做空
            {{ scope.row.Order.quantity }} USD
          </span>
        </template>
      </el-table-column>
      <el-table-column label="止盈订单">
        <template slot-scope="scope">
          <span v-if="scope.row.WinOrder">
            <el-tag :type="scope.row.WinOrder.direction === 'long' ? 'success' : 'warning'" size="mini">{{ scope.row.WinOrder.price }}</el-tag>
          </span>
        </template>
      </el-table-column>
      <!-- <el-table-column label="止损订单">
        <template slot-scope="scope">
          <span v-if="scope.row.LoseOrder">
            <template v-if="scope.row.LoseOrder.trigger_on">
              <el-tag type="info" size="mini">{{ scope.row.LoseOrder.trigger_on }}</el-tag>
            </template>
            <template v-else>
              <el-tag type="info" size="mini">{{ scope.row.LoseOrder.price }}</el-tag>
            </template>
            <template v-if="scope.row.LoseOrder.status === 'fully_filled'">【成交】</template>
          </span>
        </template>
      </el-table-column> -->

      <el-table-column label="结算">
        <template slot-scope="scope">
          <template v-if="scope.row.error">
            {{ scope.row.error }}
          </template>
          <template v-else-if="scope.row.diff">
            <el-tag :type="scope.row.diff > 0 ? 'success' : 'wraning'">{{ scope.row.diff.toFixed(5) }}</el-tag>
            ({{ scope.row.diffP.toFixed(3) }}%)
          </template>
        </template>
      </el-table-column>

      <el-table-column label="操作">
        <div slot-scope="scope">
          <el-button type="text" size="mini" @click="DeleteData(scope.row)">删除</el-button>
          <!-- <el-button type="text" size="mini" @click="Update(scope.row)">刷新</el-button> -->
        </div>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Loading } from '@/lib/loading';
import { RunnerSetting, WinOrLoseOrder } from '@/types/Runner';
import lodash from 'lodash';
import '@/data/Runner-WinOrLose';

export const Setting = new RunnerSetting({
  Name: 'WinOrLose',
  Sort: 3,
  Text: '止盈止损',
  VuePath: '/Runner/WinOrLose',
});

@Component
export default class WinOrLose extends Vue {
  loading = false;
  switchSource: 'Orders' | 'HistoryOrders' = 'Orders';

  get tableData() {
    return this.$WinOrLose.localState[this.switchSource];
  }
  SortUp(item: WinOrLoseOrder) {
    const index = this.tableData.indexOf(item);
    if (index <= 0) return;
    const bak = this.tableData[index - 1];
    this.tableData.splice(index - 1, 1, item);
    this.tableData.splice(index, 1, bak);
  }

  async Update(item: WinOrLoseOrder) {
    this.$WinOrLose.UpdateItem(item);
  }

  async DeleteData(item: WinOrLoseOrder) {
    await this.$confirm('确定删除？如果有订单会自动撤单');
    const index = this.tableData.indexOf(item);
    if (index === -1) return;
    this.tableData.splice(index, 1);
    const api = await this.$UserStore.GetFirstApiHandler();
    if (api.Error()) return this.$message.error(api.Msg);
    // 取消订单
    if (item.WinOrder) {
      const res = await api.Data.OrderCancel(item.WinOrder.id);
      if (res.Error()) return this.$message.error(res.Msg);
    }
    if (item.LoseOrder) {
      const res = await api.Data.OrderCancel(item.LoseOrder.id);
      if (res.Error()) return this.$message.error(res.Msg);
    }
    this.$message.success('删除完成');
  }

  ClearHistory() {
    this.$WinOrLose.localState.HistoryOrders.splice(0, this.$WinOrLose.localState.HistoryOrders.length);
  }
}
</script>

<style scoped lang="scss">
.WinOrLose {
  text-align: left;
}
</style>
