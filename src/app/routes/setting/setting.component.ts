import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';
import { DbService } from 'src/app/services/db.service';
import { AppService } from 'src/app/services/app.service';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D, PLC_M } from 'src/app/models/IPCChannel';
import { ReviseItemComponent } from 'src/app/shared/revise-item/revise-item.component';
import { plcToMpa, mpaToPlc } from 'src/app/Function/device.date.processing';
import { MpaRevise, AutoDate } from 'src/app/models/device';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.less']
})
export class SettingComponent implements OnInit, OnDestroy {
  @ViewChild('reviseDom')
    reviseDom: ReviseItemComponent;

  systenDate = [];
  refState = false;
  it = null;
  revise = {
    state: false,
    name: 'zA',
    dev: ['zA', 'zB', 'zC', 'zD', 'cA', 'cB', 'cC', 'cD'],
    mpaStage: ['5Mpa', '15Mpa', '25Mpa', '35Mpa', '45Mpa', '55Mpa'],
  };
  mpaRevise: MpaRevise;
  mpaToPlc = mpaToPlc;
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
  ) {
    this.getData();
    this.mpaRevise = this.PLCS.getMpaRevise();
    this.autoData = this.PLCS.getAutoDate();
    const heartbeatRate = localStorage.getItem('heartbeatRate');
    if (heartbeatRate) {
      this.heartbeatRate(heartbeatRate);
    } else {
      this.heartbeatRateValue = this.e.remote.getGlobal('heartbeatRate');
      this.heartbeatRate(this.heartbeatRateValue);
    }
    this.keyboard = JSON.parse(localStorage.getItem('keyboard'));
  }

  ngOnInit() {
    this.it = setInterval(() => {
      console.log('setting');
    }, 1000);
  }

  ngOnDestroy() {
    console.log('退出');
    clearInterval(this.it);
  }
  /** 获取设置数据 */
  getData() {
    console.log('123123123123123123132132');
    // this.PLCS.ipcSend(`zF03`, PLC_D(410), 6);
    this.PLCS.ipcSend('zF03', PLC_D(408), 8).then((data: any) => {
      if (data) {
        this.systenDate[0] = plcToMpa(data.int16[2], null);
        this.systenDate[1] = plcToMpa(data.int16[3], null);
        this.systenDate[2] = plcToMpa(data.int16[4], null);
        this.systenDate[3] = data.int16[3] / 10;
        /** 设备模式 */
        this.systenDate[4] = data.int16[0];
      }
      console.log('获取PLC设备数据', data, this.systenDate);
    }).finally(() => {
      this.refState = false;
    });
  }

  setF16(address: number, value: number) {
    console.log(value);
    this.PLCS.ipcSend('zF016_float', PLC_D(address), [value]);
  }
  setF06(address: number, value: number) {
    console.log(value);
    this.PLCS.ipcSend('zF06', PLC_D(address), value);
  }
  ref() {
    this.refState = true;
    this.getData();
  }

  onRevise(name: string) {
    this.revise.name = name;
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
    this.mpaRevise[name] = value;
    this.PLCS.setMpaRevise(this.mpaRevise);
    this.revise.state = false;
    console.log(this.PLCS.mpaRevise);
  }
  /** 修改自动参数 */
  setAuto() {
    this.PLCS.setAutoData(this.autoData);
  }
  /**
   * *设置采集频率
   */
  heartbeatRate(delay) {
    localStorage.setItem('heartbeatRate', delay);
    this.e.ipcRenderer.send('heartbeatRate', delay);
    console.log('设置采集频率', localStorage.getItem('heartbeatRate'));
    this.PLCS.heartbeatRateValue = delay;
    this.heartbeatRateValue = delay;
  }
  setKeyboard() {
    localStorage.setItem('keyboard', JSON.stringify(this.keyboard));
  }
}
