<template>
  <div>
    <el-button size="mini" type="primary" slot="reference" @click="visible = true">API管理</el-button>
    <el-dialog :visible.sync="visible" fullscreen>
      <el-button size="mini" type="primary" @click="CreateApiEmit" v-show="!EditerApi">新增API</el-button>
      <span>可以保存多个，运行时，默认选中第一个</span>
      <div v-if="IsCreateApi" style="margin-top:10px;" v-loading="loading">
        <el-input size="mini" style="margin-bottom:8px;" type="text" placeholder="请输入备注(选填)" v-model="NewApi.Desc">
          <div slot="prepend" style="width:70px;">备注</div>
        </el-input>
        <el-input size="mini" style="margin-bottom:8px;" type="text" placeholder="请输入 Key" v-model="NewApi.Key">
          <div slot="prepend" style="width:70px;">Key</div>
        </el-input>
        <el-input size="mini" style="margin-bottom:8px;" type="text" show-password placeholder="请输入 Secret" v-model="NewApi.Secret">
          <div slot="prepend" style="width:70px;">Secret{{ EditerApi && EditerApi.Secret === NewApi.Secret ? '(加密)' : '' }}</div>
        </el-input>
        <el-input size="mini" style="margin-bottom:8px;" type="password" show-password placeholder="请输入 密码" v-model="pwd">
          <div slot="prepend" style="width:70px;">密码</div>
        </el-input>
        <div style="text-align:right;">
          <el-button size="mini" type="default" @click="CancelApiCreate">取消</el-button>
          <el-button size="mini" type="default" @click="TestNewApi">测试</el-button>
          <el-button size="mini" type="success" @click="CreateApi">确定</el-button>
        </div>
      </div>
      <el-table border v-else :data="$UserStore.localState.SecretKeys" size="mini" style="width:100%;">
        <el-table-column label="排序" width="50px">
          <el-button slot-scope="scope" v-if="scope.$index !== 0" @click="SortUp(scope.row, scope)" type="success" icon="el-icon-top" size="mini" circle></el-button>
        </el-table-column>
        <el-table-column prop="Desc" label="备注"></el-table-column>
        <el-table-column prop="Key" label="Key" width="250px"></el-table-column>
        <el-table-column label="操作" fixed="right" width="50px">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="EditApt(scope.row)" style="margin-left:0;">编辑</el-button>
            <el-popover class="item" effect="dark" trigger="click" placement="top-end">
              <el-button type="danger" size="mini" @click="DeleteApi(scope.row)">确认删除该API</el-button>
              <el-button type="text" size="mini" slot="reference" style="margin-left:0;">删除</el-button>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
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
import { MyConfig } from '../../config';

export const Setting = {
  Name: 'SettingApi',
  Sort: 1,
};

@Component
export default class SettingApi extends Vue {
  visible = false;
  loading = false;
  pwd = '';
  IsCreateApi = false;

  EditerApi = null as null | SecretKey;
  NewApi: SecretKey = {
    Key: '',
    Secret: '',
    Desc: '',
    Pwd: '',
  };

  CreateApiEmit() {
    if (this.$AppStore.localState.NetEnv === 'fmextest.net') {
      this.NewApi.Desc = '这是个只读权限的 API，仅供预览';
      this.NewApi.Key = MyConfig.TestApi.Key;
      this.NewApi.Secret = MyConfig.TestApi.Secret;
    }
    this.IsCreateApi = true;
  }

  CancelApiCreate() {
    this.IsCreateApi = false;
    this.EditerApi = null;
  }

  async EditApt(api: SecretKey) {
    console.log(api);
    Object.assign(this.NewApi, api);
    this.EditerApi = api;
    this.IsCreateApi = true;
  }

  SortUp(api: SecretKey) {
    const index = this.$UserStore.localState.SecretKeys.indexOf(api);
    if (index <= 0) return;
    const bak = this.$UserStore.localState.SecretKeys[index - 1];
    this.$UserStore.localState.SecretKeys.splice(index - 1, 1, api);
    this.$UserStore.localState.SecretKeys.splice(index, 1, bak);
  }

  async DeleteApi(api: SecretKey) {
    const res = await this.$UserStore.DeleteApi(api);
    if (res.Error()) return this.$message.error(res.Msg);
    this.$message.success('api 已删');
  }

  @Loading()
  async TestNewApi() {
    this.NewApi.Key = this.NewApi.Key.trim();
    this.NewApi.Secret = this.NewApi.Secret.trim();
    let Secret = this.NewApi.Secret;
    if (this.EditerApi && this.EditerApi.Secret === this.NewApi.Secret) {
      const pwd = await this.$UserStore.CheckPassword(this.pwd);
      if (pwd.Error()) return this.$message.error(pwd.Msg);
      const sec = await this.$UserStore.SecretParse(this.EditerApi.Secret, this.pwd);
      if (sec.Error()) return this.$message.error(sec.Msg);
      Secret = sec.Data;
    }
    const fmex = new FMex.Api(this.NewApi.Key, Secret);
    const data = await fmex.FetchBalance();
    if (data.Error()) return this.$message.error(data.Msg);
    this.$message.success('api 可用');
  }

  @Loading()
  async CreateApi() {
    this.NewApi.Key = this.NewApi.Key.trim();
    this.NewApi.Secret = this.NewApi.Secret.trim();
    this.NewApi.Desc = this.NewApi.Desc.trim();
    this.NewApi.Pwd = this.NewApi.Pwd.trim();
    // if (!this.NewApi.Desc) return this.$message.error('备注 未填写');
    if (!this.NewApi.Key) return this.$message.error('Key 未填写');
    if (!this.NewApi.Secret) return this.$message.error('Secret 未填写');
    // const pwd = await this.$UserStore.PromptPassword();
    // if (pwd.Error()) return this.$message.error(pwd.Msg);
    const res = await this.$UserStore.CreateKey(this.NewApi, this.pwd, this.EditerApi);
    if (res.Error()) return this.$message.error(res.Msg);
    if (this.EditerApi) {
      this.$message.success('保存成功');
    } else {
      this.$message.success('新增成功');
    }
    this.IsCreateApi = false;
    this.NewApi.Key = '';
    this.NewApi.Secret = '';
    this.NewApi.Desc = '';
    this.NewApi.Pwd = '';
    this.EditerApi = null;
  }
}
</script>

<style scoped lang="scss"></style>
