import Data from '@/lib/data';
import Vue from 'vue';
import { CodeObj, Code } from '@/types/Code';
import { IdCreate } from '@/lib/utils';
import { AES } from '@/lib/aes';
import { SecretKey } from '@/types/Secret';
import { FMex } from '@/api/FMex';

class Store extends Data {
  readonly state = {};

  readonly sessionState = {
    login: false,
  };

  readonly localState = {
    pwd: '',

    /**
     * 用户设置密码时生成的随机串，用于校验用户密码的准确性
     */
    pwdKey: '',

    SecretKeys: [] as SecretKey[], // 秘钥列表
  };

  // 模块名称，【必须】不能重复
  // 格式为 AAA:BBB:CCC ，指当前模块属于 AAA.BBB 模块，名为 CCC
  protected name = `fmex:user`;

  constructor() {
    super();
    this.initilization();
  }

  async PwdCreate(pwd: string) {
    if (this.localState.pwd) return new CodeObj(Code.Error, '', '密码已设置');

    // 生成校验码
    this.localState.pwdKey = IdCreate();

    // 用密码对校验码进行加密
    const pwed = await AES.Encrypt(pwd, this.localState.pwdKey);
    if (pwed.Error()) return pwed;

    // 存储加密后的密文作为密码（实际后续该值仅作用于校验，因为密码不会被存储在任何地方）
    this.localState.pwd = pwed.Data;
    return new CodeObj(Code.Success);
  }

  async Login(pwd: string) {
    if (!this.localState.pwd) return new CodeObj(Code.Error, '', '密码未设置');
    const pwed = await this.CheckPassword(pwd);
    if (pwed.Error()) return pwed;
    this.sessionState.login = true;
    return new CodeObj(Code.Success);
  }

  // 请求输入秘钥认证
  async PromptPassword(inputPlaceholder = '用于数据加密/解密') {
    const pwd: any = await Vue.prototype.$prompt('密码输入', { inputPlaceholder, closeOnClickModal: false });
    if (!pwd) return new CodeObj(Code.Error, null, '取消认证');
    const pwdvalue = pwd.value || '';
    const check = await this.CheckPassword(pwdvalue);
    if (check.Error()) return check;
    return new CodeObj(Code.Success, pwdvalue);
  }

  // 校验密码
  async CheckPassword(pwd: string) {
    const check = await AES.Decrypt(pwd, this.localState.pwd);
    if (check.Error()) return check;
    if (check.Data !== this.localState.pwdKey) return new CodeObj(Code.Error, '', '密码错误');
    return check;
  }

  async CreateKey(data: SecretKey, pwd: string, origin: null | SecretKey = null) {
    if (!data.Key) return new CodeObj(Code.Error, null, 'Key 为空');
    if (!data.Secret) return new CodeObj(Code.Error, null, 'Secret 为空');
    const pwed = await this.CheckPassword(pwd);
    if (pwed.Error()) return pwed;

    const has = this.localState.SecretKeys.filter((item) => item.Key === data.Key)[0];
    if (has && has !== origin) return new CodeObj(Code.Error, null, '该秘钥已存在，无法重复添加');

    let Secret = '';
    // 修改时，未对 Secret 做出改动。
    if (origin && origin.Secret === data.Secret) {
      Secret = data.Secret;
    } else {
      const res = await AES.Encrypt(pwd, data.Secret);
      if (res.Error()) return res;
      Secret = res.Data;
    }
    const success = new CodeObj(Code.Success);

    // 修改
    if (origin) {
      origin.Key = data.Key;
      origin.Secret = Secret;
      origin.Desc = data.Desc;
      origin.Pwd = data.Pwd;
      return success;
    }
    this.localState.SecretKeys.push({
      Key: data.Key,
      Secret: Secret,
      Desc: data.Desc,
      Pwd: data.Pwd,
    });
    return success;
  }

  LoginOut() {
    this.sessionState.login = false;
  }

  async SecretParse(sk: SecretKey, pwd: string) {
    const res = await this.CheckPassword(pwd);
    if (res.Error()) return res;
    const sec = await AES.Decrypt(pwd, sk.Secret);
    return sec;
  }

  async TestApi(sk: SecretKey, pwd: string) {
    const res = await this.SecretParse(sk, pwd);
    if (res.Error()) return res;
    const fmex = new FMex.Api(sk.Key, res.Data!);
    const data = await fmex.FetchBalance();
    if (data.Error()) return data;
    return new CodeObj(Code.Success, fmex);
  }

  async DeleteApi(sk: SecretKey) {
    const success = new CodeObj(Code.Success);
    const index = this.localState.SecretKeys.indexOf(sk);
    if (index === -1) return success;
    this.localState.SecretKeys.splice(index, 1);
    return success;
  }
}

export const UserStore = new Store();

declare module 'vue/types/vue' {
  interface Vue {
    $UserStore: Store;
  }
  interface VueConstructor {
    UserStore: Store;
  }
}

Vue.use((Vue) => {
  Vue.prototype.$UserStore = UserStore;
  Vue.UserStore = UserStore;
});
