import Data from '@/lib/data';
import Vue from 'vue';
import { CodeObj, Code } from '@/types/Code';
import { IdCreate } from '@/lib/utils';
import { EncryptStrByPassword, DecryptStrByPassword } from '@/lib/aes';

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
  };

  // 模块名称，【必须】不能重复
  // 格式为 AAA:BBB:CCC ，指当前模块属于 AAA.BBB 模块，名为 CCC
  protected name = `fmex:user`;

  constructor() {
    super();
    this.initilization();
  }

  PwdCreate(pwd: string) {
    if (this.localState.pwd) return new CodeObj(Code.Error, '', '密码已设置');

    // 生成校验码
    this.localState.pwdKey = IdCreate();

    // 用密码对校验码进行加密
    const pwed = EncryptStrByPassword(pwd, this.localState.pwdKey);
    if (pwed.Error()) return pwed;

    // 存储加密后的密文作为密码（实际后续该值仅作用于校验，因为密码不会被存储在任何地方）
    this.localState.pwd = pwed.Data;
    return new CodeObj(Code.Success);
  }

  Login(pwd: string) {
    if (!this.localState.pwd) return new CodeObj(Code.Error, '', '密码未设置');
    // 用密码对校验码进行加密
    const pwed = DecryptStrByPassword(pwd, this.localState.pwd);
    if (pwed.Error()) return pwed;
    if (pwed.Data !== this.localState.pwdKey) return new CodeObj(Code.Error, '', '密码错误');
    this.sessionState.login = true;
    return new CodeObj(Code.Success);
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
