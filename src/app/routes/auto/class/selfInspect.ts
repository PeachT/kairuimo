import { groupModeStr, DeviceValue } from 'src/app/models/jack';
import { PLCLiveData } from 'src/app/models/live';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_Y } from 'src/app/models/IPCChannel';
import { Observable, interval, Subject, Subscription } from 'rxjs';

export class SelfInspect {
  private device: string;
  private names: Array<string>;
  private modes: Array<string>;
  data: {
    state: {},
    msg: {},
    pauseMsg: any,
    mm: {[propName: string]: DeviceValue}
  };
  private PLCS: PLCService;
  private index = 0;
  private address = 0;
  startSb: Subscription;
  private sub = new Subject();
  // 获得一个Observable;
  subject = this.sub.asObservable();
  success = 0;

  constructor(device: string, mode: string, plc: PLCService) {
    this.PLCS = plc;
    this.device = device;
    this.names = groupModeStr('AB8').map((name) => {
      return `${device}${name}`;
    });
    this.modes = groupModeStr(mode).map((name) => {
      const key = `${device}${name}`;
      this.data.state[key] = null;
      return key;
    });
    this.run();
  }

  private run() {
    /** 自检前记录位移 */
    groupModeStr('AB8').map(n => {
      this.data.mm[n] = this.PLCS.PD[n].showMm || 0;
    });
    this.address = { A: 16, B: 20, C: 24, D: 28}[this.modes[this.index][1]];
    this.startPLC(this.address);
  }
  startPLC(address) {
    this.PLCS.ipcSend(`${this.device}F05`, PLC_Y(address), true);
  }

  /**
   * *自检
   */
  private start() {
    // let is = 0;
    const ist = interval(1000);
    const name = this.modes[this.index][1];
    const names = groupModeStr('AB8');
    const device = this.device;
    this.startSb = ist.subscribe(x => {
      console.log(x);
      // console.log('运行中');
      names.map(n => {
        const subMm = Number(this.PLCS.PD[n].showMm) - Number(this.data.mm[n]);
        console.log(n, subMm);
        if (n === name && subMm >= 1) {
          this.setData(name, 2, '自检完成');
        } else if (subMm > 1 || subMm < -1) {
          this.setData(name, 3, `位移自检错误${subMm}`);
        } else if (this.PLCS.PD[n].showMpa > 1.5) {
          this.setData(name, 3, `压力自检错误${this.PLCS.PD[n].showMpa}`);
        }

      });
      const state = this.data.state[name];
      if (state > 2 || x > 15) {
        this.success = 2;
        this.startSb.unsubscribe();
        this.sub.next(false);
        console.log(name, device, '失败');
        console.log(this.data.state);
        this.PLCS.ipcSend(`${device}F05`, PLC_Y(this.address), false);
        this.PLCS.ipcSend(`${device}F05`, PLC_Y(0), false);
        this.PLCS.ipcSend(`${device}F05`, PLC_Y(1), false);
        this.data.pauseMsg = `${name}自检错误！切换到手动模式测试设备是否正常！`;
      } else if (state === 2) {
        this.startSb.unsubscribe();
        this.index ++;
        this.PLCS.ipcSend(`${device}F05`, PLC_Y(this.address), false);
        console.log(name, device, '成功');
        if (this.index === this.modes.length - 1) {
          this.success = 1;
          this.sub.next(true);
          console.log(device, '全部测试通过');
          this.PLCS.ipcSend(`${device}F05`, PLC_Y(0), false);
          this.PLCS.ipcSend(`${device}F05`, PLC_Y(1), false);
        } else {
          this.run();
        }
      }
    });
  }
  private setData(name, state, msg) {
    this.data.state[name] = state;
    this.data.msg[name] = msg;
  }
}
