import path from 'path';

const BrowserWindowOption: Electron.BrowserWindowConstructorOptions = {
  width: 800,
  height: 600,
  frame: false,
  transparent: true,
  webPreferences: {
    spellcheck: false, // 取消单词检查
    webSecurity: false,
    // Use pluginOptions.nodeIntegration, leave this alone
    // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
    nodeIntegration: true,
    // nodeIntegration: (process.env.ELECTRON_NODE_INTEGRATION as unknown) as boolean,
  },
  icon: path.join(__static, 'icon.png'),
};

export const MyConfig = {
  BrowserWindowOption,

  /**
   * fmextest.net 网的只读api。供用户体验
   */
  TestApi: {
    Key: '0f7bd4b05a064d54a673352412924cd1',
    Secret: '51b9c11f361c47fb8cddf135bdf31af5',
  },
};
