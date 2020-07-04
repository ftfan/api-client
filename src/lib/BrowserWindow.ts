import { remote, BrowserViewConstructorOptions, ipcRenderer } from 'electron';
import { EventEmitter } from 'events';
import { MyConfig } from '@/config';
import lodash from 'lodash';
import { IdCreate, isPromise } from './utils';

const BrowserWindow = remote.BrowserWindow;
export class MyBrowserWindow extends EventEmitter {
  win: Electron.BrowserWindow;
  constructor(url: string, options?: Electron.BrowserViewConstructorOptions) {
    super();
    this.win = new BrowserWindow(lodash.merge({}, MyConfig.BrowserWindowOption, options));
    this.Create(url);
  }
  async Create(url: string) {
    await this.win.loadURL(location.origin + '/#' + url);
    if (!process.env.IS_TEST) this.win.webContents.openDevTools();
  }
}

class MyEvents {
  private origin = new EventEmitter();
  // private fmap: Map<string, Function> = new Map();
  private map: Map<Function, string> = new Map();

  constructor() {
    ipcRenderer.on('wss', (event, args) => {
      const [id, params] = args;
      console.log(id, ...params);
      // console.log(event, args, params, ...params);
      this.origin.emit(id, ...params);
    });
  }

  on(event: string, listener: (...args: any[]) => any) {
    const id = IdCreate();
    this.origin.on(id, listener);
    this.map.set(listener, id);
    ipcRenderer.send('wss:on', event, id);
  }

  once(event: string, listener: (...args: any[]) => any) {
    const id = IdCreate();
    this.origin.once(id, listener);
    this.map.set(listener, id);
    ipcRenderer.send('wss:once', event, id);
  }

  off(event: string, listener: (...args: any[]) => any) {
    const id = this.map.get(listener);
    if (!id) return;
    this.origin.off(id, listener);
    this.map.delete(listener);
    ipcRenderer.send('wss:off', event, id);
  }

  emit(event: string, ...args: any[]) {
    ipcRenderer.send('wss:emit', event, ...args);
  }

  res(event: string, listener: (...args: any[]) => any) {
    const realListener = (...args: any[]) => {
      const id = args[0];
      const end = (...args: any[]) => {
        console.log(args);
        ipcRenderer.send(id, ...args);
      };
      const returnValue = listener.call(null, ...args[1]);
      if (isPromise(returnValue)) {
        returnValue.then(end);
      } else {
        end(returnValue);
      }
    };
    const id = IdCreate();
    this.origin.on(id, realListener);
    ipcRenderer.send('wss:res', event, id);
  }

  req(event: string, ...args: any[]): Promise<any> {
    return new Promise((resolve) => {
      const id = IdCreate();
      console.log('发出请求，id:', id);
      this.origin.once(id, resolve);
      ipcRenderer.send('wss:req', event, id, ...args);
    });
  }
}

export const MyIPC = new MyEvents();
// MyIPC.on('a', console.log);
// MyIPC.emit('a', 7, 4, 23, 444);
