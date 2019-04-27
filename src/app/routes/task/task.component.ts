import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { DB, DbService } from 'src/app/services/db.service';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { User } from 'src/app/models/user.models';
import { Router, ActivatedRoute } from '@angular/router';
import { GroupItem, TensionTask } from 'src/app/models/task.models';
import { Observable, from } from 'rxjs';
import { groupBy, map } from 'rxjs/internal/operators';
import { GroupComponent } from './components/group/group.component';
import { groupModeStr, taskModeStr, carterJaskMenu } from 'src/app/models/jack';
import { TaskDataComponent } from './components/task-data/task-data.component';
import { Jack } from 'src/app/models/jack';
import { Comp } from 'src/app/models/component';
import { AutoService } from 'src/app/services/auto.service';
import { PLCService } from 'src/app/services/PLC.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.less']
})
export class TaskComponent implements OnInit {
  @ViewChild('groupDom')
    groupDom: GroupComponent;
  @ViewChild('taskDataDom')
    taskDataDom: TaskDataComponent;

  validateForm: FormGroup;

  db: DB;
  data: TensionTask;
  /** 顶详细数据 */
  jackData: Jack;
  /** 顶选择数据 */
  jacks = [];

  steelStrandOptions = [
    {
      value: '1',
      label: '1860',
      isLeaf: true
    },
    {
      value: '2',
      label: '1466',
      isLeaf: true
    },
  ];

  holeRadio: any;
  /** 分组 */
  groupIsVisible = false;
  group = {
    g: [],
    garr: [],
    mode: null,
    holes: [],
  };
  /** 组数据 */
  groupData: Array<GroupItem> = [];
  /** 编辑组index */
  editGroupIndex: number = null;
  /** 编辑组名称 */
  editGroupName: number = null;
  edit = false;
  /** 监控组状态 */
  holeSub$: any = null;
  /** 监控基础数据状态 */
  baseSub$: any = null;
  /** 菜单 */
  menu = {
    component: [],
    bridge: [],
    selectComponent: null,
    selectBridge: null,
  };
  /** 自动完成component */
  componentOptions = {
    menu: [],
    holes: null
  };
  /** 当前显示面板 */
  tabsetShow = 0;
  /** 选择项目 */
  project = null;
  projectMneu = [];
  piState = false;
  /** 当前选择孔数据 */
  holeData: GroupItem;
  /** 路由数据 */
  routeData: any = {
    project: null,
    component: null,
    selectBridge: null,
    editGroupName: null
  };
  /** 张拉设备状态 */
  tensionDevice = {
    state: false,
    names: [],
    zA: null,
    zB: null,
    zC: null,
    zD: null,
    cA: null,
    cB: null,
    cC: null,
    cD: null,
  };


  constructor(
    private fb: FormBuilder,
    private odb: DbService,
    private message: NzMessageService,
    public appS: AppService,
    private router: Router,
    private modalService: NzModalService,
    private autoS: AutoService,
    private activatedRoute: ActivatedRoute,
    public PLCS: PLCService,
  ) {
    this.db = this.odb.db;
    activatedRoute.queryParams.subscribe(queryParams => {
      if (queryParams.project) {
        this.routeData = queryParams;
      } else {
        this.routeData = {
          project: null,
          component: null,
          selectBridge: null,
          editGroupName: null
        }
      }
      console.log('路由', this.routeData, queryParams.project);
    });
  }

