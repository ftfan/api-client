import { BrowserWindow, ipcMain } from 'electron';
import { EventEmitter } from 'events';
import { IdCreate } from '@/lib/utils';

class MyEvents extends EventEmitter {
  callbackMap: { [index: string]: any } = {};
}

// webcontent reload 之后会导致监听多次。需要处理

export function MyEventsInstall() {
  const wss = new MyEvents();
  ipcMain.on('wss:on', (ipcEvent, event: string, listener: string) => {
    const realListener = (...args: any[]) => ipcEvent.reply('wss', [listener, args]);
    wss.callbackMap[listener] = realListener;
    wss.on(event, realListener);
  });
  ipcMain.on('wss:once', (ipcEvent, event: string, listener: string) => {
    const realListener = (...args: any[]) => {
      ipcEvent.reply('wss', [listener, args]);
      delete wss.callbackMap[listener];
    };
    wss.callbackMap[listener] = realListener;
    wss.once(event, realListener);
  });
  ipcMain.off('wss:off', (ipcEvent, event: string, listener: string) => {
    const realListener = wss.callbackMap[listener];
    delete wss.callbackMap[listener];
    wss.off(event, realListener);
  });
  ipcMain.on('wss:emit', (ipcEvent, event: string, ...args: any[]) => {
    wss.emit(event, ...args);
  });

  // 客户端声明自己有哪些数据
  ipcMain.on('wss:res', (ipcEvent, event: string, listener: string) => {
    const realListener = (reqTempId: string, ...args: any[]) => {
      ipcEvent.reply('wss', [listener, [reqTempId, args]]);
    };
    wss.callbackMap[listener] = realListener;
    wss.on(event, realListener);
  });

  // 部分客户端请求数据
  ipcMain.on('wss:req', (ipcEvent, event: string | symbol, listener: string, ...args: any[]) => {
    const reqTempId = IdCreate();
    const realListener = (ipcEventNew: any, ...args: any[]) => {
      ipcEvent.reply('wss', [listener, args]);
    };
    ipcMain.once(reqTempId, realListener);
    wss.emit(event, reqTempId, ...args);
  });
}
