import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';
import { DbService } from 'src/app/services/db.service';
import { AppService } from 'src/app/services/app.service';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D, PLC_M } from 'src/app/models/IPCChannel';
import { mpaToPlc, mmToPlc } from 'src/app/Function/device.date.processing';

@Component({
  selector: 'app-manual-item',
  templateUrl: './manual-item.component.html',
  styleUrls: ['./manual-item.component.less']
})
export class ManualItemComponent implements OnInit {
  /** 设备名称 */
  @Input()
    name: any;
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
    0: '0Mpa',
    20: '20Mpa',
    10: '10Mpa',
    30: '30Mpa',
    40: '40Mpa',
    50: '50Mpa',
    60: {
      style: {
        color: '#f50',
      },
      label: '<strong>60Mpa</strong>',
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
    0: '0mm',
    40: '40mm',
    80: '80mm',
    120: '120mm',
    160: '160mm',
    200: {
      style: {
        color: '#f50',
      },
      label: '<strong>200mm</strong>',
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

  constructor(
    private e: ElectronService,
    private odb: DbService,
    public appService: AppService,
    public PLCS: PLCService,
    private message: NzMessageService,
  ) {
  }

  ngOnInit() {
    console.log(this.name);

    this.PLCD = this.PLCS.PD[this.name];
    console.log(this.PLCD);
    this.devName = this.name[0];
    // this.setAeeress = this.name.indexOf('A') > -1 ? [100, 102] : [106, 108];
    switch (true) {
      case this.name.indexOf('A') > -1:
        this.setAeeress = [100, 101];
        this.setM = [20, 21, 22, 23];
        break;
        case this.name.indexOf('B') > -1:
        this.setAeeress = [105, 106];
        this.setM = [24, 25, 26, 27];
        break;
        case this.name.indexOf('C') > -1:
        this.setAeeress = [110, 111];
        this.setM = [30, 31, 32, 33];
        break;
        case this.name.indexOf('D') > -1:
        this.setAeeress = [115, 116];
        this.setM = [34, 35, 36, 37];
        break;
      default:
        break;
    }
  }

  /** 设置数据 */
  set(address: number, value: number, state: string = 'mm') {
    console.log(value);
    // this.PLCS.ipcSend(`${this.devName}F016_float`, PLC_D(address), [value]);
    if (state === 'mpa') {
      this.PLCS.ipcSend(`${this.devName}F06`, PLC_D(address), mpaToPlc(value, this.PLCS.mpaRevise[this.name]));
      this.dev.setMpa = value;
    } else {
      this.PLCS.ipcSend(`${this.devName}F06`, PLC_D(address), mmToPlc(value, this.PLCS.jack[this.name].mm));
      this.dev.setMm = value;
    }
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

  /** 松开 */
  onDown(i: number) {
    if (this.dev.setMpa > 0 || i > 0) {
      console.log(this.setM[i]);
      this.PLCS.ipcSend(`${this.devName}F05`, PLC_M(this.setM[i]), true);
      this.setMState[i] = true;
    } else {
      this.message.warning('设置压力不能等于0MPa');
    }
  }
  /** 按下 */
  onUp(i) {
    if (this.setMState[i]) {
      console.log(this.setM[i]);
      this.PLCS.ipcSend(`${this.devName}F05`, PLC_M(this.setM[i]), false);
      this.setMState[i] = false;
    }
  }
}
