import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';

import { Subject, Observable, interval } from 'rxjs';
import { PLC_D } from '../models/IPCChannel';
import { PLCLiveData } from '../models/live';

@Injectable({ providedIn: 'root' })
export class PLCService {
  public plcState = {
    /** 设备状态 */
    z: false,
    /** 通信延时定时器 */
    zT: null,
    /** 记录通信本次联通时间 */
    zOT: 0,
    /** 通信延时 */
    zLT: 0,
    c: false,
    cT: null,
    cOT: 0,
    cLT: 0,
  };
  /** 压力校正数据 */
  revise = {
    zA: [],
    zB: [],
    zC: [],
    zD: [],
    cA: [],
    cB: [],
    cC: [],
    cD: [],
  };
  public PD: PLCLiveData = {
    zA: {
      showMpa: NaN,
      showMm: NaN,
      state: '未知状态',
      alarm: [],
    },
    zB: {
      showMpa: NaN,
      showMm: NaN,
      state: '未知状态',
      alarm: [],
    },
    zC: {
      showMpa: NaN,
      showMm: NaN,
      state: '未知状态',
      alarm: [],
    },
    zD: {
      showMpa: NaN,
      showMm: NaN,
      state: '未知状态',
      alarm: [],
    },
    cA: {
      showMpa: NaN,
      showMm: NaN,
      state: '未知状态',
      alarm: [],
    },
    cB: {
      showMpa: NaN,
      showMm: NaN,
      state: '未知状态',
      alarm: [],
    },
    cC: {
      showMpa: NaN,
      showMm: NaN,
      state: '未知状态',
      alarm: [],
    },
    cD: {
      showMpa: NaN,
      showMm: NaN,
      state: '未知状态',
      alarm: [],
    },
  };
  private stateStr = ['张拉', '回程', '卸荷', '压力上限', '压力未连接', '位移上限', '位移下限', '位移未连接', '超设置压力', '超设置位移', '模块错误'];
  /** 搜索事件 */
  private plcSub = new Subject();

  constructor(
    private e: ElectronService,
    private message: NzMessageService
  ) {
    this.ipcOn('z');
    this.ipcOn('c');
    // this.getRevise('z');
    // this.getRevise('c');
  }

  // 获得一个Observable;
  public PLCobservble = this.plcSub.asObservable();

  // 发射数据，当调用这个方法的时候，Subject就会发射这个数据，所有订阅了这个Subject的Subscription都会接受到结果
  public onSharch() {

  }
  private ipcOn(dev: string = 'z') {
    this.e.ipcRenderer.on(`${dev}connection`, (event, data) => {
      console.log(dev, data);
    });
    this.e.ipcRenderer.on(`${dev}heartbeat`, (event, data) => {
      this.plcState[`${dev}LT`] = new Date().getTime() - this.plcState[`${dev}OT`] - 1000;
      this.plcState[`${dev}OT`] = new Date().getTime();
      clearTimeout(this.plcState[`${dev}T`]);
      this.plcState[dev] = true;
      // console.log(data);
      this.PD[`${dev}A`].showMpa = data.float[0];
      this.PD[`${dev}A`].showMm = data.float[1];
      const astate = this.getState(data.int16[4]);
      this.PD[`${dev}A`].state = astate.state.join('·');
      this.PD[`${dev}A`].alarm = astate.alarm;

      this.PD[`${dev}B`].showMpa = data.float[3];
      this.PD[`${dev}B`].showMm = data.float[4];
      const bstate = this.getState(data.int16[10]);
      this.PD[`${dev}B`].state = bstate.state.join('·');
      this.PD[`${dev}B`].alarm = bstate.alarm;

      this.PD[`${dev}C`].showMpa = data.float[6];
      this.PD[`${dev}C`].showMm = data.float[7];
      const cstate = this.getState(data.int16[16]);
      this.PD[`${dev}C`].state = cstate.state.join('·');
      this.PD[`${dev}C`].alarm = cstate.alarm;

      this.PD[`${dev}D`].showMpa = data.float[9];
      this.PD[`${dev}D`].showMm = data.float[10];
      const dstate = this.getState(data.int16[22]);
      this.PD[`${dev}D`].state = dstate.state.join('·');
      this.PD[`${dev}D`].alarm = dstate.alarm;

      this.plcSub.next();

      this.plcState[`${dev}T`] = setTimeout(() => {
        this.plcState[dev] = false;
        clearTimeout(this.plcState[`${dev}T`]);
      }, 3000);
    });
    this.e.ipcRenderer.on(`${dev}error`, (event, data) => {
      console.error(dev, data);
      this.plcState[`${dev}LT`] = '重新链接...';
    });
  }
  /** 转换设备状态 */
  getState(value: number): { state: Array<string>, alarm: Array<string> } {
    const r = {
      state: [],
      alarm: [],
    };
    const s = value.toString(2).padStart(16, '0');
    // tslint:disable-next-line:prefer-for-of
    let i = 0;
    for (let index = 15; index > 0; index--) {
      if (s[index] === '1') {
        if (i < 3) {
          r.state.push(this.stateStr[i]);
        } else {
          r.alarm.push(this.stateStr[i]);
        }
      }
      i = i + 1;
    }
    if (r.state.length === 0) {
      r.state.push('待机');
    }
    return r;
  }
  /**
   * 拼接一个时间戳字符串
   *
   * @param {string} [name='t'] 字符串前缀
   * @returns {string} 返回构造的字符串
   * @memberof PLCService
   */
  public constareChannel(name: string = 't'): string {
    return `${name}${new Date().getTime()}`;
  }
  /** 在线状态 */
  // tslint:disable-next-line:ban-types
  public ipcSend(sendChannel: string, address: number, value: any) {
    return new Promise((resolve, reject) => {
      if ((!this.plcState.z && sendChannel.indexOf('z') > -1) || (!this.plcState.c && sendChannel.indexOf('c') > -1)) {
        this.message.warning('设备未连接');
        reject('设备未连接');
        return;
      }
      console.log(sendChannel, address, value);
      const channel = `${sendChannel}${this.constareChannel()}`;
      this.e.ipcRenderer.send(sendChannel, { address, value, channel });
      this.e.ipcRenderer.once(channel, (event, data) => {
        console.log(`${sendChannel}-${address}设置返回的结果`, data);
        clearTimeout(t);
        if (!data) {
          this.message.error(`${sendChannel}-M${address}设置失败`);
        }
        resolve(data);
        return;
      });
      const t = setTimeout(() => {
        this.message.error(`${sendChannel}-M${address}设置超时`);
        this.e.ipcRenderer.removeAllListeners(channel);
        reject();
        return;
      }, 3000);
    });
  }
  /** 获取压力校正系数 */
  getRevise(dev: string = 'z') {
    this.ipcSend(`${dev}F03`, PLC_D(500), 48).then((data: any) => {
      if (data) {
        this.revise[`${dev}A`] = data.float.slice(0, 6);
        this.revise[`${dev}B`] = data.float.slice(6, 12);
        this.revise[`${dev}C`] = data.float.slice(12, 18);
        this.revise[`${dev}D`] = data.float.slice(18, 24);
      }
      console.log(data);
    });
  }
}
