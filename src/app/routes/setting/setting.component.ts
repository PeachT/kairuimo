import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';
import { DbService } from 'src/app/services/db.service';
import { AppService } from 'src/app/services/app.service';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D, PLC_M } from 'src/app/models/IPCChannel';
import { ReviseItemComponent } from 'src/app/shared/revise-item/revise-item.component';

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
    zA : [],
    zB : [],
    zC : [],
    zD : [],
    cA : [],
    cB : [],
    cC : [],
    cD : [],
  };

  constructor(
    private e: ElectronService,
    private odb: DbService,
    public appService: AppService,
    public PLCS: PLCService,
    private message: NzMessageService,
  ) {
    this.getData();
    this.getRevise('z');
    this.getRevise('c');
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
    this.PLCS.ipcSend('zF03', PLC_D(410), 40).then((data: any) => {
      if (data) {
        this.systenDate = data.float;
        this.systenDate[7] = data.int16[14] / 10;
        this.systenDate[14] = data.int16[28] / 10;
      }
      console.log(this.systenDate);
    }).finally(() => {
      this.refState = false;
    });
  }
  getRevise(dev: string = 'z') {
    this.PLCS.ipcSend(`${dev}F03`, PLC_D(500), 48).then((data: any) => {
      if (data) {
        this.revise[`${dev}A`] = data.float.slice(0, 6);
        this.revise[`${dev}B`] = data.float.slice(6, 12);
        this.revise[`${dev}C`] = data.float.slice(12, 18);
        this.revise[`${dev}D`] = data.float.slice(18, 24);
      }
      console.log(data);
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
  ok() {
    const value = this.reviseDom.setForm.value.setValue;
    // const address = this.revise.name.indexOf('A') > -1 ? 500 : 520;
    let address = 500;
    switch (this.revise.name) {
      // case 'zA':
      //   address = 500;
      //   break;
      case 'zB':
        address = 512;
        break;
      case 'zC':
        address = 524;
        break;
      case 'zD':
        address = 536;
        break;
      default:
        break;
    }
    const dev = this.revise.name.indexOf('z') > -1 ? 'z' : 'c';
    console.log(value, address, dev);
    this.PLCS.ipcSend(`${dev}F016_float`, PLC_D(address), value).then(() => {
      this.revise.state = false;
      this.getRevise(dev);
    });
  }
}
