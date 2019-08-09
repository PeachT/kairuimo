import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';
import { DbService } from 'src/app/services/db.service';
import { AppService } from 'src/app/services/app.service';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D, PLC_M } from 'src/app/models/IPCChannel';
import { mpaToPlc, mmToPlc } from 'src/app/Function/device.date.processing';
import { DebugData } from 'src/app/models/debug';

@Component({
  selector: 'app-manual-item',
  templateUrl: './manual-item.component.html',
  styleUrls: ['./manual-item.component.less']
})
export class ManualItemComponent implements OnInit {
  // [x: string]: any;
  /** 设备名称 */
  @Input() name: any;
  /** 设备设置数据 */
  @Input()
    dev = {
      setMpa: 0,
      setMm: 0,
      setUn: 0
    };

  devName = 'z';

  setAeeress: Array<number>;
  setM = [20, 21, 22, 23];
  setMState = [false, false, false, false];

  PLCD: any;
  alarm = {
    state: false,
    name: null,
    datas: []
  };
  zero = 0;


  mpaMarks: any = {
    0: '0',
    20: '20',
    10: '10',
    30: '30',
    40: '40',
    50: '50',
    60: {
      style: {
        color: '#f50',
      },
      label: '<strong>60</strong>',
    }
  };
  mpaMarksNull: any = {
    0: null,
    10: null,
    20: null,
    30: null,
    40: null,
    50: null,
    60: null
  };
  mmMarks: any = {
    0: '0',
    40: '40',
    80: '80',
    120: '120',
    160: '160',
    220: {
      style: {
        color: '#f50',
      },
      label: '<strong>220</strong>',
    }
  };
  mmMarksNull: any = {
    0: null,
    40: null,
    80: null,
    120: null,
    160: null,
    200: null,
  };
  ms = 0;
  debugItem = null;
  debugItems = ['m5', 'm10', 'm15', 'm20', 'm25', 'm30', 'm35', 'm40', 'm45', 'm50', 'm55', 'mmSpeed'];
  debugNames = ['5Mpa保压', '10Mpa保压', '15Mpa保压', '20Mpa保压', '25Mpa保压', '30Mpa保压',
                '35Mpa保压', '40Mpa保压', '45Mpa保压', '50Mpa保压', '54.5 ~ 55Mpa安全阀测试', '顶速度'];
  debugData: DebugData;

  constructor(
    public appS: AppService,
    private e: ElectronService,
    private odb: DbService,
    public appService: AppService,
    public PLCS: PLCService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
    console.log(this.name);
    // setInterval(() => {
    //   this.ms ++;
    //   console.log(this.ms);
    //   if (this.ms > 10000) {
    //     this.ms = 0;
    //   }
    //   this.cdr.markForCheck();
    // }, 50);

    this.PLCD = this.PLCS.PD[this.name];
    console.log(this.PLCD);
    this.devName = this.name[0];
    const key = this.name[1];
    // this.setAeeress = this.name.indexOf('A') > -1 ? [100, 102] : [106, 108];
    switch (true) {
      case key === 'A':
        this.setAeeress = [26, 28, 30];
        this.setM = [20, 21, 22, 23];
        break;
        case key === 'B':
        this.setAeeress = [32, 34, 36];
        this.setM = [24, 25, 26, 27];
        break;
        case key === 'C':
        this.setAeeress = [38, 40, 42];
        this.setM = [30, 31, 32, 33];
        break;
        case key === 'D':
        this.setAeeress = [44, 46, 48];
        this.setM = [34, 35, 36, 37];
        break;
      default:
        break;
    }
    const localStorageName = `debug${this.PLCS.jack.id}${this.name}`;
    const debugData =  JSON.parse(localStorage.getItem(localStorageName));
    if (!debugData) {
      this.debugData = {
        m5: { date: null},
        m10: { date: null},
        m15: { date: null},
        m20: { date: null},
        m25: { date: null},
        m30: { date: null},
        m35: { date: null},
        m40: { date: null},
        m45: { date: null},
        m50: { date: null},
        m55: { date: null},
        mmSpeed: { date: null},
      }
      localStorage.setItem(localStorageName, JSON.stringify(this.debugData));
    } else {
      this.debugData =  debugData;
    }
    console.log(this.debugData, localStorageName);
  }

  /** 设置数据 */
  async set(address: number, value: number, cla: string = 'mm'): Promise<boolean> {
    console.log(value);
    let state = false;
    // this.PLCS.ipcSend(`${this.devName}F016_float`, PLC_D(address), [value]);
    if (cla === 'mpa') {
      await this.PLCS.ipcSend(`${this.devName}F016_float`, PLC_D(address), [value]).then((d: any) => {
        state = true;
      });
    } else {
      await this.PLCS.ipcSend(`${this.devName}F016_float`, PLC_D(address), [value]).then((d) => {
        state = true;
      });
    }
    return state;
  }

  showAlarm() {
    // this.showAlarmOut.emit(this.name);
    this.alarm.state = true;
    this.alarm.datas = this.PLCD.alarm;
    this.alarm.name = `${name}报警状态`;
  }
  /** 清零 */
  onZero() {
    this.zero = this.PLCD.showMm;
  }

  /** 按下 */
  onDown(i: number) {
    console.log('按下');
    if (this.PLCS.PD[this.name].setMpa > 0 || i > 0) {
      console.log(this.setM[i]);
      this.PLCS.ipcSend(`${this.devName}F05`, PLC_M(this.setM[i]), true);
      this.setMState[i] = true;
    } else {
      this.message.warning('设置压力不能等于0MPa');
    }
    if (this.PLCS.PD[this.name].setMm > 0 && this.PLCS.PD[this.name].setMm < this.PLCS.PD[this.name].showMm) {
      this.message.warning('位移超出设置值');
    }
    if (this.PLCS.PD[this.name].setMpa < this.PLCS.PD[this.name].showMpa) {
      this.message.warning('压力超出设置值');
    }
  }
  /** 松开 */
  onUp(i) {
    console.log('松开');
    if (this.setMState[i]) {
      console.log(this.setM[i]);
      this.PLCS.ipcSend(`${this.devName}F05`, PLC_M(this.setM[i]), false);
      this.setMState[i] = false;
    }
  }
  selectDebug(e) {
    console.log(e);
  }
  runDebug() {
    const name = this.name;
    const i = this.debugItem.i;
    const key = this.debugItem.key;
    console.log(name, i, key);
    this.message.warning('未完成功能');
    // if (i < 10) {
    //   const max = i * 5 + 5;
    //   const min = i * 5;
    //   if (this.showMpa > min && this.showMpa < max) {
    //     this.debugData[name][key].start = this.showMpa;
    //     this.debugData[name][key].date = new Date();
    //     this.debugData[name][key].time = 0;
    //     const ti = setInterval(() => {
    //       this.debugData[name][key].time++;
    //       console.log(this.debugData[name][key]);
    //       this.debugData[name][key].end = this.showMpa;
    //       this.cdr.markForCheck();
    //       if (this.debugData[name][key].time >= 90) {
    //         clearInterval(ti);
    //       }
    //     }, 1000);
    //     this.t.push(ti);
    //   }
    // }
  }
}
