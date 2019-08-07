import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';

import { Subject, Observable, interval } from 'rxjs';
import { PLC_D } from '../models/IPCChannel';
import { PLCLiveData, GetPLCLiveData } from '../models/live';
import { plcToMpa, plcToMm, mmToPlc } from '../Function/device.date.processing';
import { MpaRevise, AutoDate, GetMpaRevise, IMpaRevise } from '../models/device';
import { Jack, taskModeStr, deviceGroupMode, groupModeStr, deviceGroupModeDev, numberMode } from '../models/jack';
import { DbService } from './db.service';


const mpaRevise: MpaRevise = GetMpaRevise();
// {
//   zA: [1, 1, 1, 1, 1, 1],
//   zB: [1, 1, 1, 1, 1, 1],
//   zC: [1, 1, 1, 1, 1, 1],
//   zD: [1, 1, 1, 1, 1, 1],
//   cA: [1, 1, 1, 1, 1, 1],
//   cB: [1, 1, 1, 1, 1, 1],
//   cC: [1, 1, 1, 1, 1, 1],
//   cD: [1, 1, 1, 1, 1, 1],
// };
const autoDate: AutoDate = {
  pressureDifference: 2,
  superElongation: 10,
  tensionBalance: 10,
  backMm: 55,
  unloadingDelay: 30,
};

@Injectable({ providedIn: 'root' })
export class PLCService {
  jack: Jack;
  mpaRevise = {};
  revise = {
    zGetMpaState: false,
    cGetMpaState: false,
    zMpaRevise: {},
    cMpaRevise: {},
    zVirtualHeight: [],
    cVirtualHeight: [],
  };

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

  public PD: PLCLiveData = GetPLCLiveData();
  // {
  //   zA: {
  //     showMpa: 0,
  //     showMm: 0,
  //     state: '设备未连接',
  //     alarm: [],
  //     autoState: [],
  //   },
  //   zB: {
  //     showMpa: 0,
  //     showMm: 0,
  //     state: '设备未连接',
  //     alarm: [],
  //     autoState: [],
  //   },
  //   zC: {
  //     showMpa: 0,
  //     showMm: 0,
  //     state: '设备未连接',
  //     alarm: [],
  //     autoState: [],
  //   },
  //   zD: {
  //     showMpa: 0,
  //     showMm: 0,
  //     state: '设备未连接',
  //     alarm: [],
  //     autoState: [],
  //   },
  //   cA: {
  //     showMpa: 0,
  //     showMm: 0,
  //     state: '设备未连接',
  //     alarm: [],
  //     autoState: [],
  //   },
  //   cB: {
  //     showMpa: 0,
  //     showMm: 0,
  //     state: '设备未连接',
  //     alarm: [],
  //     autoState: [],
  //   },
  //   cC: {
  //     showMpa: 0,
  //     showMm: 0,
  //     state: '设备未连接',
  //     alarm: [],
  //     autoState: [],
  //   },
  //   cD: {
  //     showMpa: 0,
  //     showMm: 0,
  //     state: '设备未连接',
  //     alarm: [],
  //     autoState: [],
  //   },
  // };
  private stateStr = ['张拉', '回程', '卸荷', '压力上限', '压力未连接', '位移上限',
                      '位移下限', '位移未连接', '超设置压力', '超设置位移', '模块错误',
                      '急停', '自动暂停', '通信错误', '相序错误', 'PLC停止'];
  private stateAutoStr = ['等待保压', '卸荷完成', '回顶完成', '超工作位移上限', '平衡暂停', '压力差报警', '伸长量偏差报警', '张拉完成'];
  // 0压力确认 1回程 2卸荷 3 卸荷完成 4回顶 5回顶完成 6超工作位移上限
  /** 设置采集频率 */
  heartbeatRateValue = 0;

