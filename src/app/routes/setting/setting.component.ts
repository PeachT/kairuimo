import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';
import { DbService } from 'src/app/services/db.service';
import { AppService } from 'src/app/services/app.service';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D, PLC_M } from 'src/app/models/IPCChannel';
import { ReviseItemComponent } from 'src/app/shared/revise-item/revise-item.component';
import { plcToMpa, mpaToPlc } from 'src/app/Function/device.date.processing';
import { MpaRevise, AutoDate } from 'src/app/models/device';
import { numberMode } from 'src/app/models/jack';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.less']
})
export class SettingComponent implements OnInit, OnDestroy {
  @ViewChild('reviseDom', null) reviseDom: ReviseItemComponent;

  systenDate = {
    z: [],
    c: [],
  };
  refState = false;
  it = null;
  revise = {
    state: false,
    name: null,
    dev: null,
    devName: null,
    zMode: [],
    cMode: [],
    mpaStage: ['5Mpa', '15Mpa', '25Mpa', '35Mpa', '45Mpa', '55Mpa'],
  };
  // mpaRevise: MpaRevise;
  autoData: AutoDate;
  heartbeatRateValue = null;
  keyboard = {
    text: {w: 0, h: 0},
    number: {w: 0, h: 0},
  };

  constructor(
    private e: ElectronService,
    private odb: DbService,
    public appService: AppService,
    public PLCS: PLCService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.getData('z');
    this.getData('c');
    // this.mpaRevise = this.PLCS.getMpaRevise();
    this.autoData = this.PLCS.getAutoDate();
    this.heartbeatRateValue = this.PLCS.heartbeatRate();
    this.keyboard = JSON.parse(localStorage.getItem('keyboard'));
  }

  ngOnInit() {
    // this.it = setInterval(() => {
    //   console.log('setting');
    // }, 1000);
  }

  ngOnDestroy() {
    console.log('退出');
    clearInterval(this.it);
  }
  /** 获取设置数据 */
  getData(dev) {
    this.PLCS.getPLCMpa(dev);
    console.log('123123123123123123132132');
    // this.PLCS.ipcSend(`zF03`, PLC_D(410), 6);
    this.PLCS.ipcSend(`${dev}F03`, PLC_D(408), 12).then((data: any) => {
      if (data) {
        console.log(data);
        /** 设备模式 */
        this.systenDate[`${dev}`][4] = data.uint16[0];

        this.systenDate[`${dev}`][0] = data.float[2];
        this.systenDate[`${dev}`][1] = data.float[3];
        this.systenDate[`${dev}`][2] = data.float[4];
        this.systenDate[`${dev}`][3] = data.uint16[10] / 10;
        this.revise[`${dev}Mode`] = numberMode[data.uint16[0]];
        console.log(this.revise[`${dev}Mode`]);
        this.cdr.markForCheck();
      }
      console.log('获取PLC设备数据', data, this.systenDate);
    }).finally(() => {
      this.refState = false;
    });
  }

  setF016(dev = 'z', address: number, value: number) {
    console.log(value);
    this.PLCS.ipcSend(`${dev}F016_float`, PLC_D(address), [value]);
  }
  setF06(dev = 'z', address: number, value: number) {
    console.log(value);
    this.PLCS.ipcSend(`${dev}F06`, PLC_D(address), value);
  }
  ref() {
    this.refState = true;
    this.getData('z');
    this.getData('c');
  }

  onRevise(dev: string, name: string) {
    this.revise.dev = dev;
    this.revise.name = name;
    this.revise.devName = `${dev}${name}`;
    this.revise.state = true;
    console.log(name, this.revise);
  }

  cancel() {
    this.revise.state = false;
  }
  /** 修改压力校正 */
  ok() {
    const value = this.reviseDom.setForm.value.setValue;
    const name = this.revise.name;
    console.log(value, name);
    // this.mpaRevise[name] = value;
    // this.PLCS.setMpaRevise(this.mpaRevise);
    const address = {A: 0, B: 1, C: 2, D: 3}[this.revise.name];
    this.PLCS.ipcSend(`${this.revise.dev}F016_float`, PLC_D(2000 + address * 20), value).then((data) => {
      console.log(data);
      this.PLCS.getPLCMpa(this.revise.dev);
      this.cdr.markForCheck();
      this.revise.state = false;
    }).catch(() => {
      this.message.error('设置错误');
    });
    // console.log(this.PLCS.mpaRevise);
  }
  /** 修改自动参数 */
  setAuto() {
    this.PLCS.setAutoData(this.autoData);
  }
  /**
   * *设置采集频率
   */
  heartbeatRate(delay) {
    this.PLCS.heartbeatRate(delay);
  }
  setKeyboard() {
    localStorage.setItem('keyboard', JSON.stringify(this.keyboard));
  }
  setVirtualHeight(dev) {
    this.PLCS.ipcSend(`${dev}F016_float`, PLC_D(2080), this.PLCS.revise[`${dev}VirtualHeight`]).then((data) => {
      console.log(data);
      this.message.success('更新虚高压力完成');
      this.PLCS.getPLCMpa(dev);
      this.cdr.markForCheck();
    }).catch(() => {
      this.message.error('设置错误');
    });
  }
}
