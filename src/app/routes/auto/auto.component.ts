import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef } from '@angular/core';
import { taskModeStr, tableDev, groupModeStr, JackItem } from 'src/app/models/jack';
import { DB, DbService } from 'src/app/services/db.service';
import { FormBuilder } from '@angular/forms';
import { NzMessageService, NzModalService, NzModalRef } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { Router } from '@angular/router';
import { PLCService } from 'src/app/services/PLC.service';
import { AutoService } from 'src/app/services/auto.service';
import { PLC_D, PLC_S, PLC_M, PLC_Y } from 'src/app/models/IPCChannel';
import { GroupItem, TensionTask, TaskJack } from 'src/app/models/task.models';
import { mpaToPlc, TensionMm, myToFixed, mmToPlc } from 'src/app/Function/device.date.processing';
import { AutoDate } from 'src/app/models/device';
import { Elongation } from 'src/app/models/live';
import { getStageString } from 'src/app/Function/stageString';
import { Subscription } from 'rxjs';
import { SelfInspect } from './class/selfInspect';

@Component({
  selector: 'app-auto',
  templateUrl: './auto.component.html',
  styleUrls: ['./auto.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('tplTitle', null) tplTitle: TemplateRef<{}>;
  @ViewChild('mainContent', null) mainDom: ElementRef;
  @ViewChild('table', null) tableDom: ElementRef;

  svgHeight = 0;
  tableHeight = 0;
  db: DB;
  /** 实时曲线数据 */
  svgData = {
    mpa: [],
    mm: []
  };
  /** 张拉数据 */
  task: GroupItem;
  /** 张拉模式 */
  devNames = ['zA', 'zB', 'zC', 'zD', 'cA', 'cB', 'cC', 'cD'];
  /** 张拉阶段 */
  tensionStageArr = [];
  index = 0;

  holeNames = [];
  theoryIf: any;
  svgt: any;
  modal = {
    state: true,
    cancel: false,
  };
  alarm = {
    state: false,
    name: null,
    datas: []
  };
  auto = {
    runState: false,
    stopState: false,
    superElongation: false,
    pause: false,
    nowPause: false,
    pauseMsg: null,
    twoTension: false,
    goBack: false,
    nowBack: false,
    nowDelay: false,
    nowTwice: false,
    msg: {
      zA: null,
      zB: null,
      zC: null,
      zD: null,
      cA: null,
      cB: null,
      cC: null,
      cD: null,
    },
    zModes: [],
    cModes: [],
  };
  autoData: AutoDate;
  // 张拉完成
  tensionOk = false;
  // 保压延时
  delay = 0;
  nowDelay = 0;
  // 卸荷完成
  unloading = false;
  /** 自检状态 */
  selfInspectData = {
    mm: {
      zA: 0,
      zB: 0,
      zC: 0,
      zD: 0,
      cA: 0,
      cB: 0,
      cC: 0,
      cD: 0,
    },
    state: {
      zA: 0,
      zB: 0,
      zC: 0,
      zD: 0,
      cA: 0,
      cB: 0,
      cC: 0,
      cD: 0,
    },
    device: [],
    zIndex: 0,
    cIndex: 0,
    zt: null,
    ct: null,
    zSuccess: false,
    cSuccess: false,
    error: false,
    success: false,
    run: false,
  };
  selfInspectMsg = [null, '自检中', '自检完成', '自检错误'];
  /** 伸长量/偏差率 */
  elongation: Elongation = {
    zA: {
      mm: 0,
      sumMm: 0,
      percent: 0
    },
    zB: {
      mm: 0,
      sumMm: 0,
      percent: 0
    },
    zC: {
      mm: 0,
      sumMm: 0,
      percent: 0
    },
    zD: {
      mm: 0,
      sumMm: 0,
      percent: 0
    },
    cA: {
      mm: 0,
      sumMm: 0,
      percent: 0
    },
    cB: {
      mm: 0,
      sumMm: 0,
      percent: 0
    },
    cC: {
      mm: 0,
      sumMm: 0,
      percent: 0
    },
    cD: {
      mm: 0,
      sumMm: 0,
      percent: 0
    },
  };
  /** 张拉平衡 */
  balanceState = {
    zA: false,
    zB: false,
    zC: false,
    zD: false,
    cA: false,
    cB: false,
    cC: false,
    cD: false,
  };
  /** 二次张拉位移保存 */
  twoMm = {
    live: {
      zA: 0,
      zB: 0,
      zC: 0,
      zD: 0,
      cA: 0,
      cB: 0,
      cC: 0,
      cD: 0,
    },
    record: {
      zA: 0,
      zB: 0,
      zC: 0,
      zD: 0,
      cA: 0,
      cB: 0,
      cC: 0,
      cD: 0,
    }
  };
  /** 目标压力 */
  target = {
    zA: 0,
    zB: 0,
    zC: 0,
    zD: 0,
    cA: 0,
    cB: 0,
    cC: 0,
    cD: 0,
  };
  stageStr = ['初张拉', '阶段一', '阶段二', '阶段三', '终张拉'];
  handle = true;
  /** 张拉阶段 */
  stepNum = 0;
  stepStageStr = [];
  /** 力筋回缩量 */
  reData = {};
  /** 监听PLC */
  plcsub: Subscription;

  /** 保存状态 */
  saveState = false;
  /** 自动张拉数据 */
  autoTask: any;
  /** stateTension */
  stateTension = false;
  ms = {
    i: 0,
    t: null,
  };

  constructor(
    private fb: FormBuilder,
    private odb: DbService,
    private message: NzMessageService,
    public appS: AppService,
    private router: Router,
    private modalService: NzModalService,
    public PLCS: PLCService,
    public autoS: AutoService,
    private cdr: ChangeDetectorRef
  ) {
    this.autoData = this.PLCS.getAutoDate();
    this.stateTension = localStorage.getItem('stateTension') ? true : false;
    this.autoTask = JSON.parse(localStorage.getItem('autoTask'));
    if (!this.autoTask) {
      this.router.navigate(['/task']);
    } else {
      this.db = this.odb.db;
      this.autoS.task = this.autoTask;
      this.task = this.autoTask.groupData;
      console.log('12312313123123131', this.autoTask);
      // this.PLCS.getMpaRevise();
      this.tensionStageArrF();
    }
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
    this.plcsub = this.PLCS.plcSubject.subscribe((data) => {
      this.alarmMonitoring();
    });
    this.stageStr = getStageString(this.task);
    this.stepStageStr = this.stageStr;
    if (this.task.twice && (!this.task.record || (this.task.record && !this.task.record.twice))) {
      this.stepStageStr = this.stepStageStr.slice(0, 3);
    }
    if (this.task.record) {
      this.stepNum = this.task.record.tensionStage;
      if (this.task.record.state === 4) {
        this.stepNum ++;
      }
    }
    await this.PLCS.selectJack(this.autoS.task.jackId);
    this.inAuto(false);
  }
  ngOnDestroy() {
    console.log('退出');
    clearInterval(this.ms.t);
    this.PLCS.ipcSend('zF05', PLC_S(10), false);
    this.PLCS.ipcSend('cF05', PLC_S(10), false);
    try {
      clearInterval(this.svgt);
      clearInterval(this.selfInspectData.zt);
      clearInterval(this.selfInspectData.ct);
    } catch (error) {
      console.warn('没有');
    }
    localStorage.setItem('autoTask', null);
    localStorage.setItem('stateTension', '');
    if (this.plcsub) {
      this.plcsub.unsubscribe();
    }
  }
  // tslint:disable-next-line:use-life-cycle-interface
  ngAfterViewInit() {
    console.log(this.mainDom.nativeElement.offsetHeight, this.tableDom.nativeElement.offsetHeight);
    this.tableHeight = this.tableDom.nativeElement.offsetHeight;
    this.svgHeight = (this.mainDom.nativeElement.offsetHeight - this.tableDom.nativeElement.offsetHeight) / 2;
    this.initSvg();
    console.log('二次张拉', this.task.record);
  }
  inAuto(self) {
    this.setPLCM(520, false);
    if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
      this.PLCS.ipcSend('zF05', PLC_S(10), true);
      this.PLCS.ipcSend('cF05', PLC_S(10), true);
      if (self) {
        this.selfInspectStart('z');
        this.selfInspectStart('c');
      }
    } else {
      this.PLCS.ipcSend('zF05', PLC_S(10), true);
      if (self) {
        this.selfInspectStart('z');
      }
    }
  }
  /** 初始化曲线 */
  initSvg() {
    if (this.task.record) {
      this.svgData.mpa.push(this.task.record.time);
      this.svgData.mm.push(this.task.record.time);
      taskModeStr[this.task.mode].map((name, index) => {
        this.svgData.mpa.push(this.task.record[name].mapData);
        this.svgData.mm.push(this.task.record[name].mmData);
      });
      if (this.task.record.tensionStage > 1) {
        this.elongation = TensionMm(this.task);
      }
    } else {
      this.svgData.mpa.push(['time']);
      this.svgData.mm.push(['time']);
      taskModeStr[this.task.mode].map((name, index) => {
        this.svgData.mpa.push([name]);
        this.svgData.mm.push([name]);
      });
    }
    if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
      this.PLCS.ipcSend('cF06', PLC_D(409), 1);
      this.PLCS.ipcSend('zF06', PLC_D(409), 1);
    } else {
      this.PLCS.ipcSend('zF06', PLC_D(409), 0);
    }
  }
  // 获取阶段数据
  tensionStageArrF() {
    console.log(this.task);
    const mode = this.task.mode;
    const name = this.task.name;
    const tensionStage = this.task.tensionStage;
    this.theoryIf = tableDev(mode);
    this.devNames = taskModeStr[mode];
    this.tensionStageArr = [...Array( tensionStage + 1)];
    this.holeNames = name.split('/');
    console.log('011445445456456456456', this.devNames, mode);
  }
  /** 设置自动参数 */
  setF16(address: number, value: number) {
    console.log(value);
    this.PLCS.ipcSend('zF016_float', PLC_D(address), [value]);
  }
  setF06(address: number, value: number) {
    if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
      this.PLCS.ipcSend('cF016_float', PLC_D(address), [value]);
    }
    this.PLCS.ipcSend('zF016_float', PLC_D(address), [value]);
    console.log(value);
  }
  /** 报警查看 */
  showAlarm(name) {
    this.alarm.state = true;
    this.alarm.datas = this.PLCS.PD[name].alarm;
    this.alarm.name = `${name}报警状态`;
  }

  startAuto(self = false) {
    // this.setPLCM(520, false);
    // if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
    //   this.PLCS.ipcSend('zF05', PLC_S(10), true);
    //   this.PLCS.ipcSend('cF05', PLC_S(10), true);
    //   if (self) {
    //     this.selfInspectStart('z');
    //     this.selfInspectStart('c');
    //   }
    // } else {
    //   this.PLCS.ipcSend('zF05', PLC_S(10), true);
    //   if (self) {
    //     this.selfInspectStart('z');
    //   }
    // }
    this.inAuto(true);
    this.modal.state = false;
  }
  /**
   * *自检
   */
  selfRead() {
    this.continue();
    this.startAuto(true);
    // if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
    //   this.PLCS.ipcSend('zF05', PLC_S(10), true);
    //   this.PLCS.ipcSend('cF05', PLC_S(10), true);
    //   this.selfInspectStart('z');
    //   this.selfInspectStart('c');
    // } else {
    //   this.PLCS.ipcSend('zF05', PLC_S(10), true);
    //   this.selfInspectStart('z');
    // }
    // this.modal.state = false;
  }
  /**
   * *自检运行设备
   */
  selfInspectRun(device: string, name: string, names: Array<string>, address: number) {
    let is = 0;
    this.selfInspectData[`${device}t`] = setInterval(() => {
      if (this.auto.pause) {
        return;
      }
      console.log(device, '运行中', address, name, is);
      names.map(n => {
        const subMm = Number(this.PLCS.PD[n].showMm) - Number(this.selfInspectData.mm[n]);
        console.log(device, n, subMm, is);
        if (n === name) {
          if (subMm >= 1) {
            this.selfInspectData.state[name] = 2;
            this.auto.msg[name] = '自检完成';
          } else if (subMm < -1.5) {
            this.selfInspectData.state[name] = 3;
            this.auto.msg[name] = `位移自检错误${subMm}`;
          } else if (this.PLCS.PD[n].showMpa > 1.5) {
            this.selfInspectData.state[name] = 3;
            this.auto.msg[name] = `压力自检错误${this.PLCS.PD[n].showMpa}`;
          }
        } else if (subMm > 2 || subMm < -2) {
          this.selfInspectData.state[name] = 3;
          this.auto.msg[name] = `位移自检错误${subMm}`;
        } else if (this.PLCS.PD[n].showMpa > 1.5) {
          this.selfInspectData.state[name] = 3;
          this.auto.msg[name] = `压力自检错误${subMm}`;
        }

        // if (n === name && subMm >= 1) {
        //   this.setData(name, 2, '自检完成');
        // } else if (subMm > 1 || subMm < -1) {
        //   this.setData(name, 3, `位移自检错误${subMm}`);
        // } else if (this.PLCS.PD[n].showMpa > 1.5) {
        //   this.setData(name, 3, `压力自检错误${this.PLCS.PD[n].showMpa}`);
        // }

      });
      const nameSatate = this.selfInspectData.state[name];
      if (nameSatate > 2 || is >= 5) {
        this.auto.msg[name] = `自检超时`;
        console.log(name, device, '失败');
        clearInterval(this.selfInspectData[`${device}t`]);
        console.log(this.selfInspectData.state);
        this.PLCS.ipcSend(`${device}F05`, PLC_Y(address), false);
        this.PLCS.ipcSend(`${device}F05`, PLC_Y(0), false);
        this.PLCS.ipcSend(`${device}F05`, PLC_Y(1), false);
        this.auto.pauseMsg = `${name}自检错误！`;
        this.pause();
        this.selfInspectData.error = true;
      } else if (nameSatate === 2) {
        this.PLCS.ipcSend(`${device}F05`, PLC_Y(address), false);
        console.log(name, device, '成功');
        clearInterval(this.selfInspectData[`${device}t`]);

        let state = true;
        taskModeStr[this.task.mode].map(key => {
          if (key[0] === device && this.selfInspectData.state[key] !== 2) {
            state = false;
          }
        });
        if (state) {
          console.log(device, '全部测试通过', this.selfInspectData.state);
          // this.PLCS.ipcSend(`${device}F05`, PLC_Y(0), false);
          // this.PLCS.ipcSend(`${device}F05`, PLC_Y(1), false);  #1d8fff
          let allState = true;
          taskModeStr[this.task.mode].map(key => {
            if (this.selfInspectData.state[key] !== 2) {
              allState = false;
            }
          });
          if (allState) {

            this.run();
          }
        } else {
          this.selfInspectData[`${device}Index`]++;
          this.selfInspectStart(device);
        }
      }
      is ++;
    }, 1000);
  }
  private setData(name, state, msg) {
    this.selfInspectData.state[name] = state;
    this.auto.msg[name] = msg;
  }
  // 自检前数据处理
  selfInspectStart(device: string) {
    this.selfInspectData.run = true;
    const names = {z: ['zA', 'zB', 'zC', 'zD'], c: ['cA', 'cB', 'cC', 'cD']}[device];
    // const name = names[this.selfInspectData.index];
    const tms = {
      z: {
        A1: ['zA'],
        A2: ['zA'],
        B1: ['zB'],
        B2: ['zB'],
        AB4: ['zA', 'zB'],
        AB8: ['zA', 'zB', 'zC', 'zD']
      },
      c: {
        A1: ['cA'],
        A2: ['cA'],
        B1: ['cB'],
        B2: ['cB'],
        AB4: ['cA', 'cB'],
        AB8: ['cA', 'cB', 'cC', 'cD']
      },
    };
    // this.auto.zModes
    if (this.auto[`${device}Modes`].length === 0) {
      this.auto[`${device}Modes`] = groupModeStr(this.task.mode).map((k) => {
        return `${device}${k}`;
      });
    }
    // const name = taskModeStr[this.task.mode][this.selfInspectData.index];
    const name = tms[device][this.task.mode][this.selfInspectData[`${device}Index`]];
    // const name = this.auto[`${device}Modes`][this.selfInspectData.index];
    names.map(n => {
      this.selfInspectData.mm[n] = this.PLCS.PD[n].showMm || 0;
    });
    this.selfInspectData.state[name] = 1;
    const address = { A: 16, B: 20, C: 24, D: 28}[name[1]];
    this.PLCS.ipcSend(`${device}F05`, PLC_Y(address), true);

    this.selfInspectRun(device, name, names, address);
  }
  /**
   * *启动张拉
   */
  run() {
    if (!this.selfInspectData.success) {
      this.startAuto();
      this.selfInspectData.success = true;
      this.selfInspectData.run = true;
    }
    console.log('开始', this.task.record);
    if (this.task.record && this.task.record.tensionStage > 0 && this.task.record.state !== 4) {
      console.log('二次任务');
      this.twoDownPLCdata();
    } else {
      if (this.task.record && this.task.record.state === 4) {
        console.log('二次张拉22222222');
        this.task.record.tensionStage++;
      }
      this.downPLCData();
    }
    this.ec();
    this.continue();
  }
  /**
   * *任务下载到PLC
   */
  downPLCData() {
    this.auto.runState = true;
    this.auto.twoTension = false;
    let stage = 0;
    if (this.task.record) {
      stage = this.task.record.tensionStage;
    } else {
      this.task.record = {
        tensionStage: 0,
        twice: false,
        time: null,
        state: 0,
        make: [],
      };
      taskModeStr[this.task.mode].map((name, index) => {
        this.task.record[name] = {
          mapData: [],
          mmData: [],
          make: [],
          mpa: [],
          mm: [],
          reData: { mm: NaN, map: NaN}
        };
      });
    }
    this.delay = Number(this.task.time[this.task.record.tensionStage]); // 保压时间
    this.nowDelay = 0;
    const pMpa = {
      zA: 0,
      zB: 0,
      zC: 0,
      zD: 0,
      cA: 0,
      cB: 0,
      cC: 0,
      cD: 0,
    };
    /** 数据转换 */
    taskModeStr[this.task.mode].map(name => {
      pMpa[name] = this.task[name].kn[stage];
      this.target[name] = this.task[name].kn[stage];
    });
    this.setPLCMpa(pMpa);
    console.log('数据下载', this.task.record, pMpa, this.twoMm);
    this.stepNum = this.task.record.tensionStage;
  }
  /**
   * *二次任务下载到PLC
   */
  twoDownPLCdata() {
    this.auto.runState = false;
    this.delay = 15; // 保压时间
    this.nowDelay = 0;
    const pMpa = {
      zA: 0,
      zB: 0,
      zC: 0,
      zD: 0,
      cA: 0,
      cB: 0,
      cC: 0,
      cD: 0,
    };
    const stage = this.task.record.tensionStage;
    /** 数据转换 */
    taskModeStr[this.task.mode].map(name => {
      pMpa[name] = this.task.record[name].mpa[stage];
      this.target[name] = this.task.record[name].mpa[stage]
      this.twoMm.record[name] = this.task.record[name].mm[stage];
    });
    this.setPLCMpa(pMpa);
    this.auto.twoTension = true;
    console.log('二次数据下载', this.task.record, pMpa, this.twoMm);
  }
  /**
   * *手动下一段
   */
  namualNext() {
    console.log(this.task);
    if (this.task.record.tensionStage + 1 === this.task.tensionStage) {
      this.tensionOk = true;
      let un = true;
      let unok = true;
      let tensionOk = true;
      for (const name of taskModeStr[this.task.mode]) {
        if (this.PLCS.PD[name].autoState[0] !== '等待保压') {
          un = false;
        }
        if (this.PLCS.PD[name].autoState[0] !== '卸荷完成') {
          unok = false;
        }
        if (this.PLCS.PD[name].autoState[0] !== '张拉完成') {
          tensionOk = false;
        }
      }
      if (un) {
        const pMpa: any = {
          zA: 0,
          zB: 0,
          zC: 0,
          zD: 0,
          cA: 0,
          cB: 0,
          cC: 0,
          cD: 0,
        };
        for (const name of taskModeStr[this.task.mode]) {
          /** 数据转换 */
          pMpa[name] = taskModeStr[this.task.mode].indexOf(name) > -1 ? this.task[name].kn[0] : 0;
          this.target[name] = this.task[name].kn[0];
        }
        this.setPLCD(458, pMpa); // 设置卸荷压力
        this.setPLCM(523, true); // 启动卸荷阀
      }
      if (unok) {
        this.setPLCM(524, true);
      }
      if (tensionOk) {
        this.go();
      }
    } else {
      let ten = true;
      for (const name of taskModeStr[this.task.mode]) {
        if (this.PLCS.PD[name].autoState[0] !== '等待保压') {
          ten = false;
        }
      }
      if (ten) {
        this.task.record.tensionStage += 1;
        this.downPLCData();
      }
    }
  }
  /**
   * *保压延时
   */
  delayF() {
    let ten = true;
    for (const name of taskModeStr[this.task.mode]) {
      if (this.PLCS.PD[name].autoState[0] !== '等待保压') {
        ten = false;
      }
    }
    if (ten) {
      this.auto.nowDelay = true;
      this.nowDelay++;
      if (this.nowDelay >= this.delay) {
        let msg = `${this.stageStr[this.task.record.tensionStage]}完成`;
        if (this.tensionOk) {
          msg = '卸荷完成';
        }
        this.pushMake(msg);
        if ((this.task.record.tensionStage === this.task.tensionStage)
          || (this.task.twice && !this.task.record.twice && this.task.record.tensionStage === 2)) {
          this.tensionOk = true;
          this.delay = Number(this.autoData.unloadingDelay); // 卸荷延时时间
          this.nowDelay = 0;
          this.stepNum ++;
        } else {
          this.task.record.tensionStage += 1;
          this.auto.nowDelay = false;
          this.downPLCData();
        }
      }
    }
  }
  /**
   * *卸荷/回程
   */
  unre() {
    this.tensionOk = true;
    let un = true;
    let unok = true;
    let tensionOk = true;
    for (const name of taskModeStr[this.task.mode]) {
      if (this.PLCS.PD[name].autoState[0] !== '等待保压') {
        un = false;
      }
      if (this.PLCS.PD[name].autoState[0] !== '卸荷完成') {
        unok = false;
      }
      if (this.PLCS.PD[name].autoState[0] !== '张拉完成') {
        tensionOk = false;
      }
    }
    /** 开始卸荷 */
    if (un) {
      const pMpa: any = {
        zA: 0,
        zB: 0,
        zC: 0,
        zD: 0,
        cA: 0,
        cB: 0,
        cC: 0,
        cD: 0,
      };
      for (const name of taskModeStr[this.task.mode]) {
        this.reData[name] = this.PLCS.PD[name].showMm;
        /** 数据转换 */
        pMpa[name] = taskModeStr[this.task.mode].indexOf(name) > -1 ? this.task[name].kn[0] : 0;
        this.target[name] = this.task[name].kn[0];
      }
      this.setPLCD(458, pMpa); // 设置卸荷压力
      this.setPLCM(523, true); // 启动卸荷阀
    }
    /** 卸荷完成/回程 */
    if (unok || this.unloading) {
      taskModeStr[this.task.mode].map(name => {
        this.task.record[name].reData.mm =
          myToFixed(
            this.task.record[name].mm[this.task.record.tensionStage] - (this.reData[name] - this.PLCS.PD[name].showMm)
          );
        this.task.record[name].reData.map = this.PLCS.PD[name].showMpa;
      });
      if (!this.unloading) {
        this.unloading = true;
      }
      this.nowDelay++;
      if (this.unloading && this.nowDelay >= this.delay) {
        this.stepNum ++;
        this.setPLCM(524, true);
        this.unloading = false;
        this.save();
      }
    }
    if (tensionOk) {
      this.go();
    }
  }
  setPLCM(address: number, state = false) {
    if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
      this.PLCS.ipcSend('zF05', PLC_M(address), state);
      this.PLCS.ipcSend('cF05', PLC_M(address), state);
    } else {
      this.PLCS.ipcSend('zF05', PLC_M(address), state);
    }
  }
  setPLCD(address: number, data) {
    if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
      this.PLCS.ipcSend('cF016_float', PLC_D(address), [data.cA, data.cB, data.cC, data.cD]);
    }
    this.PLCS.ipcSend('zF016_float', PLC_D(address), [data.zA, data.zB, data.zC, data.zD]);
  }
  setPLCMpa(mpa) {
    if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
      this.PLCS.ipcSend(`cF016_float`, PLC_D(450), [mpa.cA, mpa.cB, mpa.cC, mpa.cD]);
    }
    this.PLCS.ipcSend(`zF016_float`, PLC_D(450), [mpa.zA, mpa.zB, mpa.zC, mpa.zD]).then((d) => {
      console.log('PLC下载结果', d);
    });
  }
  /**
   * *张拉平衡
   */
  balance() {
    const names = taskModeStr[this.task.mode];
    const arrMm = [];

    for (const key of names) {
      /** 超伸长量 */
      if (this.elongation[key].percent > this.autoData.superElongation) {
        this.auto.pauseMsg = `${key[1]}·超伸长量${this.elongation[key].percent }`;
        if (!this.auto.pause) {
          const msg = `超伸长量${this.elongation[key].percent }`;
          this.pushMake(msg, key);
          this.pause();
          return;
        }
      } else {
        this.auto.pauseMsg = null;
      }
      arrMm.push(this.elongation[key].mm);
    }
    if (this.auto.pause) {
      return;
    }

    let ten = false;
    for (const name of taskModeStr[this.task.mode]) {
      if (this.PLCS.PD[name].autoState[0] === '等待保压') {
        ten = true;
        break;
      }
    }
    // const max = Math.max.apply(null, arrMm);
    const min = Math.min.apply(null, arrMm);
    let s = false;
    names.map(n => {
      // console.log(n, '平衡控制', this.elongation[n].mm - min, this.autoData.tensionBalance);
      if (this.elongation[n].mm - min > this.autoData.tensionBalance && !this.balanceState[n] && !this.auto.nowDelay && !ten) {
        this.balanceState[n] = true;
        s = true;
      }
      if ((this.elongation[n].mm - min <= 0 || this.auto.nowDelay || ten) && this.balanceState[n]) {
        this.balanceState[n] = false;
        s = true;
      }
    });
    if (s) {
      console.log('平衡控制');
      if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
        this.PLCS.ipcSend(`cF15`, PLC_M(526), [this.balanceState.cA, this.balanceState.cB, this.balanceState.cC, this.balanceState.cD]);
      }
      this.PLCS.ipcSend(`zF15`, PLC_M(526), [this.balanceState.zA, this.balanceState.zB, this.balanceState.zC, this.balanceState.zD]);
    }
  }
  /**
   * *压力差
   */
  cmpMpa() {
    if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
      const names = taskModeStr[this.task.mode];
      for (const key of names) {
        const cmpMpa = myToFixed(Math.abs(this.PLCS.PD[`z${key[1]}`].showMpa - this.PLCS.PD[`c${key[1]}`].showMpa));
        console.log('压力差', cmpMpa);
        if (key[0] === 'z' && cmpMpa > this.autoData.pressureDifference) {
          if (!this.auto.pause) {
            const msg = `压力差${cmpMpa}`;
            this.pushMake(msg, key);
            this.pause();
            return;
          }
        }
      }
    }
  }
  /**
   * *报警监控
   */
  alarmMonitoring() {
    console.log('报警监控');
    this.auto.nowPause = false;
    const names = taskModeStr[this.task.mode];
    let backOk = true;
    for (const key of names) {
      /** 极限报警 || 超伸长量 */

      if (this.PLCS.PD[key].alarm.length > 0 || this.comm()) {
        console.log(key, this.PLCS.PD[key].alarm.length);
        this.auto.nowPause = true;
        if (!this.auto.pause) {
          const msg = this.PLCS.PD[key].alarm.join('|');
          this.pushMake(msg, key);
          this.pause();
          return;
        }
      }

      if (this.PLCS.PD[key].autoState.indexOf('超工作位移上限') > -1) {
        this.auto.nowPause = true;
        if (!this.auto.pause && !this.auto.nowBack) {
          console.log(key, '超工作位移上限');
          this.pushMake('超工作位移上限', key);
          this.pause();
          return;
        }
      }
      if (this.PLCS.PD[key].autoState.indexOf('回顶完成') === -1) {
        backOk = false;
      }
    }
    if (backOk) {
      if (!this.auto.pause) {
        console.log('回顶完成');
        this.pause();
        this.auto.goBack = true;
      }
    }
  }
  /**
   * *通信状态
   */
  comm() {
    if (!this.PLCS.plcState.z) {
      return true;
    }
    if (this.task.mode !== 'A1' && this.task.mode !== 'B1' && !this.PLCS.plcState.c) {
      return true;
    }
  }
  /**
   * *曲线采集与监控
   */
  ec() {
    this.svgt = setInterval(() => {
      // this.alarmMonitoring();
      if (this.tensionOk) {
        this.unre();
      } else if (!this.auto.pause) {
        this.delayF();
      }

      this.index = this.index + 1;
      // const value = Math.random() * 10 + 10 + this.index % 100;
      if (!this.auto.goBack) {
        this.svgData.mpa.map((item, i) => {
          if (i === 0) {
            /** 添加时间轴 */
            item.push(new Date().getTime());
            this.svgData.mm[i] = item;
            this.task.record.time = item;
          } else {
            /** 添加曲线数据 */
            item.push(this.PLCS.PD[item[0]].showMpa);
            this.svgData.mm[i].push(this.PLCS.PD[item[0]].showMm);
            this.task.record[item[0]].mapData = item;
            this.task.record[item[0]].mmData = this.svgData.mm[i];
            /** 压力位移记录保存 */
            if (this.auto.runState && !this.tensionOk && !this.auto.pause && !this.auto.nowBack) {
              this.task.record[item[0]].mpa[this.task.record.tensionStage] = this.PLCS.PD[item[0]].showMpa;
              const livemm = (this.PLCS.PD[item[0]].showMm - this.twoMm.live[item[0]]);
              this.task.record[item[0]].mm[this.task.record.tensionStage] = myToFixed(this.twoMm.record[item[0]] + livemm);
              // console.log('位移', this.PLCS.PD[item[0]].showMm, this.twoMm.live[item[0]], livemm);
            }
            /** 二次张拉位移记录 */
            if (this.auto.twoTension) {
              this.twoMm.live[item[0]] = this.PLCS.PD[item[0]].showMm;
            }
            /** 模拟数据 */
            // item.push(value - Math.random() * 10);
            // this.svgData.mm[i].push(value - Math.random() * 10);
            // 实时保存张拉记录
            localStorage.setItem('autoTask', JSON.stringify(this.autoTask));

            localStorage.setItem('stateTension', 'true');
          }
        });
      }
      /** 压力差与张拉平衡 */
      if (
        this.auto.runState && !this.tensionOk  && !this.auto.nowBack
        && ( !this.task.record.twice || this.task.record.tensionStage > 3)
      ) {
        this.cmpMpa();
        if (this.task.record.tensionStage >= 1 && (!this.task.record.twice || this.task.record.tensionStage > 3)) {
          this.elongation = TensionMm(this.task);
          this.balance();
        }
      }
      this.cdr.checkNoChanges();
      // console.log('曲线数据', this.svgData);
    }, 1000);
  }
  /**
   * *make记录
   */
  pushMake(msg, name: string = null) {
    if (this.auto.runState) {
      if (name) {
        this.task.record[name].make.push({
          msg,
          index: this.task.record.time.length
        });
        msg = `${name}-${msg}`;
      }
      this.task.record.make.push({
        msg,
        index: this.task.record.time.length
      });
    }
  }
  /**
   * *手动回顶
   */
  goBackMm() {
    const modal: NzModalRef = this.modalService.create({
      nzTitle: '回顶数据调整',
      // nzContent: '千斤顶名称模式不一致不能导入',
      nzContent: this.tplTitle,
      nzClosable: false,
      nzMaskClosable: false,
      nzFooter: [
        {
          label: '取消',
          shape: 'default',
          type: 'danger',
          onClick: () => {
            modal.destroy();
            return;
          }
        },
        {
          label: '确定回顶',
          shape: 'default',
          type: 'primary',
          onClick: () => {
            modal.destroy();
            this.setF06(466, this.autoData.backMm);
            this.setPLCM(522, true);
            this.auto.nowBack = true;
            this.continue();
            return;
          }
        },
      ]
    });
    // this.setPLCM(520, false);
  }
  /** 张拉暂停 */
  pause() {
    this.auto.pause = true;
    this.modal.state = true;
    this.auto.nowBack = false;
    clearInterval(this.selfInspectData.zt);
    clearInterval(this.selfInspectData.ct);
    this.setPLCM(520, true);
  }
  /**
   * *继续张拉
   */
  continue() {
    if (this.auto.goBack) {
      this.twoDownPLCdata();
    }
    this.auto.pause = false;
    this.modal.state = false;
    this.auto.goBack = false;
    this.setPLCM(520, false);
  }
  /** 取消张拉 */
  cancel() {
    this.go();
    localStorage.setItem('autoTask', null);
    localStorage.setItem('stateTension', '');
    this.odb.db.task.filter(f => f.id === this.autoS.task.id).first((d) => {
      console.log('查询结果', this.autoS.task.id, d);
    });
  }
  /** 保存数据退出 */
  saveOut() {
    this.save(true);
  }
  /** 取消保存退出 */
  cancelOut() {
    this.modal.cancel = true;
  }
  /** 张拉完成 */
  outOk() {
    this.go();
    localStorage.setItem('autoTask', null);
    localStorage.setItem('stateTension', '');
  }
  /** 暂定 */
  sotp() {
    // clearInterval(this.svgt);
    this.auto.stopState = true;
    this.modal.state = true;
  }
  /** 保存数据 */
  save(out = false) {
    this.saveState = true;
    if (this.tensionOk) {
      if (this.task.twice && this.task.record.tensionStage === 2) {
        this.task.record.state = 4;
        this.task.record.twice = true;
      } else {
        this.task.record.state = 2;
        const names = taskModeStr[this.task.mode];
        names.map(n => {
          if (n[0] === 'z' && Math.abs(this.elongation[n].percent) > 6) {
            this.task.record.state = 3;
          }
        });
      }
    } else {
      this.task.record.state = 1;
    }
    this.db.task.filter(f => f.id === this.autoS.task.id).first((taskDbData: TensionTask) => {
      console.log('查询结果', this.autoS.task.id, taskDbData);
      let index = null;
      taskDbData.groups.filter((f, i) => {
        if (f.name === this.task.name) {
          index = i;
        }
      });
      taskDbData.groups[index] = this.task;
      // const ds = [];
      // d.groups.map((g, i) => {
      //   if ('record' in g) {
      //     ds.push(g.record.time[1]);
      //   }
      // });
      // if (ds.length > 0) {
      //   const min = Math.min.apply(null, ds);
      //   const max = Math.max.apply(null, ds);
      //   d.entDate = max;
      //   d.startDate = min;
      // }
      /** 设置张拉时间 */
      if (!taskDbData.startDate) {
        taskDbData.startDate = this.task.record.time[1];
      }
      taskDbData.entDate = this.task.record.time[1];
      const jackItems = {};
      // 设置张拉顶
      taskModeStr[this.task.mode].map(name => {
        jackItems[name] = this.PLCS.jack[name];
      });
      taskDbData.jack = this.PLCS.jack;
      console.log('更新数据', taskDbData);
      this.db.task.update(this.autoS.task.id, taskDbData).then((updata) => {
        this.message.success('保存成功🙂');
        if (out) {
          localStorage.setItem('autoTask', null);
          localStorage.setItem('stateTension', '');
          this.go();
        }
      }).catch((err) => {
        console.log(`保存失败😔`, err);
        this.message.error(`保存失败😔`);
      });
    });
  }
  /** 跳转到任务 */
  go() {
    this.router.navigate(['/task'], {
      queryParams: {
        project: this.autoS.task.project,
        component: this.autoS.task.component,
        selectBridge: this.autoS.task.id,
        editGroupName: this.task.name,
      }
    });
  }

  handleCancel() {
    console.log('关闭');
  }
}
