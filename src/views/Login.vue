<template>
  <div class="login" v-loading="loading">
    <div class="tips" style="margin-top:30px;">数据仅存储于本机，不会上传到任何服务器</div>
    <div class="tips">密码用于数据加密解密</div>
    <div class="tips">忘记密码？只能 <el-button type="danger" @click="ResetAll" plain size="mini">重置</el-button></div>
    <el-input @keyup.enter="Submit" style="width:200px;margin-top:30px;" autofocus :placeholder="pwdTip" v-model="pwd" type="password" show-password></el-input>
    <br />
    <el-button @click="Submit" style="margin-top:30px;" icon="el-icon-right" type="success">
      {{ IsLogin ? '登录' : '设置密码' }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import { sleep } from '../lib/utils';
import { Loading } from '@/lib/loading';

@Component
export default class Login extends Vue {
  loading = false;
  pwd = '';

  get IsLogin() {
    return !!this.$UserStore.localState.pwd;
  }

  get pwdTip() {
    if (this.IsLogin) return '输入密码';
    return '设置一个您的密码';
  }

  mounted() {
    ipcRenderer.send('main-win-size', 500, 400, true);
  }

  @Loading()
  async ResetAll() {
    const value: any = await this.$prompt('确定重置软件所有数据，请输入：确认重置');
    if (value && value.value === '确认重置') {
      await Promise.all([sleep(500), this.$AppStore.Reset()]);
    }
  }

  @Loading()
  async Submit() {
    // 校验密码
    if (!this.IsLogin) {
      // 创建密码
      const res = await this.$UserStore.PwdCreate(this.pwd);
      if (res.Error()) return this.$message.error(res.Msg);
    }
    const login = await this.$UserStore.Login(this.pwd);
    if (login.Error()) return this.$message.error(login.Msg);
    this.pwd = '';
    this.$router.push({ name: 'Home' });
  }
}
</script>

<style scoped lang="scss">
.login {
  text-align: center;
  background-color: rgba($color-main, 0.8);
  overflow: hidden;
}
.tips {
  text-align: center;
  line-height: 24px;
  color: #fff;
}
</style>
