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
import { Subscription } from 'rxjs';
import { log } from 'util';

@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('domz', { read: ViewContainerRef, static: false }) domz: ViewContainerRef;
  @ViewChild('domc', { read: ViewContainerRef, static: false }) domc: ViewContainerRef;
  db: DB;
  selectedJack: any;
  selectedI: any = null;
  jacks = [];
  selectJackId = null;
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

  zmsg = null;
  cmsg = null;

  connection = true;

  anchor = {
    z: [],
    c: []
  };
  /** 刷新率 */
  ms = {
    i: 0,
    t: null,
  };
  /** 监听PLC */
  plcsub: Subscription;

  constructor(
    private e: ElectronService,
    private odb: DbService,
    public appS: AppService,
    public PLCS: PLCService,
    private message: NzMessageService,
    private cfr: ComponentFactoryResolver,
    private cdr: ChangeDetectorRef
  ) {
    this.db = this.odb.db;
  }

  async ngOnInit() {
    /** 刷新率 */
    this.ms.t = setInterval(() => {
      this.ms.i ++;
      // console.log(this.ms);
      if (this.ms.i > 10000) {
        this.ms.i = 0;
      }
      this.cdr.markForCheck();
    }, this.appS.refresh);
    // 获取顶
    await this.db.jack.filter(j => j.state).toArray().then((d) => {
      this.jacks = d.map(item => {
        return { name: item.name, id: item.id };
      });
    });
    /** 获取当前顶 */
    await this.onSelectedDevice();

    this.PLCS.ipcSend('zF05', PLC_S(0), true);
    this.PLCS.ipcSend('cF05', PLC_S(0), true);
    // this.plcsub = this.PLCS.plcSubject.subscribe((data: any) => {
    //   const dev = data.dev;
    //   let msg = null;
    //   if (this.PLCS.PD[`${dev}`].alarm.indexOf('急停') > -1) {
    //     msg = '急停！！';
    //   } else if (this.PLCS.PD[`${dev}`].alarm.indexOf('相序错误') > -1) {
    //     msg = '相序错误！！';
    //   }
    //   this[`${dev[0]}msg`] = msg;
    //   // if (this.PLCS.PD.zA.alarm.indexOf('急停') > -1) {
    //   //   this.zmsg = '急停！！';
    //   // } else if (this.PLCS.PD.zA.alarm.indexOf('相序错误') > -1) {
    //   //   this.zmsg = '相序错误！！';
    //   // } else {
    //   //   this.zmsg = null;
    //   // }
    //   // if (this.PLCS.PD.cA.alarm.indexOf('急停') > -1) {
    //   //   this.cmsg = '急停！！';
    //   // } else if (this.PLCS.PD.cA.alarm.indexOf('相序错误') > -1) {
    //   //   this.cmsg = '相序错误！！';
    //   // } else {
    //   //   this.cmsg = null;
    //   // }
    // });


    /** 获取设备压力校正 */
    // await this.PLCS.getMpaRevise();
    // this.selectManual('z');
    // this.selectManual('c');
    // this.getManualData('z');
    // this.getManualData('c');
    console.log('init');
    // this.f5();

  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    console.log('退出');
    clearInterval(this.ms.t);
    if (this.plcsub) {
      this.plcsub.unsubscribe();
    }
    this.selectManual('z', [false, false, false, false]);
    this.selectManual('c', [false, false, false, false]);
    this.PLCS.ipcSend('zF05', PLC_S(0), false);
    this.PLCS.ipcSend('cF05', PLC_S(0), false);
  }
  /** 数据监听|处理 */

  /** 切换设备 */
  async onSelectedDevice(id: number = null) {
    id = id ||  Number(localStorage.getItem('jackId'));
    if (!id) {
      this.message.warning('没有设备');
      this.PLCS.jack = null;
      return;
    }

    this.PLCS.ipcSend('zF05', PLC_S(0), true);
    this.PLCS.ipcSend('cF05', PLC_S(0), true);
    if (!this.plcsub) {
      this.plcsub = this.PLCS.plcSubject.subscribe((data: any) => {
        const dev = data.dev;
        // console.log(dev);
        let msg = null;
        try {
          if (!this.PLCS.jack) {
            msg = '没有选择顶！！';
          } else if (this.PLCS.PD[`${dev}`].alarm.indexOf('急停') > -1) {
            msg = '急停！！';
          } else if (this.PLCS.PD[`${dev}`].alarm.indexOf('相序错误') > -1) {
            msg = '相序错误！！';
          }
          this[`${dev[0]}msg`] = msg;
        } catch (error) {
          console.warn(error);
        }
      });
    }

    /** 切换手动 */
    // this.selectManual('z');
    // this.selectManual('c');
    // this.getManualData('z');
    // this.getManualData('c');

    // this.PLCS.ipcSend('zF06', PLC_S(0), id);
    this.selectJackId = id;
    const jack = await this.PLCS.selectJack(id);
    if (!jack) {
      this.message.warning('没有选择顶！！');
      return;
    }
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
    this.PLCS.ipcSend(`${dev}F03`, PLC_D(100), 24).then((data: any) => {
      console.log('手动数据', data);
      let i = 0;
      this.devModeStr[dev].map(name => {
        this.setDev[name].setMpa = data.float[i];
        this.setDev[name].setMm = data.float[i + 1];
        this.setDev[name].setUn = data.float[i + 2];
        i += 3;
      });
    });
  }

  setF15(dev: string, address: number, state) {
    state = !(state === '1');
    this.PLCS.ipcSend(`${dev}F05`, PLC_M(address), state).then(() => {
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