  ngOnInit() {
    this.getProjectMenu();
    // this.getMenuOne();
    this.getJacks();
    this.validateForm = this.fb.group({
      id: [],
      name: [null, [Validators.required], [this.nameRepetition()]],
      device: [null, [Validators.required]],
      component: [null, [Validators.required]],
      steelStrand: [null, [Validators.required]],
      holeRadio: [null, [Validators.required]],
      project: []
    });
    this.startBaseSub();
    this.db.comp.toArray().then((d) => {
      console.log(d);
      this.componentOptions.menu = [];
      d.map((item: Comp) => {
        item.hole.map((h) => {
          this.componentOptions.menu.push({name: `${item.name}/${h.name}`, holes: h.holes });
        });
      });
      console.log(this.componentOptions.menu);
    }).catch(() => {
      this.message.error('获取构建数据错误!!');
    });
  }
  /** 异步验证 */
  nameRepetition(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      console.log('777777', control);
      return from(this.odb.repetition('task',
                  (item: TensionTask) => item.name === control.value &&
                  item.component === control.root.value.component &&
                  item.project === control.root.value.project &&
                  item.id !== control.root.value.id)).pipe(
        map(item => {
          return item ? { reperition: `${control.value} 已存在!!` } : null;
        }),
      );
    };
  }
  /** 获取项目菜单 */
  getProjectMenu() {
    this.db.project.toArray().then((d) => {
      console.log(d);
      this.projectMneu = d.map(item => {
        return { name: item.projectName, id: item.id };
      });
      /** 路由跳转 */
      if (this.routeData.project) {
        this.project = this.projectMneu.filter(item => item.id === Number(this.routeData.project))[0];
        this.getMenuOne().then(() => {
          this.onMenuOne(this.routeData.component).then(() => {
            this.onMenubridge(Number(this.routeData.selectBridge));
          });
        });
      }
      console.log(this.project);
    }).catch(() => {
      this.message.error('获取菜单数据错误!!');
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
  /** 获取顶明细 */
  getJackDel(id) {
    this.db.jack.filter(j => j.id === id).first().then((jack: Jack) => {
      this.jackData = jack;
      console.log(this.jackData);
    });
  }
  /** 获取一级菜单 */
  getMenuOne(project = this.project.id): Promise<void> {
    this.menu.component = [];
    console.log(project);
    return new Promise((resolve, reject) => {
      this.db.task.where({ project }).each((t) => {
        console.log(t);
        if (this.menu.component.indexOf(t.component) < 0) {
          this.menu.component.push(t.component);
        }
      }).then(() => {
        resolve();
      }).catch((err) => {
        console.log(err);
        this.message.error('获取一级菜单数据错误!!');
        reject();
      });
    });
  }
  /** 一级数据分组 */
  groupBy(array: Array<TensionTask>) {
    const s = [];
    from(array).pipe(
      groupBy(t => t.component),
      map(t => t.key)
    ).subscribe(t => s.push(t));
    console.log(s);
    return s;
  }
  /** 获取二级菜单 */
  onMenuOne(component = null): Promise<void> {
    return new Promise((resolve, reject) => {
      if (component === null || this.ifEdit()) { return; }
      this.menu.bridge = [];
      if (this.menu.selectComponent !== null || component === this.menu.selectComponent) {
        this.menu.selectComponent = null;
        this.menu.selectBridge = null;
        this.data = null;
        this.editGroupIndex = null;
        this.editGroupName = null;
      } else {
        this.db.task.where({ project: this.project.id, component }).each(f => {
          this.menu.bridge.push({ name: f.name, id: f.id });
          this.menu.selectComponent = component;
          resolve();
        }).catch(() => {
          this.message.error('获取二级菜单数据错误!!');
          reject();
        });
      }
    });
  }
  /** 选择梁菜单 */
  onMenubridge(id: any = 'null', copyData = null) {
    console.log('选择梁', id);
    if (id === 'null' || this.ifEdit()) { return; }
    id = id === 'null' ? null : id;
    this.cliceBaseSub();
    this.menu.selectBridge = id;
    if (id) {
      this.db.task.where({ id }).first((task: TensionTask) => {
        this.data = task;
        this.validateForm.reset(this.data);
        this.groupData = JSON.parse(JSON.stringify(task.groups));
        console.log(this.data);
        this.getJackDel(this.data.device[0]);
        this.startBaseSub();
        /** 路由跳转 */
        if (this.routeData.editGroupName) {
          this.onHoleRadio(this.routeData.editGroupName);
        }
      }).catch(error => {
        console.error(error.stack || error);
      });
    } else {
      if (copyData) {
        this.data = copyData;
      } else {
        this.data = {
          name: null,
          project: this.project.id,
          device: null,
          component: null,
          steelStrand: null,
          holeRadio: null,
          groups: [],
        };
      }
      this.validateForm.reset(this.data);
      this.groupData = JSON.parse(JSON.stringify(this.data.groups));
      this.startBaseSub();
      this.appS.edit = true;
    }
  }
  /** 启动基础数据修改监听 */
  startBaseSub() {
    this.editGroupIndex = null;
    this.editGroupName = null;
    if (this.baseSub$ === null) {
      this.baseSub$ = this.validateForm.valueChanges.subscribe(() => {
        console.log('编辑1监控');
        this.appS.edit = true;
      });
    }
  }
  /** 取消基础数据修改监听 */
  cliceBaseSub() {
    if (this.baseSub$) {
      console.log('取消编辑1监控');
      this.baseSub$.unsubscribe();
      this.baseSub$ = null;
    }
  }
  /** 判断编辑状态 */
  ifEdit(): boolean {
    if (this.edit || this.appS.edit) {
      this.message.warning('请完成编辑！');
      return true;
    }
    return false;
  }
  submitForm() {
    // tslint:disable-next-line:forin
    for (const i in this.validateForm.controls) {
      this.validateForm.controls[i].markAsDirty();
      this.validateForm.controls[i].updateValueAndValidity();
    }
    const value = this.validateForm.value;
    console.log(value);
  }

  componentOnChanges(value) {
    console.log(value);
  }
  steelStrandOnChanges(value) {
    console.log(value);
  }
  /** 切换张拉组 */
  onHoleRadio(name) {
    if (this.edit || !this.data.id) { return; }
    if (this.holeSub$) {
      this.holeSub$.unsubscribe();
      this.holeSub$ = null;
    }
    const data = this.groupData.filter((g, i) => {
      if (g.name === name) {
        this.editGroupIndex = i;
        this.editGroupName = name;
      }
      return g.name === name;
    })[0];
    // this.taskDataDom.holeForm.reset(data);
    this.taskDataDom.createHoleform(data);
    this.holeData = data;
    console.log('切换张拉组', name, this.groupData, this.editGroupIndex, data);
    // this.taskDataDom.tensionStageArrF();
    if (this.holeSub$ === null) {
      this.holeSub$ = this.taskDataDom.holeForm.valueChanges.subscribe((s) => {
        console.log('编辑2监控', s);
        this.edit = true;
        this.appS.edit = true;
      });
    }
  }
  /** 保存张拉组修改 */
  holeSubmitForm() {
    // tslint:disable-next-line:forin
    for (const i in this.taskDataDom.holeForm.controls) {
      this.taskDataDom.holeForm.controls[i].markAsDirty();
      this.taskDataDom.holeForm.controls[i].updateValueAndValidity();
    }
    const value = this.taskDataDom.holeForm.value;
    this.groupData[this.editGroupIndex] = value;
    console.log(value, this.groupData);
    console.log(JSON.stringify(value));
  }

  /** 分组 */
  onGroup() {
    // const device = this.validateForm.controls.device.value;
    this.group.g = this.groupData.map(item => {
      return item.name;
    });
    console.log(this.groupIsVisible, this.group.mode);
    if (this.group.mode) {
      // this.group.mode = device[1];
      this.groupIsVisible = true;
    } else {
      this.message.error('请选择设备😔');
    }
    this.componentChange();
    this.groupDom.gmStr = groupModeStr(this.group.mode);
    this.groupDom.group.g = this.group.g;
    this.groupDom.holes = this.componentOptions.holes;
    this.groupDom.open();
  }
  /** 分组取消 */
  groupCancel() {
    this.groupIsVisible = false;
  }
  /** 分组完成 */
  groupOk() {
    console.log('完成', this.group, this.groupDom.group);
    this.group.g = this.groupDom.group.g;
    if (this.group.g.length === 0) {
      this.message.error('至少需要一个分组');
      return;
    }
    this.groupData = [];
    this.group.g.map(item => {
      const taskBase: GroupItem = {
        name: item,
        mode: this.group.mode,
        length: 0,
        tensionKn: 0,
        steelStrandNumber: 0,
        tensionStage: 4,
        stage: [10, 20, 50, 100, 101],
        returnMm: 6,
        twice: false,
      };
      taskModeStr[this.group.mode].map(d => {
        taskBase[d] = {
          kn: [0, 0, 0, 0, 0],
          wordMm: 4,
        };
        if (d.indexOf('zA') > -1 || d.indexOf('zB') > -1 || d.indexOf('zC') > -1 || d.indexOf('zD') > -1) {
          taskBase[d].theoryMm = 0;
        }
      });
      this.groupData.push(taskBase);
    });
    this.validateForm.controls.holeRadio.setValue(this.group.g);
    console.log(this.groupData);
    this.groupIsVisible = false;
  }

  /** 保存数据 */
  save() {
    // tslint:disable-next-line:forin
    for (const i in this.validateForm.controls) {
      if (i !== 'name') {
        this.validateForm.controls[i].markAsDirty();
        this.validateForm.controls[i].updateValueAndValidity();
      }
    }
    // tslint:disable-next-line:forin
    for (const i in this.taskDataDom.holeForm.controls) {
      this.taskDataDom.holeForm.controls[i].markAsDirty();
      this.taskDataDom.holeForm.controls[i].updateValueAndValidity();
    }
    console.log(this.taskDataDom.holeForm.valid, this.validateForm.valid);
    if (!this.validateForm.valid || !this.taskDataDom.holeForm.valid) {
      this.message.error('数据填写有误！！');
      return;
    }
    console.log(this.data);
    // const data = Object.assign(this.data, this.validateForm.value);
    const data = this.validateForm.value;
    if (this.data.id) {
      const value = this.taskDataDom.holeForm.value;
      this.groupData[this.editGroupIndex] = value;
    }

    data.groups = this.groupData;
    this.data = Object.assign(this.data, data);
    if (this.holeSub$) {
      this.holeSub$.unsubscribe();
    }

    console.log('保存数据', this.data, this.groupData);
    // 添加
    if (!this.data.id) {
      delete this.data.id;
      this.db.task.add(this.data).then((id) => {
        this.message.success('添加成功🙂');
        this.edit = false;
        this.appS.edit = false;
        this.menu.selectComponent = null;
        this.getMenuOne().then(() => {
          this.onMenuOne(this.data.component).then(() => {
            this.onMenubridge(id);
          });
        });
        // new Promise(this.getMenuOne).then(this.onMenuOne).then(this.onMenubridge);
        console.log(id);
      }).catch((err) => {
        this.message.error('添加失败😔');
        console.log(err);
      });
    } else {
      this.db.task.update(this.data.id, this.data).then((updata) => {
        this.message.success('修改成功🙂');
        this.edit = false;
        this.appS.edit = false;
      }).catch((err) => {
        this.message.error(`修改失败😔${err}`);
      });
    }
  }

  /** 取消保存 */
  saveCancel() {
    const m = this.modalService.warning({
      nzTitle: '确定取消编辑吗？',
      nzContent: '放弃本次数据编辑，数据不会更改！',
      nzCancelText: '继续编辑',
      nzOnOk: () => {
        this.appS.edit = false;
        this.edit = false;
        this.data = null;
        // menu.selectComponent
        // menu.selectBridge
        if (this.menu.selectBridge) {
          this.onMenubridge(this.menu.selectBridge);
        }
        // m.close();
      },
      nzOnCancel: () => { console.log('取消'); }
    });
  }
  /** 添加 */
  add() {
    this.group.mode = null;
    this.componentOptions.holes = null;
    this.onMenubridge(null);
  }
  /** 修改 */
  modification() {
    this.appS.edit = true;
  }
  /** 复制 */
  copy() {
    console.log('复制');
    const copy = Object.assign(JSON.parse(JSON.stringify(this.data)), { id: null, name: null });
    this.onMenubridge(null, copy);
  }
  /** 张拉 */
  tension() {
    console.log('张拉', this.holeData);
    if (this.tensionDeviceState()) {
      this.tensionDevice.state = true;
      this.tensionDevice.names = taskModeStr[this.holeData.mode];
      console.log('设备状态错误！！！');
    }
    // localStorage.setItem('autoTask', JSON.stringify({
    //   project: this.project.id,
    //   component: this.menu.selectComponent,
    //   id: this.data.id,
    //   groupData: this.holeData
    // }));
    // this.router.navigate(['/auto']);
  }
  /** 设备状态 */
  tensionDeviceState(): boolean {
    let s = false;
    for (const name of taskModeStr[this.holeData.mode]) {
      console.log(this.PLCS.PD[name].alarm, this.PLCS.PD[name].state);
      this.tensionDevice[name] = null;
      for (let index = 1; index < this.holeData.tensionStage; index++) {
        const i0 = Number(this.holeData[name].kn[index - 1]);
        const i1 = Number(this.holeData[name].kn[index]);
        console.log(i0, '>=', i1, '=', i0 >= i1);
        if ((i0 >= i1) || i0 > 56 || i1 > 56) {
          this.tensionDevice[name] = '阶段压力设置错误';
          s = true;
        }
      }
      if (this.PLCS.PD[name].alarm.length !== 0 || this.PLCS.PD[name].state !== '待机') {
        s = true;
      }
    }
    return s;
  }
  cleanTension() {
    this.tensionDevice.state = false;
  }
  /** 切换显示项 */
  changeTabst(value) {
    console.log(value.index);
    this.tabsetShow = value.index;
  }
  /** 项目选择 */
  projectChanges() {
    // this.piState = false;
    console.log(this.project);
    this.getMenuOne();
  }
  /** 构建选择 */
  componentChange() {
    const e = this.validateForm.value.component;
    this.componentOptions.holes = this.componentOptions.menu.filter(f => f.name === e)[0];
    this.autoGroup();
  }
  /** 选择设备 */
  deviceOnChanges(value) {
    console.log(value);
    if (value) {
      this.group.mode = value[1];
      this.autoGroup();
    }
  }
  /** 自动分组 */
  autoGroup() {
    if (this.group.mode && this.componentOptions.holes && this.componentOptions.holes.holes.length > 0) {
      console.log(this.group.mode, this.componentOptions.holes.holes);
      this.groupDom.gmStr = groupModeStr(this.group.mode);
      if (this.componentOptions.holes.holes.length % this.groupDom.gmStr.length) {
        console.log('不能自动分组');
      } else {
        const g = [];
        for (let index = 0; index < this.componentOptions.holes.holes.length; index += this.groupDom.gmStr.length) {
          console.log(this.componentOptions.holes.holes.slice(index, index + this.groupDom.gmStr.length));
          g.push(this.componentOptions.holes.holes.slice(index, index + this.groupDom.gmStr.length).join('/'));
        }
        console.log(g);
        this.groupDom.group.g = g;
        this.groupDom.holes = this.componentOptions.holes;
        this.groupOk();
      }
    }
  }
}
