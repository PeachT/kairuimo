import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';
import { Router, NavigationEnd } from '@angular/router';

import { Subject, Observable, interval } from 'rxjs';
import { PLC_D, PLC_M } from '../models/IPCChannel';
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
    z: '0',
    c: '0',
  };
  /** 锁机数据 */
  lock = {
    state: false,
    success: true,
    code: null,
  };
  /** socket是否打开 */
  socketState = false;

  constructor(
    private e: ElectronService,
    private message: NzMessageService,
    private odb: DbService,
    private router: Router,
  ) {
    console.log(this.e.isLinux);
    this.lock.code = `${localStorage.getItem('ID')}${new Date().getTime()}`;
    const arrs = [];
    for (let index = 0; index < 9; index++) {
      const i = Math.floor(Math.random() * this.lock.code.length);
      arrs.push(this.lock.code[i]);
    }
    this.lock.code = arrs.join('');
  }


  /** 启动Socket */
  runSocket() {
    console.log('1111111111111111111');
    const channel = 'runSocket';
    const auto = JSON.parse(localStorage.getItem('autoDate'));
    if (!auto) {
      this.setAutoData(autoDate);
    }
    this.heartbeatRateValue = Number(localStorage.getItem('heartbeatRate')) || 10;
    this.e.ipcRenderer.send('runSocket', {delay: this.heartbeatRateValue, channel});
    this.e.ipcRenderer.once(channel, (event, data) => {
      this.socketState = true;
      localStorage.setItem('heartbeatRate', data);
      this.heartbeatRateValue = Number(localStorage.getItem('heartbeatRate'));
      console.log('启动Socket完成', data);
      this.ipcOn('z');
      this.ipcOn('c');
      this.selectJack(this.getJackId());
    });
  }
  /**
   * *设置采集频率
   */
  heartbeatRate(delay: number = null) {
    if (!delay) {
      delay = Number(localStorage.getItem('heartbeatRate'));
    }
    delay = Number(delay) || 10;
    console.log('设置采集频率', delay);
    this.e.ipcRenderer.send('heartbeatRate', {delay, channel: 'delay'});
    this.e.ipcRenderer.once('delay', (event, data) => {
      localStorage.setItem('heartbeatRate', data);
      console.log('设置采集频率完成', localStorage.getItem('heartbeatRate'));
      this.message.success(`设置采集频率完成: ${delay}`);
      this.heartbeatRateValue = delay;
    });
  }
  async lockPLC(dev) {
    if (dev === 'z') {
      console.log('获取PLC加密');
      await this.ipcSend(`${dev}F03`, PLC_D(3900), 4).then((t: any) => {
        console.log('PLC加密码', t);
        const nowTime = Math.round(new Date().getTime() / 1000);
        const lockTime = Number(`${t.uint16[0]}${t.uint16[1]}${t.uint16[2]}${t.uint16[3]}0000`);
        this.lock.state = true;
        if (nowTime < lockTime) {
          this.lock.success = false;
          this.ipcSend(`cF05`, PLC_M(0), true);
        } else {
          this.lock.code = `${localStorage.getItem('ID')}${new Date().getTime()}`;
          const arrs = [];
          for (let index = 0; index < 9; index++) {
            const i = Math.floor(Math.random() * this.lock.code.length);
            arrs.push(this.lock.code[i]);
          }
          this.lock.code = arrs.join('');
        }
      });
    } else {
      if (this.lock.state && this.lock.success) {
        this.ipcSend(`cF05`, PLC_M(0), true);
      }
    }
  }
  /** 数据监听 */
  private ipcOn(dev: string = 'z') {
    /** 获取锁机数据 */
    this.e.ipcRenderer.on(`${dev}LOCK`, async (event, data) => {
      if (dev === 'z') {
        console.log('获取PLC加密');
        const nowTime = Math.round(new Date().getTime() / 1000);
        const lockTime = Number(`${data.uint16[0]}${data.uint16[1]}${data.uint16[2]}0000`);
        console.log('PLC加密码', data, nowTime, lockTime);
        this.lock.state = true;
        if (nowTime < lockTime) {
          this.lock.success = false;
          // this.ipcSend(`cF05`, PLC_M(0), true);
          console.log('c锁机z');
          this.e.ipcRenderer.send('cF05', { address: PLC_M(0), value : true});
          if (this.jack) {
            this.gsJack('z');
          }
        } else {
          // this.lock.code = `${localStorage.getItem('ID')}${new Date().getTime()}`;
          // const arrs = [];
          // for (let index = 0; index < 9; index++) {
          //   const i = Math.floor(Math.random() * 12);
          //   arrs.push([0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9][i]);
          // }
          // this.lock.code = arrs.join('');
          this.getLockID();
        }
      } else {
        console.log('c锁机', this.lock.state, this.lock.success);
        if (this.lock.state && !this.lock.success) {
          console.log('c锁机c');
          this.e.ipcRenderer.send('cF05', { address: PLC_M(0), value : true});
          // this.ipcSend(`cF05`, PLC_M(0), true);
          if (this.jack && this.jack.link) {
            this.gsJack('c');
          }
        }
      }
    });

    /** 链接成功 */
    this.e.ipcRenderer.on(`${dev}connection`, async (event, data) => {
      console.log('链接成功', dev, data);
      this.lockPLC(dev);
        // 156 518 292 3
        // 253 400 630 399
    });
    /** 获取实时数据 */
    this.e.ipcRenderer.on(`${dev}heartbeat`, (event, data) => {
      // console.log(dev, data);
      // if (!this.revise[`${dev}GetMpaState`]) {
      //   console.log(this.revise[`${dev}MpaRevise`]);
      //   this.getPLCMpa(dev);
      // }
      this.manualMode[dev] = data.uint16[25].toString(2).padStart(16, '0').split('').reverse().join('');

      this.plcState[`${dev}LT`] = new Date().getTime() - this.plcState[`${dev}OT`];
      this.plcState[`${dev}OT`] = new Date().getTime();
      clearTimeout(this.plcState[`${dev}T`]);
      this.plcState[dev] = true;
      if (this.mpaRevise && this.jack) {
        let i = 0;
        // [[], ['A'], ['A', 'B'], [], ['A', 'B', 'C', 'D']]
        numberMode[this.jack.jackMode].forEach(k => {
          // console.log(this.jack);
          const key = `${dev}${k}`;
          this.PD[key].showMpa = data.float[i].toFixed(2);
          this.PD[key].showMm = data.float[i + 1].toFixed(2);
          this.PD[key].setMpa = data.float[i + 13].toFixed(2);
          this.PD[key].setMm = data.float[i + 14].toFixed(2);
          this.PD[key].upMpa = data.float[i + 15].toFixed(2);
          const state = this.getState(data.uint16[i * 2 + 4], data.uint16[24]);
          this.PD[key].state = state.state.join('·');
          this.PD[key].alarm = state.alarm;
          this.PD[key].autoState = this.getState(data.uint16[i * 2 + 5], data.uint16[24], true, this.stateAutoStr).alarm;
          this.PD[key].autoAlarm = this.carterAutoState(data.uint16[i * 2 + 5], data.uint16[24], true, this.stateAutoStr);
          i += 3;
        });
      }
      // this.onPlcSub(data);
      this.plcSub.next({data, dev});

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
  /** 生成锁机ID */
  getLockID() {
    const arrs = [];
    for (let index = 0; index < 9; index++) {
      const i = Math.floor(Math.random() * 12);
      arrs.push([0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9][i]);
    }
    this.lock.code = arrs.join('');
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
    const s = Array.from(value.toString(2).padStart(16, '0').split('').reverse().join(''));
    s.map((v, i) => {
      if (v === '1') {
        if (i < 3 && !auto) {
          r.state.push(states[i]);
        } else {
          r.alarm.push(states[i]);
        }
      }
    });
    if (r.state.length === 0) {
      r.state.push('待机');
    }
    return r;
  }
  carterAutoState(value: number, PLCstate: number, auto = false, states = this.stateStr) {
    const s = Array.from(value.toString(2).padStart(16, '0').split('').reverse().join(''));
    if (s[3] === '1' || s[5] === '1' || s[6] === '1') {
      return true;
    }
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
    console.log('切换顶', id);
    if (!id) {
      return;
    }
    localStorage.setItem('jackId', JSON.stringify(id));
    const  j = await this.odb.db.jack.filter(f => f.id === id).first(d => {
      console.log(d);
      this.jack = d;
    });
    console.log(this.jack);
    if (!this.jack) {
      return;
    }
    this.gsJack('z');
    if (this.jack.link) {
      this.gsJack('c');
    }
    console.log('切换顶', this.jack);
    return this.jack;
  }
  /** 获取设置顶数据 */
  async gsJack(dev: string) {
    await this.ipcSend(`${dev}F03_float`, PLC_D(2100 + this.jack.saveGroup * 100), 100).then((data: any) => {
      console.log(data);
      deviceGroupModeDev[dev[0]][this.jack.jackMode].map((name, index) => {
        // console.log(name, index);
        const startIndex = index * 10;
        this.jack[name].mm = data.float.slice(startIndex, startIndex + 6).map(v => v.toFixed(5));
        this.jack[name].upper = data.float[startIndex + 6];
        this.jack[name].floot = data.float[startIndex + 7];
      });
      this.ipcSend(`${dev}F06`, PLC_D(407), this.jack.saveGroup);
    }).catch(() => {
      console.error('获取PLC位移校正错误');
    });
  }
  getJackId() {
    const jackId = Number(JSON.parse(localStorage.getItem('jackId')));
    if (jackId) {
      this.selectJack(jackId);
    }
    return jackId;
  }

  getPLCMpa(dev) {
    // await this.ipcSend(`cF03`, PLC_D(2100), 20).then((data: any) => {
    //   console.log(data);
    // });
    this.revise[`${dev}GetMpaState`] = true;
    this.ipcSend(`${dev}F03_float`, PLC_D(2000), 100).then((data: any) => {
      console.log(`${dev}返回的结果`, data);
      this.revise[`${dev}VirtualHeight`] = data.float.slice(40, 47).map(v => v.toFixed(2));
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
