<template>
  <div>
    <el-button size="mini" type="primary" slot="reference" @click="visible = true">设置</el-button>
    <el-dialog :visible.sync="visible" fullscreen>
      <el-form :inline="true" :model="Setting" class="form-inline" size="mini">
        <el-form-item label="市商ID">
          <el-input style="width:100px;" v-model="Setting.affiliate_code" placeholder="策略市商ID，下单时返佣"></el-input>
        </el-form-item>
        <el-form-item label="消息通知">
          <el-select style="width:100px;" v-model="Setting.OpenNotification" placeholder="桌面消息通知">
            <el-option label="开启" :value="true"></el-option>
            <el-option label="关闭" :value="false"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-input style="width:250px;" v-model.trim="Setting.FMexApiBaseUrl" placeholder="FMex API">
            <div slot="prepend">FMex API</div>
          </el-input>
          <el-input style="width:250px;" v-model.trim="Setting.FMexApiBaseUrlSign" placeholder="FMex API 签名">
            <div slot="prepend">签名域名</div>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input style="width:250px;" v-model.trim="Setting.FMexWssBaseUrl" placeholder="FMex WSS">
            <div slot="prepend">FMex WSS</div>
          </el-input>
          <el-input style="width:250px;" v-model.trim="Setting.FMexWssBaseUrlSign" placeholder="FMex WSS 签名">
            <div slot="prepend">签名域名</div>
          </el-input>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import { Loading } from '@/lib/loading';
import { SecretKey } from '@/types/Secret';
import { sleep } from '@/lib/utils';
import { FMex } from '@/api/FMex';

export const Setting = {
  Name: 'SettingConfig',
  Sort: 2,
};

@Component
export default class SettingConfig extends Vue {
  visible = false;
  loading = false;

  get Setting() {
    return this.$AppStore.localState.Setting;
  }

  onSubmit() {
    //
  }
}
</script>

<style scoped lang="scss"></style>