  /** PLC sub */
  private plcSub = new Subject();
  // 获得一个Observable;
  plcSubject = this.plcSub.asObservable();
  // 发射数据，当调用这个方法的时候，Subject就会发射这个数据，所有订阅了这个Subject的Subscription都会接受到结果
  // loading true为启用loading,false为关闭loading
  // public onPlcSub(data) {
  //   this.plcSub.next(data);
  // }
  /** 手动模式 */
  public manualMode = {
    z: null,
    c: null,
  };
  constructor(
    private e: ElectronService,
    private message: NzMessageService,
    private odb: DbService,
  ) {
    console.log(this.e.isLinux);

    // const revise = JSON.parse(localStorage.getItem('mpaRevise'));
    // if (!revise) {
    //   this.setMpaRevise(mpaRevise);
    // } else {
    //   this.mpaRevise = revise;
    // }
    const auto = JSON.parse(localStorage.getItem('autoDate'));
    if (!auto) {
      this.setAutoData(autoDate);
    }
    this.ipcOn('z');
    this.ipcOn('c');
    this.selectJack(this.getJackId());
  }


  /** 获取实时数据 */
  private ipcOn(dev: string = 'z') {
    this.e.ipcRenderer.on(`${dev}connection`, (event, data) => {
      console.log(dev, data);
    });
    this.e.ipcRenderer.on(`${dev}heartbeat`, (event, data) => {
      // if (!this.revise[`${dev}GetMpaState`]) {
      //   console.log(this.revise[`${dev}MpaRevise`]);
      //   this.getPLCMpa(dev);
      // }
      this.manualMode[dev] = data.uint16[25].toString(2).padStart(16, '0');
      // console.log(data, this.manualMode[dev], this.manualMode[dev][4] === '1');

      this.plcState[`${dev}LT`] = new Date().getTime() - this.plcState[`${dev}OT`];
      this.plcState[`${dev}OT`] = new Date().getTime();
      clearTimeout(this.plcState[`${dev}T`]);
      this.plcState[dev] = true;
      if (this.mpaRevise && this.jack) {
        let i = 0;
        // [[], ['A'], ['A', 'B'], [], ['A', 'B', 'C', 'D']]
        numberMode[this.jack.jackMode].forEach(k => {
          // console.log(this.jack);
          // console.log(dev, k, data);
          const key = `${dev}${k}`;
          this.PD[key].showMpa = data.float[i].toFixed(2);
          this.PD[key].showMm = data.float[i + 1].toFixed(2);
          const state = this.getState(data.uint16[i * 2 + 4], data.uint16[24]);
          this.PD[key].state = state.state.join('·');
          this.PD[key].alarm = state.alarm;
          this.PD[key].autoState = this.getState(data.uint16[i * 2 + 5], data.uint16[24], true, this.stateAutoStr).alarm;
          i += 3;
        });
      }
      // this.onPlcSub(data);
      this.plcSub.next(data);

      this.plcState[`${dev}T`] = setTimeout(() => {
        this.plcState[dev] = false;
        clearTimeout(this.plcState[`${dev}T`]);
      }, 3000);
    });
    this.e.ipcRenderer.on(`${dev}error`, (event, data) => {
      console.error(dev, data);
      try {
        // if (data.client) {
        //   this.getPLCMpa(dev);
        // }
      } catch (error) {}
      this.plcState[`${dev}LT`] = '重新链接...';
      this.PD[`${dev}A`].state = '重新链接中...';
      this.PD[`${dev}B`].state = '重新链接中...';
      this.PD[`${dev}C`].state = '重新链接中...';
      this.PD[`${dev}D`].state = '重新链接中...';
    });
  }
  /** 设备状态处理 */
  getState(value: number, PLCstate: number, auto = false, states = this.stateStr): { state: Array<string>, alarm: Array<string> } {
    const r = {
      state: [],
      alarm: [],
    };
    if (PLCstate === 0) {
      r.alarm.push('PLC停机');
      return r;
    }
    const s = value.toString(2).padStart(16, '0');
    // tslint:disable-next-line:prefer-for-of
    let i = 0;
    for (let index = 15; index > 0; index--) {
      if (s[index] === '1') {
        if (i < 3 && !auto) {
          r.state.push(states[i]);
        } else {
          r.alarm.push(states[i]);
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
  /**
   *
   *
   * @param {string} sendChannel
   * @param {number} address
   * @param {*} value
   * @returns
   * @memberof PLCService
   */
  public ipcSend(sendChannel: string, address: number, value: any) {
    return new Promise((resolve, reject) => {
      if ((!this.plcState.z && sendChannel.indexOf('z') > -1) || (!this.plcState.c && sendChannel.indexOf('c') > -1)) {
        this.message.warning('设备未连接');
        reject(`${sendChannel}设备未连接`);
        return;
      }
      console.log(sendChannel, address, value);
      const channel = `${sendChannel}${this.constareChannel()}`;
      this.e.ipcRenderer.send(sendChannel, { address, value, channel });
      const t = setTimeout(() => {
        this.message.warning(`${sendChannel}-${address}设置超时`);
        this.e.ipcRenderer.removeAllListeners(channel);
        reject(`${sendChannel}-M${address}设置超时`);
        return;
      }, 3000);
      this.e.ipcRenderer.once(channel, (event, data) => {
        console.log(`${sendChannel}-${address}设置返回的结果`, data);
        clearTimeout(t);
        if (!data) {
          this.message.warning(`${sendChannel}-${address}设置失败`);
        }
        resolve(data);
        return;
      });
    });
  }


  // /** 获取压力校正系数 */
  // getMpaRevise(): MpaRevise {
  //   this.mpaRevise = JSON.parse(localStorage.getItem('mpaRevise'));
  //   return this.mpaRevise;
  // }

  // /** 设置压力校正系数 */
  // setMpaRevise(revise: MpaRevise) {
  //   localStorage.setItem('mpaRevise', JSON.stringify(revise));
  //   this.mpaRevise = revise;
  // }
  /** 获取自动参数 */
  getAutoDate(): AutoDate {
    return JSON.parse(localStorage.getItem('autoDate'));
  }

  /** 设置自动参数 */
  setAutoData(data: AutoDate) {
    localStorage.setItem('autoDate', JSON.stringify(data));
  }

  /** 切换设备 */
  async selectJack(id: number): Promise<Jack> {
    localStorage.setItem('jackId', JSON.stringify(id));
    await this.odb.db.jack.filter(f => f.id === id).first(d => {
      this.jack = d;
    });
    // const z = [];
    // const c = [];
    // deviceGroupMode[4].map((key) => {
    //   if (key.indexOf('z') > -1) {
    //     if (deviceGroupMode[this.jack.jackMode].indexOf(key) > -1) {
    //       z.push(this.jack[key].upper, this.jack[key].floot);
    //     } else {
    //       z.push(0, 0);
    //     }
    //   } else {
    //     if (deviceGroupMode[this.jack.jackMode].indexOf(key) > -1) {
    //       c.push(this.jack[key].upper, this.jack[key].floot);
    //     } else {
    //       c.push(0, 0);
    //     }
    //   }
    // });
    await this.ipcSend(`zF03_float`, PLC_D(2100 + this.jack.saveGroup * 100), 100).then((data: any) => {
      console.log(data);
      deviceGroupModeDev.z[this.jack.jackMode].map((name, index) => {
        // console.log(name, index);
        const startIndex = index * 10;
        this.jack[name].mm = data.float.slice(startIndex, startIndex + 6).map(v => v.toFixed(5));
        this.jack[name].upper = data.float[startIndex + 6];
        this.jack[name].floot = data.float[startIndex + 7];
      });
    }).catch(() => {
      console.error('获取PLC位移校正错误');
    });
    if (this.jack.link) {
      await this.ipcSend(`cF03_float`, PLC_D(2100 + this.jack.saveGroup * 100), 100).then((data: any) => {
        deviceGroupModeDev.c[this.jack.jackMode].map((name, index) => {
          // console.log(name, index);
          const startIndex = index * 10;
          this.jack[name].mm = data.float.slice(startIndex, startIndex + 6).map(v => v.toFixed(5));
          this.jack[name].upper = data.float[startIndex + 6];
          this.jack[name].floot = data.float[startIndex + 7];
        });
      }).catch(() => {
        console.error('获取PLC位移校正错误');
      });
    }
    // 设置泵顶组
    this.ipcSend('zF06', PLC_D(407), this.jack.saveGroup);
    this.ipcSend('cF06', PLC_D(407), this.jack.saveGroup);

    // this.ipcSend('zF016_float', PLC_D(420), z);
    // this.ipcSend('cF016_float', PLC_D(420), c);
    // this.ipcSend('zF016', PLC_D(420), [
    //   mmToPlc(this.jack.zA.upper, this.jack.zA.mm), mmToPlc(this.jack.zA.floot, this.jack.zA.mm),
    //   mmToPlc(this.jack.zB.upper, this.jack.zB.mm), mmToPlc(this.jack.zB.floot, this.jack.zB.mm),
    //   mmToPlc(this.jack.zC.upper, this.jack.zC.mm), mmToPlc(this.jack.zC.floot, this.jack.zC.mm),
    //   mmToPlc(this.jack.zD.upper, this.jack.zD.mm), mmToPlc(this.jack.zD.floot, this.jack.zD.mm),
    // ]);
    // this.ipcSend('cF016', PLC_D(420), [
    //   mmToPlc(this.jack.cA.upper, this.jack.zA.mm), mmToPlc(this.jack.cA.floot, this.jack.zA.mm),
    //   mmToPlc(this.jack.cB.upper, this.jack.zB.mm), mmToPlc(this.jack.cB.floot, this.jack.zB.mm),
    //   mmToPlc(this.jack.cC.upper, this.jack.zC.mm), mmToPlc(this.jack.cC.floot, this.jack.zC.mm),
    //   mmToPlc(this.jack.cD.upper, this.jack.zD.mm), mmToPlc(this.jack.cD.floot, this.jack.zD.mm),
    // ]);
    console.log('切换顶', this.jack);
    return this.jack;
  }
  getJackId() {
    const jackId = JSON.parse(localStorage.getItem('jackId'));
    if (!jackId) {
      this.selectJack(1);
    }
    return JSON.parse(localStorage.getItem('jackId'));
  }

  /**
   * *设置采集频率
   */
  heartbeatRate(delay = null) {
    if (!delay) {
      delay = localStorage.getItem('heartbeatRate');
    }
    if (!delay) {
      delay = 500;
    }

    localStorage.setItem('heartbeatRate', delay);
    this.e.ipcRenderer.send('heartbeatRate', delay);
    console.log('设置采集频率', localStorage.getItem('heartbeatRate'));
    this.heartbeatRateValue = delay;
  }

  getPLCMpa(dev) {
    // await this.ipcSend(`cF03`, PLC_D(2100), 20).then((data: any) => {
    //   console.log(data);
    // });
    this.revise[`${dev}GetMpaState`] = true;
    this.ipcSend(`${dev}F03_float`, PLC_D(2000), 100).then((data: any) => {
      console.log(`${dev}返回的结果`, data);
      this.revise[`${dev}VirtualHeight`] = data.float.slice(41, 47).map(v => v.toFixed(2));
      groupModeStr('AB8').map((name, index) => {
        console.log(name, index);
        const m = (data.float.slice(index * 10, index * 10 + 6)).map(v => v.toFixed(5));
        // m = m.map(v => v.toFixed(5));
        this.revise[`${dev}MpaRevise`][`${name}`] = m;
        this.mpaRevise[`${dev}${name}`] = m;
      });
      console.log(this.revise[`${dev}MpaRevise`], this.mpaRevise);
    }).catch(() => {
      console.error('获取压力校正错误');
      this.revise[`${dev}GetMpaState`] = false;
    });
  }
  setPLCMpa(dev: string, name: string, data) {
    const address = {A: 0, B: 1, C: 2, D: 3}[name];
    this.ipcSend(`${dev}F016_float`, PLC_D(2000 + address * 10), data).then(() => {
      this.getPLCMpa(dev);
    });
  }
  async setPLCMm(data: Jack): Promise<boolean> {
    const z = [];
    const c = [];
    let state = true;
    deviceGroupModeDev.z[data.jackMode].map((name, index) => {
      console.log(name, index);
      z.push(...(data[name].mm), data[name].upper, data[name].floot, 0, 0);
    });
    deviceGroupModeDev.c[data.jackMode].map((name, index) => {
      console.log(name, index);
      c.push(...(data[name].mm), data[name].upper, data[name].floot, 0, 0);
    });
    console.log(z, c);
    await this.ipcSend(`zF016_float`, PLC_D(2100 + data.saveGroup * 100), z).then(() => {
      console.log('主机位移校正设置完成');
    }).catch(() => {
      state = false;
      this.message.error('主机设置错误');
    });
    if (data.link) {
      await this.ipcSend(`cF016_float`, PLC_D(2100 + data.saveGroup * 100), c).then(() => {
        console.log('副机位移校正设置完成');
      }).catch(() => {
        state = false;
        this.message.error('副机设置错误');
      });
    }
    console.log('位移校正设置完成');
    return state;
  }
}
