import { MyBrowserWindow } from '@/lib/BrowserWindow';
import { IdCreate } from '@/lib/utils';
import { FMex } from '@/api/FMex';

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

export class FMexNoOrder {
  Side = 'buy';
  OrderId = '';
  MinPercent = 1; // 挂单百分比
  MaxPercent = 2; // 挂单百分比
  OrderType = 'long'; // 远端挂单类型。 short 近端
  Amount = 1; // 挂单数量
  Data: any = null; // 数据
  OrderNum = 0;
  EndNum = 0; // 被成交次数
  IsRun = false;
  Percent = 0; // 当前价格的百分比
  Id = IdCreate();
}

export class WinOrLoseOrder {
  Order: FMex.OrderDto; // 原始订单
  WinOrder: FMex.OrderDto | null;
  quantity: number;
  diff: number;
  diffP: number;
  LoseOrder: FMex.OrderDto | null;
  error = '';
  constructor(order: FMex.OrderDto) {
    this.Order = order;
    this.WinOrder = null;
    this.LoseOrder = null;
    this.diff = 0;
    this.diffP = 0;
    this.quantity = order.quantity - order.unfilled_quantity;
  }
}
