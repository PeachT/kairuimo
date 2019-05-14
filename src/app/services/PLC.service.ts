import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';

import { Subject, Observable, interval } from 'rxjs';
import { PLC_D } from '../models/IPCChannel';
import { PLCLiveData } from '../models/live';
import { plcToMpa, plcToMm, mmToPlc } from '../Function/device.date.processing';
import { MpaRevise, AutoDate } from '../models/device';
import { Jack } from '../models/jack';
import { DbService } from './db.service';


const mpaRevise: MpaRevise = {
  zA: [1, 1, 1, 1, 1, 1],
  zB: [1, 1, 1, 1, 1, 1],
  zC: [1, 1, 1, 1, 1, 1],
  zD: [1, 1, 1, 1, 1, 1],
  cA: [1, 1, 1, 1, 1, 1],
  cB: [1, 1, 1, 1, 1, 1],
  cC: [1, 1, 1, 1, 1, 1],
  cD: [1, 1, 1, 1, 1, 1],
};
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
  mpaRevise: MpaRevise;

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

  public PD: PLCLiveData = {
    zA: {
      showMpa: 0,
      showMm: 0,
      state: '设备未连接',
      alarm: [],
      autoState: [],
    },
    zB: {
      showMpa: 0,
      showMm: 0,
      state: '设备未连接',
      alarm: [],
      autoState: [],
    },
    zC: {
      showMpa: 0,
      showMm: 0,
      state: '设备未连接',
      alarm: [],
      autoState: [],
    },
    zD: {
      showMpa: 0,
      showMm: 0,
      state: '设备未连接',
      alarm: [],
      autoState: [],
    },
    cA: {
      showMpa: 0,
      showMm: 0,
      state: '设备未连接',
      alarm: [],
      autoState: [],
    },
    cB: {
      showMpa: 0,
      showMm: 0,
      state: '设备未连接',
      alarm: [],
      autoState: [],
    },
    cC: {
      showMpa: 0,
      showMm: 0,
      state: '设备未连接',
      alarm: [],
      autoState: [],
    },
    cD: {
      showMpa: 0,
      showMm: 0,
      state: '设备未连接',
      alarm: [],
      autoState: [],
    },
  };
  private stateStr = ['张拉', '回程', '卸荷', '压力上限', '压力未连接', '位移上限', '位移下限', '位移未连接', '超设置压力', '超设置位移', '模块错误', '急停', '自动暂停'];
  private stateAutoStr = ['等待保压', '卸荷完成', '回顶完成', '超工作位移上限', '平衡暂停', '压力差报警', '伸长量偏差报警', '张拉完成'];
  // 0压力确认 1回程 2卸荷 3 卸荷完成 4回顶 5回顶完成 6超工作位移上限
  /** 搜索事件 */
  private plcSub = new Subject();

  constructor(
    private e: ElectronService,
    private message: NzMessageService,
    private odb: DbService,
  ) {
    const revise = JSON.parse(localStorage.getItem('mpaRevise'));
    if (!revise) {
      this.setMpaRevise(mpaRevise);
    } else {
      this.mpaRevise = revise;
    }
    const auto = JSON.parse(localStorage.getItem('autoDate'));
    if (!auto) {
      this.setAutoData(autoDate);
    }
    this.ipcOn('z');
    this.ipcOn('c');
    this.selectJack(this.getJackId());
  }

  // 获得一个Observable;
  public PLCobservble = this.plcSub.asObservable();

  // 发射数据，当调用这个方法的时候，Subject就会发射这个数据，所有订阅了这个Subject的Subscription都会接受到结果
  public onSharch() {

  }
  /** 获取实时数据 */
  private ipcOn(dev: string = 'z') {
    this.e.ipcRenderer.on(`${dev}connection`, (event, data) => {
      console.log(dev, data);
    });
    this.e.ipcRenderer.on(`${dev}heartbeat`, (event, data) => {
      // console.log(data);
      this.plcState[`${dev}LT`] = new Date().getTime() - this.plcState[`${dev}OT`] - 1000;
      this.plcState[`${dev}OT`] = new Date().getTime();
      clearTimeout(this.plcState[`${dev}T`]);
      this.plcState[dev] = true;
      if (this.mpaRevise && this.jack) {
        // console.log(data);
        this.PD[`${dev}A`].showMpa = plcToMpa(data.int16[0], this.mpaRevise[`${dev}A`]);
        this.PD[`${dev}A`].showMm = plcToMm(data.int16[1], this.jack[`${dev}A`].mm);
        const astate = this.getState(data.int16[2]);
        this.PD[`${dev}A`].state = astate.state.join('·');
        this.PD[`${dev}A`].alarm = astate.alarm;
        this.PD[`${dev}A`].autoState = this.getState(data.int16[3], true, this.stateAutoStr).alarm;

        this.PD[`${dev}B`].showMpa = plcToMpa(data.int16[5], this.mpaRevise[`${dev}A`]);
        this.PD[`${dev}B`].showMm = plcToMm(data.int16[6], this.jack[`${dev}A`].mm);
        const bstate = this.getState(data.int16[7]);
        this.PD[`${dev}B`].state = bstate.state.join('·');
        this.PD[`${dev}B`].alarm = bstate.alarm;
        this.PD[`${dev}B`].autoState = this.getState(data.int16[8], true, this.stateAutoStr).alarm;

        this.PD[`${dev}C`].showMpa = plcToMpa(data.int16[10], this.mpaRevise[`${dev}A`]);
        this.PD[`${dev}C`].showMm = plcToMm(data.int16[11], this.jack[`${dev}A`].mm);
        const cstate = this.getState(data.int16[12]);
        this.PD[`${dev}C`].state = cstate.state.join('·');
        this.PD[`${dev}C`].alarm = cstate.alarm;
        this.PD[`${dev}C`].autoState = this.getState(data.int16[13], true, this.stateAutoStr).alarm;

        this.PD[`${dev}D`].showMpa = plcToMpa(data.int16[15], this.mpaRevise[`${dev}A`]);
        this.PD[`${dev}D`].showMm = plcToMm(data.int16[16], this.jack[`${dev}A`].mm);
        const dstate = this.getState(data.int16[17]);
        this.PD[`${dev}D`].state = dstate.state.join('·');
        this.PD[`${dev}D`].alarm = dstate.alarm;
        this.PD[`${dev}D`].autoState = this.getState(data.int16[18], true, this.stateAutoStr).alarm;
      }
      this.plcSub.next();

      this.plcState[`${dev}T`] = setTimeout(() => {
        this.plcState[dev] = false;
        clearTimeout(this.plcState[`${dev}T`]);
      }, 3000);
    });
    this.e.ipcRenderer.on(`${dev}error`, (event, data) => {
      console.error(dev, data);
      this.plcState[`${dev}LT`] = '重新链接...';
      this.PD[`${dev}A`].state = '重新链接中...';
      this.PD[`${dev}B`].state = '重新链接中...';
      this.PD[`${dev}C`].state = '重新链接中...';
      this.PD[`${dev}D`].state = '重新链接中...';
    });
  }
  /** 转换设备状态 */
  getState(value: number, auto = false, states = this.stateStr): { state: Array<string>, alarm: Array<string> } {
    const r = {
      state: [],
      alarm: [],
    };
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


  /** 获取压力校正系数 */
  getMpaRevise(): MpaRevise {
    this.mpaRevise = JSON.parse(localStorage.getItem('mpaRevise'));
    return this.mpaRevise;
  }

  /** 设置压力校正系数 */
  setMpaRevise(revise: MpaRevise) {
    localStorage.setItem('mpaRevise', JSON.stringify(revise));
    this.mpaRevise = revise;
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
    localStorage.setItem('jackId', JSON.stringify(id));
    await this.odb.db.jack.filter(f => f.id === id).first(d => {
      this.jack = d;
    });
    this.ipcSend('zF016', PLC_D(420), [
      mmToPlc(this.jack.zA.upper, this.jack.zA.mm), mmToPlc(this.jack.zA.floot, this.jack.zA.mm),
      mmToPlc(this.jack.zB.upper, this.jack.zB.mm), mmToPlc(this.jack.zB.floot, this.jack.zB.mm),
      mmToPlc(this.jack.zC.upper, this.jack.zC.mm), mmToPlc(this.jack.zC.floot, this.jack.zC.mm),
      mmToPlc(this.jack.zD.upper, this.jack.zD.mm), mmToPlc(this.jack.zD.floot, this.jack.zD.mm),
    ]);
    this.ipcSend('cF016', PLC_D(420), [
      mmToPlc(this.jack.cA.upper, this.jack.zA.mm), mmToPlc(this.jack.cA.floot, this.jack.zA.mm),
      mmToPlc(this.jack.cB.upper, this.jack.zB.mm), mmToPlc(this.jack.cB.floot, this.jack.zB.mm),
      mmToPlc(this.jack.cC.upper, this.jack.zC.mm), mmToPlc(this.jack.cC.floot, this.jack.zC.mm),
      mmToPlc(this.jack.cD.upper, this.jack.zD.mm), mmToPlc(this.jack.cD.floot, this.jack.zD.mm),
    ]);
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
}
