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
import { mpaToPlc } from 'src/app/Function/device.date.processing';
import { AutoDate } from 'src/app/models/device';

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
  db: DB;
  /** 实时曲线数据 */
  svgData = {
    map: [],
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
  selfInspectState = {
    zA: 0,
    zB: 0,
    zC: 0,
    zD: 0,
    cA: 0,
    cB: 0,
    cC: 0,
    cD: 0,
    state: false,
    devIndex: 0,
    name: null,
    mm: {zA: 0,
      zB: 0,
      zC: 0,
      zD: 0,
      cA: 0,
      cB: 0,
      cC: 0,
      cD: 0,},
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
      this.initSvg();
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
  }
  // tslint:disable-next-line:use-life-cycle-interface
  ngAfterViewInit() {
    console.log(this.mainDom.nativeElement.offsetHeight, this.tableDom.nativeElement.offsetHeight);
    this.svgHeight = (this.mainDom.nativeElement.offsetHeight - this.tableDom.nativeElement.offsetHeight) / 2;
  }
  /** 初始化曲线 */
  initSvg() {
    this.svgData.map.push(['time']);
    this.svgData.mm.push(['time']);
    taskModeStr[this.task.mode].map((name, index) => {
      this.svgData.map.push([name]);
      this.svgData.mm.push([name]);
    });
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
    console.log(value);
    this.PLCS.ipcSend('zF06', PLC_D(address), value);
  }
  /** 报警查看 */
  showAlarm(name) {
    this.alarm.state = true;
    this.alarm.datas = this.PLCS.PD[name].alarm;
    this.alarm.name = `${name}报警状态`;
  }

  /** 自检 */
  selfInspectRun() {
    this.selfInspect();
    const t = setInterval(() => {
      let s = true;
      taskModeStr[this.task.mode].map((name, index) => {
        if (this.selfInspectState[name] !== 3) {
          s = false;
        }
      });
      if (s) {
        this.message.success('自检完成！！');
        clearInterval(t);
      } else {
        this.selfInspectMonitoring();
      }
    }, 1000);
  }
  /** 设备自检 */
  selfInspect() {
    taskModeStr[this.task.mode].map((key) => {
      this.selfInspectState.mm[key] = this.PLCS.PD[key].showMm;
    });
    this.selfInspectState.name = groupModeStr(this.task.mode)[this.selfInspectState.devIndex];
    console.log('自检', this.selfInspectState);
    // this.selfInspectMonitoring(groupModeStr(this.task.mode)[this.selfInspectState.devIndex], mm);
  }
  selfInspectMonitoring() {
    const name = this.selfInspectState.name;
    const mm = this.selfInspectState.mm;
    const zName = `z${name}`;
    const z = this.selfInspectState[`z${name}`];
    const address = { A: 16, B: 20, C: 24, D: 28}[name];
    if (z === 0) {
      this.PLCS.ipcSend('zF05', PLC_Y(address), true);
      this.selfInspectState[`z${name}`] = 1;
    }
    if (z === 1) {
      const plc = this.PLCS.PD;
      for (const key of taskModeStr[this.task.mode]) {
        console.log(key, plc[key].showMm, mm[key]);
        if (zName === key) {
          if (plc[key].showMm > mm[key] + 10) {
            console.log(key, '自检成功', this.selfInspectState);
            this.selfInspectState[`z${name}`] = 2;
            // this.PLCS.ipcSend('zF05', PLC_Y(address), false);
            // if (groupModeStr(this.task.mode).length > this.selfInspectState.devIndex) {
            //   this.selfInspectState.devIndex++;
            //   return;
            // }
          }
          if (plc[key].showMm < mm[key] - 1 || plc[zName].showMpa > 1.5) {
            this.selfInspectState[`z${name}`] = 3;
            break;
          }
        } else {
          if (plc[key].showMm < mm[key] - 1 || plc[key].showMm > mm[key] + 1) {
            this.selfInspectState[`z${name}`] = 5;
            break;
          }
        }
      }
      if (this.selfInspectState[`z${name}`] >= 3) {
        this.message.error(`${zName}自检错误！！！！`);
        console.log('自检错误111', this.selfInspectState[`z${name}`], this.selfInspectState, this.PLCS.PD);
        // this.PLCS.ipcSend('zF05', PLC_Y(address), false);
      }
    }
  }
  /** 启动张拉 */
  run() {
    this.auto.runState = true;
    this.modal.state = false;
    this.downPLCData();
    this.ec();
  }
  /** 任务下载到PLC */
  downPLCData() {
    let stage = 0;
    console.log(this.task);
    if (this.task.record) {
      stage = this.task.record.tensionStage;
    } else {
      this.task.record = {
        tensionStage: 0,
        twice: false,
        time: null,
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
    const pMpa: any = {};
    for (const name of taskModeStr.AB8) {
      /** 数据转换 */
      pMpa[name] = taskModeStr[this.task.mode].indexOf(name) > -1 ? mpaToPlc(this.task.zA.kn[stage], this.PLCS.mpaRevise[name]) : 0;
    }
    if (this.task.mode !== 'zA' && this.task.mode !== 'zB') {
      this.PLCS.ipcSend(`zF016`, PLC_D(450), [pMpa.zA, pMpa.zB, pMpa.zC, pMpa.zD]);
      this.PLCS.ipcSend(`cF016`, PLC_D(450), [pMpa.cA, pMpa.cB, pMpa.cC, pMpa.cD]);
      this.PLCS.ipcSend('zF05', PLC_S(10), true);
      this.PLCS.ipcSend('cF05', PLC_S(10), true);
    } else {
      this.PLCS.ipcSend('zF05', PLC_S(10), true);
      this.PLCS.ipcSend(`zF016`, PLC_D(450), [pMpa.zA, pMpa.zB, pMpa.zC, pMpa.zD]);
    }
  }
  /** 手动下一段 */
  namualNext() {
    console.log(this.task);
    if (this.task.record.tensionStage + 1 === this.task.tensionStage ) {
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
  /** 保压延时 */
  delayF() {
    let ten = true;
    for (const name of taskModeStr[this.task.mode]) {
      if (this.PLCS.PD.cA.autoState[0] !== '等待保压') {
        ten = false;
      }
    }
    if (ten) {
      this.nowDelay++;
      if (this.nowDelay >= this.delay) {
        if (this.task.record.tensionStage + 1 === this.task.tensionStage) {
          this.tensionOk = true;
          this.delay = Number(this.autoData.unloadingDelay); // 卸荷延时时间
          this.nowDelay = 0;
        } else {
          this.task.record.tensionStage += 1;
          this.downPLCData();
        }
      }
    }
  }
  /** 卸荷/回程 */
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
    if (this.task.mode !== 'zA' && this.task.mode !== 'zB') {
      this.PLCS.ipcSend('zF05', PLC_M(address), state);
      this.PLCS.ipcSend('cF05', PLC_M(address), state);
    } else {
      this.PLCS.ipcSend('zF05', PLC_M(address), state);
    }
  }
  setPLCD(address: number, data) {
    if (this.task.mode !== 'zA' && this.task.mode !== 'zB') {
      this.PLCS.ipcSend('zF016', PLC_D(address), [data.zA, data.zB, data.zC, data.zD]);
      this.PLCS.ipcSend('cF016', PLC_D(address), [data.cA, data.cB, data.cC, data.cD]);
    } else {
      this.PLCS.ipcSend('zF016', PLC_D(address), [data.zA, data.zB, data.zC, data.zD]);
    }
  }
  /** 曲线采集 */
  ec() {
    this.svgt = setInterval(() => {
      if (this.tensionOk) {
        this.unre();
      } else {
        this.delayF();
      }

      this.index = this.index + 1;
      const value = Math.random() * 10 + 10 + this.index % 100;
      this.svgData.map.map((item, i) => {
        if (i === 0) {
          /** 添加时间轴 */
          item.push(new Date().getTime());
          this.svgData.mm[i] = item;
          this.task.record.time = item;
        } else {
          /** 添加数据 */
          item.push(this.PLCS.PD[item[0]].showMpa);
          this.svgData.mm[i].push(this.PLCS.PD[item[0]].showMm);
          this.task.record[item[0]].mapData = item;
          this.task.record[item[0]].mmData = this.svgData.mm[i];
          if (!this.tensionOk) {
            this.task.record[item[0]].mpa[this.task.record.tensionStage] = this.PLCS.PD[item[0]].showMpa;
            this.task.record[item[0]].mm[this.task.record.tensionStage] = this.PLCS.PD[item[0]].showMm;
          }
          /** 模拟数据 */
          // item.push(value - Math.random() * 10);
          // this.svgData.mm[i].push(value - Math.random() * 10);
        }
      });
      console.log('曲线数据', this.svgData);
    }, 1000);
  }
  /** 手动回顶 */
  re() {

  }
  /** 取消张拉 */
  cancel() {
    this.go();
    localStorage.setItem('autoTask', null);
  }
  /** 保存数据退出 */
  saveOut() {
    this.go();
    localStorage.setItem('autoTask', null);
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
  save() {
    this.odb.db.task.filter(f => f.id = this.autoS.task.id).first((d) => {
      console.log('查询结果', d);
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
      }).catch((err) => {
        this.message.error(`保存失败😔${err}`);
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
