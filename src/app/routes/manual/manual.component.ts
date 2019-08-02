import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ViewContainerRef, ComponentFactoryResolver, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';
import { DbService, DB } from 'src/app/services/db.service';
import { AppService } from 'src/app/services/app.service';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D, PLC_M, PLC_S } from 'src/app/models/IPCChannel';
import { plcToMpa } from 'src/app/Function/device.date.processing';
import { ManualItemComponent } from 'src/app/shared/manual-item/manual-item.component';
import { DebugData } from 'src/app/models/debug';
import { deviceGroupMode } from 'src/app/models/jack';

@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('domz', { read: ViewContainerRef, static: false }) domz: ViewContainerRef;
  @ViewChild('domc', { read: ViewContainerRef, static: false }) domc: ViewContainerRef;
  db: DB;
  selectedJack: any;
  selectedI: any = null;
  jacks = [];
  selectJackId = 1;
  deviceMode = true;
  devModeStr: any = {z: ['zA', 'zB', 'zC', 'zD'], c: ['cA', 'cB', 'cC', 'cD']};
  /** 点动  强制  补压 */
  zMarginMode = [false, false, false];
  cMarginMode = [false, false, false];
  alarm = {
    state: false,
    name: null,
    datas: []
  };

  da = 0;
  setDev = {
    zA: {
      setMpa: 0,
      setMm: 0,
      setUn: 0
    },
    zB: {
      setMpa: 0,
      setMm: 0.56,
      setUn: 0
    },
    zC: {
      setMpa: 0,
      setMm: 0,
      setUn: 0
    },
    zD: {
      setMpa: 0,
      setMm: 0.56,
      setUn: 0
    },
    cA: {
      setMpa: 0,
      setMm: 10.56,
      setUn: 0
    },
    cB: {
      setMpa: 0,
      setMm: 0,
      setUn: 0
    },
    cC: {
      setMpa: 0,
      setMm: 10.56,
      setUn: 0
    },
    cD: {
      setMpa: 0,
      setMm: 0,
      setUn: 0
    }
  };
  showDev = {
    zA: true,
    zB: true,
    zC: true,
    zD: true,
    cA: true,
    cB: true,
    cC: true,
    cD: true,
  };

  it = null;
  zmsg = null;
  cmsg = null;

  connection = true;

  anchor = {
    z: [],
    c: []
  };

  constructor(
    private e: ElectronService,
    private odb: DbService,
    public appService: AppService,
    public PLCS: PLCService,
    private message: NzMessageService,
    private cfr: ComponentFactoryResolver,
    private cdr: ChangeDetectorRef
  ) {
    this.db = this.odb.db;
  }

  async ngOnInit() {
    this.PLCS.plcSubject.subscribe((data) => {
      if (this.PLCS.PD.zA.alarm.indexOf('急停') > -1) {
        this.zmsg = '急停！！';
      } else if (this.PLCS.PD.zA.alarm.indexOf('相序错误') > -1) {
        this.zmsg = '相序错误！！';
      } else {
        this.zmsg = null;
      }
      if (this.PLCS.PD.cA.alarm.indexOf('急停') > -1) {
        this.cmsg = '急停！！';
      } else if (this.PLCS.PD.cA.alarm.indexOf('相序错误') > -1) {
        this.cmsg = '相序错误！！';
      } else {
        this.cmsg = null;
      }
      this.cdr.markForCheck();
    });
    // this.it = setInterval(() => {
    //   // this.da = this.da++;
    //   // console.log('manual');
    // }, 500);
    // 获取顶
    await this.db.jack.toArray().then((d) => {
      this.jacks = d.map(item => {
        return { name: item.name, id: item.id };
      });
    });
    await this.onSelectedDevice(this.PLCS.getJackId());
    /** 获取设备压力校正 */
    // await this.PLCS.getMpaRevise();
    this.selectManual('z');
    this.selectManual('c');
    this.getManualData('z');
    this.getManualData('c');
    console.log('init');
    // this.f5();

  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    console.log('退出');
    clearInterval(this.it);
    this.selectManual('z', [false, false, false, false]);
    this.selectManual('c', [false, false, false, false]);
    this.PLCS.ipcSend('zF05', PLC_S(0), false);
    this.PLCS.ipcSend('cF05', PLC_S(0), false);
  }
  /** 切换设备 */
  async onSelectedDevice(id) {
    console.log(id);
    // this.PLCS.ipcSend('zF06', PLC_S(0), id);
    this.selectJackId = id;
    const jack = await this.PLCS.selectJack(id);
    const devModeStr = [
      {},
      { z: ['zA'], c: ['cA'] },
      { z: ['zA', 'zB'], c: ['cA', 'cB'] },
      {},
      { z: ['zA', 'zB', 'zC', 'zD'], c: ['cA', 'cB', 'cC', 'cD'] }
    ];
    this.devModeStr = devModeStr[jack.jackMode];
    console.log(jack, this.devModeStr);
    this.f5();
  }

  /** 切换手动 */
  selectManual(dev: string = 'z', array = [true, false, false, false]) {
    this.PLCS.ipcSend(`${dev}F15`, PLC_M(100), array);
  }
  /** 获取手动数据 */
  getManualData(dev: string = 'z', ) {
    console.log(this.PLCS.jack, this.PLCS.mpaRevise);
    this.PLCS.ipcSend(`${dev}F03`, PLC_D(100), 20).then((data: any) => {
      console.log('手动数据', data);
      let i = 0;
      this.devModeStr[dev].map(name => {
        this.setDev[name].setMpa = plcToMpa(data.int16[i], this.PLCS.mpaRevise[name]);
        this.setDev[name].setMm = plcToMpa(data.int16[i + 1], this.PLCS.jack[name]);
        this.setDev[name].setUn = plcToMpa(data.int16[i + 2], this.PLCS.mpaRevise[name]);
        i += 3;
      });
    });
  }

  setF15(index: number, dev: string = 'z') {
    const channel = `${dev}F15`;
    const array = [false, false, false];
    array[index] = !this[`${dev}MarginMode`][index];
    console.log(array);
    this.PLCS.ipcSend(`${dev}F15`, PLC_M(101), array).then(() => {
      this[`${dev}MarginMode`] = array;
    });
  }
  /** 查看报警 */
  showAlarm(name: string) {
    this.alarm.state = true;
    this.alarm.datas = this.PLCS.PD[name].alarm;
    this.alarm.name = `${name}报警状态`;
  }
  /**
   * *刷新
   */
  f5() {
    console.log('刷新', this.devModeStr);
    this.domz.clear();
    this.domc.clear();
    this.anchor.z = [];
    this.anchor.c = [];
    this.devModeStr.z.map(name => {
      const com = this.cfr.resolveComponentFactory(ManualItemComponent);
      const comp = this.domz.createComponent(com);
      // dev
      // name
      comp.instance.dev = this.setDev[name];
      comp.instance.name = name;
      this.anchor.z.push(name);
      this.cdr.markForCheck();
    });
    this.devModeStr.c.map(name => {
      console.log('添加', name);
      const com = this.cfr.resolveComponentFactory(ManualItemComponent);
      const comp = this.domc.createComponent(com);
      // dev
      // name
      comp.instance.dev = this.setDev[name];
      comp.instance.name = name;
      this.anchor.c.push(name);
      this.cdr.markForCheck();
    });
  }
  /**
   * *单机联机
   */
  onConnention() {
    // this.f5();
  }
}
