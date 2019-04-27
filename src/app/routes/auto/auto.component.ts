import { Component, OnInit, OnDestroy } from '@angular/core';
import { taskModeStr, tableDev } from 'src/app/models/jack';
import { DB, DbService } from 'src/app/services/db.service';
import { FormBuilder } from '@angular/forms';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { Router } from '@angular/router';
import { PLCService } from 'src/app/services/PLC.service';
import { AutoService } from 'src/app/services/auto.service';
import { PLC_D } from 'src/app/models/IPCChannel';
import { GroupItem } from 'src/app/models/task.models';

@Component({
  selector: 'app-auto',
  templateUrl: './auto.component.html',
  styleUrls: ['./auto.component.less']
})
export class AutoComponent implements OnInit, OnDestroy {
  db: DB;
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
  }

  ngOnInit() {
    const autoTask = JSON.parse(localStorage.getItem('autoTask'));
    if (!autoTask) {
      this.router.navigate(['/task']);
    } else {
      this.db = this.odb.db;
      this.autoS.task = autoTask;
      this.task = autoTask.groupData;
      console.log('12312313123123131', this.task);
      this.tensionStageArrF();
      this.svgData.map.push(['time']);
      this.svgData.mm.push(['time']);
      this.devNames.map((name, index) => {
        this.svgData.map.push([name]);
        this.svgData.mm.push([name]);
      });
      // this.ec();
    }
  }
  ngOnDestroy() {
    console.log('退出');
    clearInterval(this.svgt);
  }

  ec() {
    this.svgt = setInterval(() => {
      this.index = this.index + 1;
      const value = Math.random() * 10 + 10 + this.index % 100;
      this.svgData.map.map((item, i) => {
        if (i === 0) {
          item.push(new Date().getTime());
          this.svgData.mm[i].push(new Date().getTime());
        } else {
          item.push( value - Math.random() * 10);
          this.svgData.mm[i].push( value - Math.random() * 10);
        }
      });
      // console.log(this.data);
      console.log('auto');
    }, 1000);
  }
   // 获取阶段数据
   tensionStageArrF() {
    const mode = this.task.mode;
    const name = this.task.name;
    const tensionStage = this.task.tensionStage;
    this.theoryIf = tableDev(mode);
    this.devNames = taskModeStr[mode];
    this.tensionStageArr =  [...Array(tensionStage)];
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

  run() {
    this.auto.runState = true;
    this.modal.state = false;
    this.ec();
  }
  re() {

  }
  cancel() {
    this.go();
    localStorage.setItem('autoTask', null);
  }
  saveOut() {
    this.go();
    localStorage.setItem('autoTask', null);
  }
  cancelOut() {
    this.modal.cancel = true;
  }
  outOk() {
    this.go();
    localStorage.setItem('autoTask', null);
  }
  sotp() {
    clearInterval(this.svgt);
    this.auto.stopState = true;
    this.modal.state = true;
  }
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
