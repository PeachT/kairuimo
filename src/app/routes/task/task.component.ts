import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
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
import { nameRepetition } from 'src/app/Validator/async.validator';
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
  @ViewChild('taskMneu', null) taskMneu: TaskMenuComponent;
  @ViewChild('groupDom', null) groupDom: GroupComponent;
  @ViewChild('taskDataDom', null) taskDataDom: TaskDataComponent;
  @ViewChild('otherInfo', null) otherIngoDom: AddOtherComponent;
  @ViewChild('tension', null) tensionDom: TensionComponent;

  formData: FormGroup;
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
  deleteShow = false;
  /** 选择顶状态 */
  selectJackState = false;
  save100Count = 0;

  addFilterFun = (o1: any, o2: any) => o1.name === o2.name
    && o1.component === o2.component && o1.project === o2.project
  updateFilterFun = (o1: TensionTask, o2: TensionTask) => o1.name === o2.name
    && o1.component === o2.component && o1.project === o2.project && o1.id !== o2.id

  constructor(
    private fb: FormBuilder,
    public odb: DbService,
    private message: NzMessageService,
    public appS: AppService,
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
    this.formData = this.fb.group({
      id: [],
      name: [null, [Validators.required], [nameRepetition(this.odb, 'task', this.updateFilterFun)]],
      device: [null, [Validators.required]],
      component: [null, [Validators.required]],
      steelStrand: [null],
      jack: [],
      // otherInfo: this.fb.array(this.otherInfoForm()),
      otherInfo: this.fb.array(this.otherIngoDom.createForm([{key: '浇筑日期', value: null}])),
      holeRadio: [null],
      groups: [null, [Validators.required]],
      project: [],
      startDate: [],
      entDate: []
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
    this.formData.setControl('otherInfo', this.fb.array(this.otherIngoDom.createForm(this.data.otherInfo)));
    // 不刷新两次异步验证有问题
    this.formData.reset(this.data);
    // tslint:disable-next-line:forin
    for (const i in this.formData.controls) {
      this.formData.controls[i].markAsDirty();
      this.formData.controls[i].updateValueAndValidity();
    }
    // this.validateForm.reset(this.data);
  }

  /** 选择梁 */
  async onBridge(data: TensionTask) {
    if (!data) {
      return;
    }
    this.data = data;
    console.log('梁梁梁梁', this.data);
    this.jackData = data.jack;
    this.holeMneuData = {
      name: null,
      names: [],
      index: null,
      data: null,
    };
    this.holeMneu();
    this.reset();
    this.onHoleRadio(this.data.groups[0].name, 0);
  }
  /** 构造孔菜单 */
  holeMneu() {
    this.holeMneuData.names = [];
    this.selectJackState = false;
    this.data.groups.map(g => {
      let cls = 0;
      if (g.record) {
        cls = g.record.state;
        this.selectJackState = true;
      }
      // this.holeMneuData.names.push({ name: g.name, cls });
      this.holeMneuData.names.push({ name: g.name, cls });
    });
  }

  /**
   * *编辑
   */
  onEdit(data: TensionTask) {
    /** 复制 */
    if (!data) {
      data = copyAny(this.data);
      data.id = null;
      data.otherInfo[0].value = null;
      for (const c of data.groups) {
        delete c.record;
      }
      this.jackData = data.jack;
      this.holeMneu();
    /** 添加 */
    } else {
      this.selectJackState = false;
      data.project = this.taskMneu.project.select.id;
      this.holeMneuData.names = [];
    }
    this.data = data;
    this.holeMneuData.name = null,
    this.holeMneuData.index = null,
    this.holeMneuData.data = null,
    this.taskDataDom.show = null;
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
      this.taskMneu.res({component: this.data.component, selectBridge: id});
      console.log('保存数据', this.holeMneuData.index, this.formData.value);
    } else {
      // this.leftMenu.onClick();
      this.taskMneu.onMneu();
    }
  }
  /** 测试用 */
  async save100() {
    const data = copyAny(this.formData.value);
    this.save100Count ++;
    data.name = `${data.name}-${this.save100Count}`;
    console.log(data);
    delete data.id;
    const r = await this.odb.addAsync('task', data, (o: any) => this.updateFilterFun(o, data));
    if (r && this.save100Count < 5) {
      this.save100();
    }
  }

  /** 删除 */
  async delete() {
    const id = this.appS.leftMenu;
    const count = this.holeMneuData.names.filter(h => h.cls > 0).length;
    if (count === 0) {
      this.deleteShow = true;
      this.cdr.markForCheck();
      console.log('删除', id, '任务', count, this.deleteShow);
    } else {
      this.message.error(`有 ${count} 条任务在该项目下，不允许删除！`);
    }
  }
  async deleteOk(state = false) {
    if (state) {
      const msg = await this.db.task.delete(this.appS.leftMenu);
      console.log('删除了', msg);
      this.appS.leftMenu = null;
      this.taskMneu.getBridge();
    }
    this.deleteShow = false;
  }
  /** 更新孔数据 */
  updateGroupItem() {
    console.log('更新孔数据');
    const g = this.taskDataDom.holeForm.value;
    if ('record' in  this.data.groups[this.holeMneuData.index]) {
      g.record = this.data.groups[this.holeMneuData.index].record;
    }
    this.data.groups[this.holeMneuData.index] = g;
    this.formData.controls.groups.setValue(this.data.groups);
  }

  /**
   * *切换张拉组
   */
  async onHoleRadio(name, i) {
    if (this.appS.edit && !this.taskDataDom.holeForm.valid) {
      this.message.error('数据填写有误！！');
    } else {
      /** 取消监听 */
      // if (this.holeSub$) {
      //   this.holeSub$.unsubscribe();
      //   this.holeSub$ = null;
      // }
      /** 获取编辑数据 */
      this.holeMneuData.index = i;
      this.holeMneuData.name = name;
      this.holeMneuData.data = this.data.groups[i];
      console.log('切换张拉组', this.data, name, i);
      if (this.data && this.data.jack) {
        this.jackData = this.data.jack;
      } else {
        if (!this.jackData || this.data.device[0] !== this.jackData.id) {
          this.jackData = await this.db.jack.filter(j => j.id === this.data.device[0]).first();
        }
      }
      this.taskDataDom.createHoleform(this.holeMneuData.data, this.jackData);
    }
    console.log(this.holeMneuData.index, this.holeMneuData.data,  this.holeMneuData.data.record);
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
      if (this.formData.value.device) {
        this.groupDom.autoGroup();
      }
    }
  }
  /** 选择设备 */
  async deviceOnChanges(value) {
    if (value && this.appS.edit) {
      this.groupDom.deviceMode = value[1];
      if (this.formData.value.component) {
        this.jackData = await this.db.jack.filter(j => j.id === value[0]).first();
        this.formData.controls.jack.setValue(this.jackData);
        console.log('选择设备', value, this.jackData);
        this.groupDom.autoGroup();
      }
    }
  }

  /**
   * *分组完成
   */
  okGroup(g) {
    this.formData.controls.groups.setValue(g.data);
    this.data = this.formData.value;
    this.holeMneu();
    console.log('分组完成', g, this.formData.value);
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
  /** 张拉 */
  onTension() {
    const localData = {
      project: this.taskMneu.project.select.id,
      component: this.taskMneu.component.select,
      id: this.data.id,
      jackId: this.jackData.id,
      groupData: this.holeMneuData.data
    };
    this.tensionDom.tension(this.holeMneuData, localData);
  }
  async getUpdateData() {
    const d: TensionTask = await this.odb.getFirstId('task', this.data.id);
    const t = this.formData.value as TensionTask;
    d.groups.map((g, i) => {
      if ('record' in g) {
        t.groups[i].record = g.record;
      }
    });
    // const data = Object.assign(d, this.formData.value);
    console.log(t);
  }
}
