import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { taskModeStr, tableDev, groupModeStr } from 'src/app/models/jack';
import { DB, DbService } from 'src/app/services/db.service';
import { FormBuilder } from '@angular/forms';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { Router } from '@angular/router';
import { PLCService } from 'src/app/services/PLC.service';
import { AutoService } from 'src/app/services/auto.service';
import { PLC_D, PLC_S, PLC_M, PLC_Y } from 'src/app/models/IPCChannel';
import { GroupItem } from 'src/app/models/task.models';
import { mpaToPlc, TensionMm, myToFixed, mmToPlc } from 'src/app/Function/device.date.processing';
import { AutoDate } from 'src/app/models/device';
import { Elongation } from 'src/app/models/live';

@Component({
  selector: 'app-auto',
  templateUrl: './auto.component.html',
  styleUrls: ['./auto.component.less']
})
export class AutoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mainContent')
  mainDom: ElementRef;
  @ViewChild('table')
  tableDom: ElementRef;

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
    index: 0,
    zt: null,
    ct: null,
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

  constructor(
    private fb: FormBuilder,
    private odb: DbService,
    private message: NzMessageService,
    public appS: AppService,
    private router: Router,
    private modalService: NzModalService,
    public PLCS: PLCService,
    public autoS: AutoService
  ) {
    this.autoData = this.PLCS.getAutoDate();
    const autoTask = JSON.parse(localStorage.getItem('autoTask'));
    if (!autoTask) {
      this.router.navigate(['/task']);
    } else {
      this.db = this.odb.db;
      this.autoS.task = autoTask;
      this.task = autoTask.groupData;
      console.log('12312313123123131', autoTask);
      // this.odb.db.task.filter(f => f.id = this.autoS.task.id).first((d) => {
      //   console.log(d);
      //   d.groups.filter((f, i) => {
      //     if (f.name === this.task.name) {
      //       console.log('下标', i);
      //     }
      //     return f.name === this.task.name;
      //   });
      // });
      this.PLCS.getMpaRevise();
      this.tensionStageArrF();
    }
  }

  async ngOnInit() {
    await this.PLCS.selectJack(this.autoS.task.jackId);

  }
  ngOnDestroy() {
    console.log('退出');
    this.PLCS.ipcSend('zF05', PLC_S(10), false);
    this.PLCS.ipcSend('cF05', PLC_S(10), false);
    clearInterval(this.svgt);
    clearInterval(this.selfInspectData.zt);
    clearInterval(this.selfInspectData.ct);
  }
  // tslint:disable-next-line:use-life-cycle-interface
  ngAfterViewInit() {
    console.log(this.mainDom.nativeElement.offsetHeight, this.tableDom.nativeElement.offsetHeight);
    this.tableHeight = this.tableDom.nativeElement.offsetHeight;
    this.svgHeight = (this.mainDom.nativeElement.offsetHeight - this.tableDom.nativeElement.offsetHeight) / 2;
    this.initSvg();
    console.log('二次张拉', this.task.record && this.task.record.tensionStage > 0)
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
    } else {
      this.svgData.mpa.push(['time']);
      this.svgData.mm.push(['time']);
      taskModeStr[this.task.mode].map((name, index) => {
        this.svgData.mpa.push([name]);
        this.svgData.mm.push([name]);
      });
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
    this.tensionStageArr = [...Array(tensionStage)];
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
      this.PLCS.ipcSend('cF06', PLC_D(address), value);
    }
    this.PLCS.ipcSend('zF06', PLC_D(address), value);
    console.log(value);
  }
  /** 报警查看 */
  showAlarm(name) {
    this.alarm.state = true;
    this.alarm.datas = this.PLCS.PD[name].alarm;
    this.alarm.name = `${name}报警状态`;
  }

  /**
   * *自检
   */
  selfRead() {
    if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
      this.PLCS.ipcSend('zF05', PLC_S(10), true);
      this.PLCS.ipcSend('cF05', PLC_S(10), true);
      this.selfInspectStart('z');
      this.selfInspectStart('c');
    } else {
      this.PLCS.ipcSend('zF05', PLC_S(10), true);
      this.selfInspectStart('z');
    }
    this.modal.state = false;
  }
  /**
   * *自检
   */
  selfInspectRun(device: string, name: string, names: Array<string>, address: number) {
    this.selfInspectData[`${device}t`] = setInterval(() => {
      // console.log('运行中');
      const nameSatate = this.selfInspectData.state[name];
      names.map(n => {
        const subMm = Number(this.PLCS.PD[n].showMm) - Number(this.selfInspectData.mm[n]);
        console.log(n, this.PLCS.PD[n].showMm, '-', this.selfInspectData.mm[n], '=', subMm);
        if (n === name) {
          if (subMm > 2) {
            this.selfInspectData.state[name] = 2;
          } else if (subMm < -2) {
            this.selfInspectData.state[name] = 3;
          }
        } else if (subMm > 2 || subMm < -2) {
          this.selfInspectData.state[name] = 3;
        }
      });
      if (nameSatate > 2) {
        console.log(name, device, '失败');
        clearInterval(this.selfInspectData[`${device}t`]);
        console.log(this.selfInspectData.state);
        this.PLCS.ipcSend(`${device}F05`, PLC_Y(address), false);
      } else if (nameSatate === 2) {
        this.PLCS.ipcSend(`${device}F05`, PLC_Y(address), false);
        console.log(name, device, '成功');
        clearInterval(this.selfInspectData[`${device}t`]);

        let state = true;
        taskModeStr[this.task.mode].map(key => {
          if (key.indexOf(device) > -1 && this.selfInspectData.state[key] !== 2) {
            state = false;
          }
        });
        if (state) {
          console.log(device, '全部测试通过', this.selfInspectData.state);
          this.PLCS.ipcSend(`${device}F05`, PLC_Y(0), false);
          this.PLCS.ipcSend(`${device}F05`, PLC_Y(1), false);
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
          this.selfInspectData.index++;
          this.selfInspectStart(device);
        }
      }
    }, 1000);
  }
  selfInspectStart(device: string) {
    const names = {z: ['zA', 'zB', 'zC', 'zD'], c: ['cA', 'cB', 'cC', 'cD']}[device];
    const name = names[this.selfInspectData.index];
    console.log(name, device, '开始自检');
    names.map(n => {
      this.selfInspectData.mm[n] = this.PLCS.PD[n].showMm;
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
    if (this.task.record && this.task.record.tensionStage > 0) {
      this.twoDownPLCdata();
    } else {
      this.downPLCData();
    }
    this.ec();
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
      };
      taskModeStr[this.task.mode].map((name, index) => {
        this.task.record[name] = {
          mapData: [],
          mmData: [],
          make: [],
          mpa: [],
          mm: []
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
      pMpa[name] = mpaToPlc(this.task[name].kn[stage], this.PLCS.mpaRevise[name]);
      this.target[name] = this.task[name].kn[stage];
    });
    this.setPLCMpa(pMpa);
    console.log('二次数据下载', this.task.record, pMpa, this.twoMm);
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
      pMpa[name] = mpaToPlc(this.task.record[name].mpa[stage], this.PLCS.mpaRevise[name]);
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
        if (this.PLCS.PD.cA.autoState[0] !== '等待保压') {
          un = false;
        }
        if (this.PLCS.PD.cA.autoState[0] !== '卸荷完成') {
          unok = false;
        }
        if (this.PLCS.PD.cA.autoState[0] !== '张拉完成') {
          tensionOk = false;
        }
      }
      if (un) {
        const pMpa: any = {};
        for (const name of taskModeStr.AB8) {
          /** 数据转换 */
          pMpa[name] = taskModeStr[this.task.mode].indexOf(name) > -1 ? mpaToPlc(this.task.zA.kn[0], this.PLCS.mpaRevise[name]) : 0;
          this.target[name] = this.task.zA.kn[0];
        }
        this.setPLCD(454, pMpa); // 设置卸荷压力
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
        if (this.PLCS.PD.cA.autoState[0] !== '等待保压') {
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
      if (this.PLCS.PD.cA.autoState[0] !== '等待保压') {
        ten = false;
      }
    }
    if (ten) {
      this.auto.nowDelay = true;
      this.nowDelay++;
      if (this.nowDelay >= this.delay) {
        if (this.task.record.tensionStage + 1 === this.task.tensionStage) {
          this.tensionOk = true;
          this.delay = Number(this.autoData.unloadingDelay); // 卸荷延时时间
          this.nowDelay = 0;
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
      if (this.PLCS.PD.cA.autoState[0] !== '等待保压') {
        un = false;
      }
      if (this.PLCS.PD.cA.autoState[0] !== '卸荷完成') {
        unok = false;
      }
      if (this.PLCS.PD.cA.autoState[0] !== '张拉完成') {
        tensionOk = false;
      }
    }
    if (un) {
      const pMpa: any = {};
      for (const name of taskModeStr.AB8) {
        /** 数据转换 */
        pMpa[name] = taskModeStr[this.task.mode].indexOf(name) > -1 ? mpaToPlc(this.task.zA.kn[0], this.PLCS.mpaRevise[name]) : 0;
        this.target[name] = this.task.zA.kn[0];
      }
      this.setPLCD(454, pMpa); // 设置卸荷压力
      this.setPLCM(523, true); // 启动卸荷阀
    }
    if (unok || this.unloading) {
      if (!this.unloading) {
        this.unloading = true;
      }
      this.nowDelay++;
      if (this.unloading && this.nowDelay >= this.delay) {
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
      this.PLCS.ipcSend('cF016', PLC_D(address), [data.cA, data.cB, data.cC, data.cD]);
    }
    this.PLCS.ipcSend('zF016', PLC_D(address), [data.zA, data.zB, data.zC, data.zD]);
  }
  setPLCMpa(mpa) {
    this.PLCS.ipcSend(`zF016`, PLC_D(450), [mpa.zA, mpa.zB, mpa.zC, mpa.zD]);
    if (this.task.mode !== 'A1' && this.task.mode !== 'B1') {
      this.PLCS.ipcSend(`cF016`, PLC_D(450), [mpa.cA, mpa.cB, mpa.cC, mpa.cD]);
    }
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
    // const max = Math.max.apply(null, arrMm);
    const min = Math.min.apply(null, arrMm);
    let s = false;
    names.map(n => {
      // console.log(n, '平衡控制', this.elongation[n].mm - min, this.autoData.tensionBalance);
      if (this.elongation[n].mm - min > this.autoData.tensionBalance && !this.balanceState[n]) {
        this.balanceState[n] = true;
        s = true;
      }
      if ((this.elongation[n].mm - min <= 0 || this.auto.nowDelay) && this.balanceState[n]) {
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
        console.log(cmpMpa);
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
    this.auto.nowPause = false;
    const names = taskModeStr[this.task.mode];
    let backOk = true;
    for (const key of names) {
      /** 极限报警 || 超伸长量 */
      if (this.PLCS.PD[key].alarm.length > 0) {
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
   * *曲线采集与监控
   */
  ec() {
    this.svgt = setInterval(() => {
      this.alarmMonitoring();
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
          }
        });
      }

      if (this.auto.runState && !this.tensionOk && !this.auto.pause && !this.auto.nowBack) {
        this.cmpMpa();
        if (this.task.record.tensionStage >= 1) {
          this.elongation = TensionMm(this.task);
          this.balance();
        }
      }
      // console.log('曲线数据', this.svgData);
    }, 1000);
  }
  /**
   * *make记录
   */
  pushMake(msg, name: string) {
    if (this.auto.runState) {
      this.task.record[name].make.push({
        msg,
        index: this.task.record.time.length
      });
    }
  }
  /**
   * *手动回顶
   */
  goBackMm() {
    this.setF06(460, mmToPlc(this.autoData.backMm, null));
    this.setPLCM(522, true);
    this.auto.nowBack = true;
    this.continue();
    // this.setPLCM(520, false);
  }
  /** 张拉暂停 */
  pause() {
    this.auto.pause = true;
    this.modal.state = true;
    this.auto.nowBack = false;
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
  }
  /** 暂定 */
  sotp() {
    // clearInterval(this.svgt);
    this.auto.stopState = true;
    this.modal.state = true;
  }
  /** 保存数据 */
  save(out = false) {
    if (this.tensionOk) {
      this.task.record.state = 2;
      const names = taskModeStr[this.task.mode];
      names.map(n => {
        if (n[0] === 'z' && Math.abs(this.elongation[n].percent) > 6) {
          this.task.record.state = 3;
        }
      });
    } else {
      this.task.record.state = 1;
    }
    this.odb.db.task.filter(f => f.id === this.autoS.task.id).first((d) => {
      console.log('查询结果', this.autoS.task.id, d);
      let index = null;
      d.groups.filter((f, i) => {
        if (f.name === this.task.name) {
          index = i;
        }
      });
      d.groups[index] = this.task;
      console.log('更新数据', d);
      this.db.task.update(this.autoS.task.id, d).then((updata) => {
        this.message.success('保存成功🙂');
        if (out) {
          localStorage.setItem('autoTask', null);
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
}
