import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { DB, DbService } from 'src/app/services/db.service';
import { NzMessageService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { Router } from '@angular/router';
import { TensionTask } from 'src/app/models/task.models';
import { GroupComponent } from './components/group/group.component';
import { taskModeStr, carterJaskMenu } from 'src/app/models/jack';
import { TaskDataComponent } from './components/task-data/task-data.component';
import { Jack } from 'src/app/models/jack';
import { Comp } from 'src/app/models/component';
import { PLCService } from 'src/app/services/PLC.service';
import { TensionMm } from 'src/app/Function/device.date.processing';
import { ElectronService } from 'ngx-electron';
import { Elongation } from 'src/app/models/live';
import { RepetitionARV } from 'src/app/Validator/async.validator';
import { TaskMenuComponent } from './components/task-menu/task-menu.component';
import { copyAny } from 'src/app/models/base';
import { AddOtherComponent } from 'src/app/shared/add-other/add-other.component';
import { TensionComponent } from './components/tension/tension.component';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskComponent implements OnInit {
  dbName = 'task';
  @ViewChild('taskMneu') taskMneu: TaskMenuComponent;
  @ViewChild('groupDom') groupDom: GroupComponent;
  @ViewChild('taskDataDom') taskDataDom: TaskDataComponent;
  @ViewChild('otherInfo') otherIngoDom: AddOtherComponent;
  @ViewChild('tension') tensionDom: TensionComponent;

  validateForm: FormGroup;
  bridgeOtherKey = [
    '设计强度',
  ];
  /** 选择孔数据 */
  holeMneuData = {
    name: null,
    names: [],
    index: null,
    data: null,
  };
  /** 手动分组 */
  manualGroupShow = false;

  db: DB;
  data: TensionTask;
  /** 顶数据 */
  jackData: Jack;
  /** 顶菜单 */
  jacks = [];

  // steelStrandOptions = [
  //   {
  //     value: '1',
  //     label: '1860',
  //     isLeaf: true
  //   },
  //   {
  //     value: '2',
  //     label: '1466',
  //     isLeaf: true
  //   },
  // ];

  /** 监控组状态 */
  holeSub$: any = null;
  /** 监控基础数据状态 */
  baseSub$: any = null;

  /** 构建选择菜单c */
  componentOptions = {
    menu: [],
    holes: null
  };
  /** 当前显示面板 */
  tabsetShow = 0;

  /** 导出 */
  derived = {
    templatePath: null,
    outPath: null,
  };
  /**  */
  holeNames: any;

  addFilterFun = (o1: any, o2: any) => o1.name === o2.name
    && o1.component === o2.component && o1.project === o2.project
  updateFilterFun = (o1: TensionTask, o2: TensionTask) => o1.name === o2.name
    && o1.component === o2.component && o1.project === o2.project && o1.id !== o2.id

  constructor(
    private fb: FormBuilder,
    private odb: DbService,
    private message: NzMessageService,
    public appS: AppService,
    private router: Router,
    public PLCS: PLCService,
    private e: ElectronService,
    private cdr: ChangeDetectorRef
  ) {
    this.db = this.odb.db;
  }

  sss(v) {
    console.log(v);
  }
  /** 手动更新 */
  markForCheck() {
    this.cdr.markForCheck();
  }
  ngOnInit() {
    this.validateForm = this.fb.group({
      id: [],
      name: [null, [Validators.required], [new RepetitionARV(this.odb, 'task', this.updateFilterFun)]],
      device: [null, [Validators.required]],
      component: [null, [Validators.required]],
      steelStrand: [null],
      // otherInfo: this.fb.array(this.otherInfoForm()),
      otherInfo: this.fb.array(this.otherIngoDom.createForm([{key: '浇筑日期', value: null}])),
      holeRadio: [null, [Validators.required]],
      groups: [],
      project: []
    });
    this.getJacks();
    this.db.comp.toArray().then((d) => {
      console.log(d);
      this.componentOptions.menu = [];
      d.map((item: Comp) => {
        item.hole.map((h) => {
          const value = `${item.name}/${h.name}`;
          this.componentOptions.menu.push({ name: value, holes: h.holes });
        });
      });
      console.log(this.componentOptions);
    }).catch(() => {
      this.message.error('获取构建数据错误!!');
    });
  }
  /** 获取顶数据 */
  getJacks() {
    console.log('获取jack');
    this.db.jack.toArray().then((d: Array<Jack>) => {
      this.jacks = d.map(item => {
        return {
          value: item.id,
          label: item.name,
          children: carterJaskMenu(item.jackMode)
        };
      });
      console.log(d, this.jacks);
    });
  }

  /** 重新赋值 */
  reset() {
    // this.validateForm.setControl('otherInfo', this.fb.array(this.otherInfoForm()));
    this.validateForm.setControl('otherInfo', this.fb.array(this.otherIngoDom.createForm(this.data.otherInfo)));
    // 不刷新两次异步验证有问题
    this.validateForm.reset(this.data);
    this.validateForm.reset(this.data);
  }

  /** 选择梁 */
  async onBridge(data) {
    if (!data) {
      return;
    }
    this.data = data;

    this.holeMneuData = {
      name: null,
      names: [],
      index: null,
      data: null,
    };
    this.holeMneu();
    this.reset();
  }
  /** 构造孔菜单 */
  holeMneu() {
    this.holeMneuData.names = [];
    this.data.groups.map(g => {
      let cls = 0;
      if (g.record) {
        cls = g.record.state;
      }
      // this.holeMneuData.names.push({ name: g.name, cls });
      this.holeMneuData.names.push({ name: g.name, cls });
    });
  }

  /**
   * *编辑
   */
  onEdit(data: TensionTask) {
    if (!data) {
      data = copyAny(this.data);
      delete data.id;
      for (const c of data.groups) {
        delete c.record;
      }
    } else {
      data.project = this.taskMneu.project.select.id;
      this.holeMneuData.names = [];
    }
    this.data = data;
    this.holeMneuData.name = null,
    this.holeMneuData.index = null,
    this.holeMneuData.data = null,

    console.log('编辑', this.data);
    this.reset();
    console.log('编辑', this.data, this.appS.editId, this.appS.edit);
    this.taskMneu.markForCheck();
  }
  /**
   * *编辑完成
   */
  editOk(id) {
    console.log();
    if (id) {
      // this.leftMenu.getMenuData(id);
      this.taskMneu.getBridge(id);
      console.log('保存数据', this.holeMneuData.index, this.validateForm.value);
    } else {
      // this.leftMenu.onClick();
      this.taskMneu.onMneu();
    }
  }
  /** 更新孔数据 */
  updateGroupItem() {
    const g = this.taskDataDom.holeForm.value;
    this.data.groups[this.holeMneuData.index] = g;
    this.validateForm.controls.groups.setValue(this.data.groups);
  }

  /**
   * *切换张拉组
   */
  async onHoleRadio(name, i) {
    if (this.appS.edit && !this.taskDataDom.holeForm.valid) {
      this.message.error('数据填写有误！！');
    } else {
      /** 取消监听 */
      if (this.holeSub$) {
        this.holeSub$.unsubscribe();
        this.holeSub$ = null;
      }
      /** 获取编辑数据 */
      this.holeMneuData.index = i;
      this.holeMneuData.name = name;
      this.holeMneuData.data = this.data.groups[i];
      console.log('切换张拉组', this.data, name, i);
      if (!this.jackData || this.data.device[0] !== this.jackData.id) {
        this.jackData = await this.db.jack.filter(j => j.id === this.data.device[0]).first();
      }
      this.taskDataDom.createHoleform(this.holeMneuData.data, this.jackData);
    }
    console.log(this.holeMneuData.index);
  }

  /** 切换显示项 */
  changeTabst(value) {
    console.log(value.index);
    this.tabsetShow = value.index;
  }

  /** 构建选择 */
  componentChange(event) {
    console.log(event);
    if (event && this.appS.edit) {
      this.groupDom.holes = this.componentOptions.menu.filter(f => f.name === event)[0].holes;
      this.groupDom.autoGroup();
    }
  }
  /** 选择设备 */
  deviceOnChanges(value) {
    console.log('选择设备', value);
    if (value && this.appS.edit) {
      this.groupDom.deviceMode = value[1];
      this.groupDom.autoGroup();
    }
  }

  /** 分组完成 */
  okGroup(g) {
    this.validateForm.controls.groups.setValue(g.data);
    this.data = this.validateForm.value;
    this.holeMneu();
    console.log('分组完成', g, this.validateForm.value);
  }

  /** 选择导出模板 */
  selectTemplate() {
    const channel = `ecxel${this.PLCS.constareChannel()}`;
    this.e.ipcRenderer.send('selectTemplate', { channel });
    this.e.ipcRenderer.once(channel, (event, data) => {
      if (data.templatePath && data.outPath) {
        this.derived = {
          templatePath: data.templatePath,
          outPath: data.outPath
        };
      }
      console.log('模板选择结果', this.derived);
    });
  }
  /** 导出 */
  derivedExcel() {
    if (!this.derived.outPath || !this.derived.templatePath) {
      this.message.error('模板或导出路径错误！！');
      return;
    }
    const channel = `ecxel${this.PLCS.constareChannel()}`;
    const outdata = {
      record: [],
      data: null
    };
    this.data.groups.map(g => {
      if (g.record) {
        const elongation: Elongation = TensionMm(g);
        taskModeStr[g.mode].map(name => {
          outdata.record.push({
            name: g.name,
            devName: name,
            mpa: g.record[name].mpa,
            kn: g.record[name].mpa,
            mm: g.record[name].mm,
            setKn: g.tensionKn,
            theoryMm: g[name].theoryMm,
            lengthM: g.length,
            tensiongMm: elongation[name].sumMm,
            percent: elongation[name].percent,
            wordMm: g.cA.wordMm,
            returnMm: g.returnMm,
            returnKn: {
              mpa: 1,
              kn: 2,
              mm: 3,
              countMm: 4
            }
          });
        });
      }
    });
    outdata.data = JSON.stringify(outdata.record);
    console.log('导出的数据', outdata);
    this.e.ipcRenderer.send('derivedExcel', {
      channel,
      templatePath: this.derived.templatePath,
      outPath: this.derived.outPath,
      data: outdata
    });
    this.e.ipcRenderer.once(channel, (event, data) => {
      if (data.success) {
        this.message.success('导出完成');
      }
      console.log('导出', data);
    });
  }

}
