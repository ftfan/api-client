import { MyBrowserWindow } from '@/lib/BrowserWindow';

export class RunnerSetting {
  Name = '';
  Sort = 0;
  Text = '';
  VuePath = '';

  BrowserWindowOption: Electron.BrowserWindowConstructorOptions = {};

  private wins: MyBrowserWindow[] = [];
  constructor(arg: Partial<RunnerSetting>) {
    Object.assign(this, arg);
  }
  // async Create(): Promise<MyBrowserWindow> {
  //   const bw = new MyBrowserWindow(this.VuePath, this.BrowserWindowOption);
  //   this.wins.push(bw);
  //   bw.win.on('close', () => {
  //     const index = this.wins.indexOf(bw);
  //     if (index === -1) return;
  //     this.wins.splice(index, 1);
  //   });
  //   return bw;
  // }

  // async ShowAll() {
  //   this.wins.forEach((bw) => {
  //     bw.win.show();
  //   });
  // }
}
