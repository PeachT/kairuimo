import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { DB, DbService, tableName } from 'src/app/services/db.service';
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
import { mpaToPlc, TensionMm } from 'src/app/Function/device.date.processing';
import { ElectronService } from 'ngx-electron';
import { Elongation } from 'src/app/models/live';

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
    menuNames: [],
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
  /** 导出 */
  derived = {
    templatePath: null,
    outPath: null,
  };
  /**  */
  holeNames: any;

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
    private e: ElectronService,
  ) {
    this.db = this.odb.db;
    activatedRoute.queryParams.subscribe(queryParams => {
      if (queryParams.project) {
        this.routeData = queryParams;
      } else {
        let data = null;
        if (this.appS.userInfo) {
          data = JSON.parse(localStorage.getItem(this.appS.userInfo.nameId));
        }
        if (data) {
          this.routeData = data;
        } else {
          this.routeData = {
            project: null,
            component: null,
            selectBridge: null,
            editGroupName: null
          };
        }
      }
      console.log('路由', this.routeData, queryParams.project);
    });
  }

  ngOnInit() {
    this.validateForm = this.fb.group({
      id: [],
      name: [null, [Validators.required], [this.nameRepetition()]],
      device: [null, [Validators.required]],
      component: [null, [Validators.required]],
      steelStrand: [null, [Validators.required]],
      holeRadio: [null, [Validators.required]],
      project: []
    });
    this.goRouteHole();
    // this.getMenuOne();
    this.getJacks();
    this.startBaseSub();
    this.db.comp.toArray().then((d) => {
      console.log(d);
      this.componentOptions.menu = [];
      this.componentOptions.menuNames = [];
      d.map((item: Comp) => {
        item.hole.map((h) => {
          const value = `${item.name}/${h.name}`;
          this.componentOptions.menu.push({ name: value, holes: h.holes });
          this.componentOptions.menuNames.push({ value, label: value, isLeaf: true});
        });
      });
      console.log(this.componentOptions);
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
  /** 跳转到路由数据孔号 */
  async goRouteHole() {
    await this.getProjectMenu();
    if (this.routeData.project) {
      console.log(this.routeData, this.projectMneu);
      this.project = this.projectMneu.filter(item => item.id === Number(this.routeData.project))[0];
      await this.getMenuOne();
    }
    if (this.routeData.component) {
      await this.onMenuOne(this.routeData.component);
    }
    if (this.routeData.selectBridge) {
      await this.onMenubridge(this.routeData.selectBridge);
    }
    if (this.routeData.editGroupName) {
      this.onHoleRadio(this.routeData.editGroupName);
    }
  }
  /** 获取项目菜单 */
  async getProjectMenu() {
    const ps = await this.db.project.toArray();
    this.projectMneu = ps.map(item => {
      return { name: item.projectName, id: item.id };
    });
  }
  /** 获取一级菜单 */
  async getMenuOne(project = this.project.id) {
    const ps = await this.db.task.filter(t => t.project === project).toArray();
    console.log(project, ps);
    this.menu.component = this.groupBy(ps);
  }
  /** 获取二级菜单 */
  async onMenuOne(component = null) {
    console.log(component, this.menu);
    if (component === null || this.ifEdit()) { return; }
    this.menu.bridge = [];
    if (this.menu.selectComponent !== null || component === this.menu.selectComponent) {
      this.menu.selectComponent = null;
      this.menu.selectBridge = null;
      this.data = null;
      this.editGroupIndex = null;
      this.holeData = null;
      this.editGroupName = null;
    } else {
      const ps = await this.db.task.where({ project: this.project.id, component }).toArray();
      this.menu.selectComponent = component;
      this.menu.bridge = ps.map(f => {
        const cls = {
          a: false,
          b: false,
          c: false,
          d: false,
          e: false,
        };
        for (const g of f.groups) {
          if (g.record) {
            if (g.record.state === 2) {
              cls.a = true;
            } else if (g.record.state === 1) {
              cls.b = true;
            } else if (g.record.state === 3) {
              cls.c = true;
            } else if (g.record.state === 4) {
              cls.d = true;
            }
          } else {
            cls.e = true;
          }
        }
        return { name: f.name, id: f.id, cls };
      });
      console.log('梁数据', ps, this.menu.bridge);
    }
  }
  /** 选择梁菜单 */
  async onMenubridge(id: any = 'null', copyData = null) {
    console.log('选择梁', id, copyData);
    id = Number(id);
    if (id === 'null' || this.ifEdit()) { return; }
    id = id === 'null' ? null : id;
    this.cliceBaseSub();
    this.menu.selectBridge = id;
    if (id) {
      this.data = await this.db.task.filter(t => t.id === id).first();
      console.log('选择梁', this.data);
      this.validateForm.reset(this.data);
      this.groupData = JSON.parse(JSON.stringify(this.data.groups));
      await this.getJackDel(this.data.device[0]);
      this.editGroupIndex = null;
      this.holeData = null;
      this.holeNames = [];
      this.data.groups.map(g => {
        let cls = 0;
        if (g.record) {
          cls = g.record.state;
        }
        this.holeNames.push({ name: g.name, cls });
      });
      localStorage.setItem(this.appS.userInfo.nameId, JSON.stringify(
        {
          project: this.data.project,
          component: this.data.component,
          selectBridge: this.data.id,
          editGroupName: null
        }));
      // {
      //   project: null,
      //   component: null,
      //   selectBridge: null,
      //   editGroupName: null
      // }
      // this.startBaseSub();
    } else {
      console.log('aaaaaaaaaaaaaaaaaaaaaaa');
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
  /**
   * *切换张拉组
   */
  onHoleRadio(name) {
    if (this.edit || !this.data.id) { return; }
    if (this.holeSub$) {
      this.holeSub$.unsubscribe();
      this.holeSub$ = null;
    }
    this.holeData = this.groupData.filter((g, i) => {
      if (g.name === name) {
        this.editGroupIndex = i;
        this.editGroupName = name;
      }
      return g.name === name;
    })[0];
    console.log('切换张拉组', name, this.groupData, this.editGroupIndex, this.holeData);
    // this.taskDataDom.holeForm.reset(data);
    this.taskDataDom.createHoleform(this.holeData, this.jackData);
    // this.taskDataDom.tensionStageArrF();
    if (this.holeSub$ === null) {
      this.holeSub$ = this.taskDataDom.holeForm.valueChanges.subscribe((s) => {
        // console.log('编辑2监控', s);
        this.edit = true;
        this.appS.edit = true;
      });
    }
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
  async getJackDel(id) {
    this.jackData = await this.db.jack.filter(j => j.id === id).first();
    // this.db.jack.filter(j => j.id === id).first().then((jack: Jack) => {
    //   this.jackData = jack;
    //   console.log(this.jackData);
    // });
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

  /** 启动基础数据修改监听 */
  startBaseSub() {
    this.editGroupIndex = null;
    this.holeData = null;
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

  /**
   * *手动分组
   */
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
      this.message.error('请选择设备与构建😔！');
      return;
    }
    // this.componentChange();
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
        tensionStage: 3,
        stage: [10, 20, 50, 100, 0, 0, 0],
        time: [30, 30, 30, 300, 0, 0, 0],
        returnMm: 6,
        twice: false,
        super: false,
      };
      taskModeStr[this.group.mode].map(d => {
        taskBase[d] = {
          kn: [0, 0, 0, 0, 0, 0, 0],
          wordMm: 4,
        };
        if (d.indexOf('zA') > -1 || d.indexOf('zB') > -1 || d.indexOf('zC') > -1 || d.indexOf('zD') > -1) {
          taskBase[d].theoryMm = 0;
        }
      });
      this.groupData.push(taskBase);
    });
    this.validateForm.controls.holeRadio.setValue(this.group.g);
    this.holeNames = [];
    this.group.g.map(g => {
      this.holeNames.push({ name: g, cls: 0 });
    });
    console.log(this.holeNames, this.group.g);
    console.log(this.groupData);
    this.groupIsVisible = false;
  }

  /** 保存数据 */
  async save() {
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
    if (this.data &&  this.data.id) {
      const value = this.taskDataDom.holeForm.value;
      this.holeData = value;
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
      const r = await this.odb.addAsync(tableName.task, this.data,
        (t: TensionTask) => t.project === this.data.project && t.component === this.data.component && t.name === this.data.name);
      if (r.success) {
        this.message.success('添加成功🙂');
        this.edit = false;
        this.appS.edit = false;
        this.menu.selectComponent = null;
        this.routeData = {
          project: this.data.project,
          component: this.data.component,
          selectBridge: r.id,
          editGroupName: null
        };
        this.goRouteHole();
      } else {
        this.message.error('添加失败😔');
        console.log('添加失败😔', r.msg);
      }
    } else {
      const r = await this.odb.updateAsync(tableName.task, this.data,
        (t: TensionTask) => t.project === this.data.project
        && t.component === this.data.component && t.name === this.data.name && t.id !== this.data.id);
      if (r.success) {
        this.message.success('修改成功🙂');
        this.edit = false;
        this.appS.edit = false;
        this.menu.selectComponent = null;
        this.routeData = {
          project: this.data.project,
          component: this.data.component,
          selectBridge: this.data.id,
          editGroupName: this.editGroupName
        };
        this.goRouteHole();
      } else {
        this.message.error(`修改失败😔`);
        console.log(r.msg);
      }
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
    this.holeNames = [];
    this.onMenubridge(null);
  }
  /** 修改 */
  modification() {
    this.appS.edit = true;
  }
  /** 复制 */
  copy() {
    const copy: TensionTask = Object.assign(JSON.parse(JSON.stringify(this.data)), { id: null, name: null });
    for (const c of copy.groups) {
      delete c.record;
    }
    console.log('复制', copy);
    this.onMenubridge(null, copy);
  }
  /**
   * *张拉
   */
  tension() {
    this.tensionDevice.state = true;
    // console.log('张拉', this.holeData, this.jackData, this.PLCS.mpaRevise, this.PLCS.jack);
    // if (this.tensionDeviceState()) {
    //   this.tensionDevice.state = true;
    //   this.tensionDevice.names = taskModeStr[this.holeData.mode];
    //   console.log('记录', 'record' in this.holeData);
    // } else {
    //   // await this.PLCS.selectJack(this.jackData.id);
    //   localStorage.setItem('autoTask', JSON.stringify({
    //     project: this.project.id,
    //     component: this.menu.selectComponent,
    //     id: this.data.id,
    //     jackId: this.jackData.id,
    //     groupData: this.holeData
    //   }));
    //   this.tensionDevice.state = false;
    //   this.router.navigate(['/auto']);
    // }
    localStorage.setItem('autoTask', JSON.stringify({
      project: this.project.id,
      component: this.menu.selectComponent,
      id: this.data.id,
      jackId: this.jackData.id,
      groupData: this.holeData
    }));
    this.tensionDevice.state = false;
    this.router.navigate(['/auto']);
  }
  /** 检查设备状态 */
  tensionDeviceState(): boolean {
    if (!this.PLCS.plcState.z) {
      return true;
    }
    if (this.holeData.mode !== 'A1' && this.holeData.mode !== 'B1' && !this.PLCS.plcState.c) {
      return true;
    }
    let s = false;
    for (const name of taskModeStr[this.holeData.mode]) {
      console.log(this.PLCS.PD[name].alarm, this.PLCS.PD[name].state);
      this.tensionDevice[name] = null;
      if (Number(this.holeData[name].kn[this.holeData.tensionStage]) < 2) {
        this.tensionDevice[name] = '最终张拉压力不能 < 2Mpa';
        s = true;
        break;
      }
      for (let index = 1; index < this.holeData.tensionStage; index++) {
        const i0 = Number(this.holeData[name].kn[index - 1]);
        const i1 = Number(this.holeData[name].kn[index]);
        console.log(i0, '>=', i1, '=', i0 >= i1);
        if ((i0 > i1) || i0 > 56 || i1 > 56) {
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
    const value = this.validateForm.value.component;
    // this.validateForm.controls.component.setValue(value);
    console.log('选择component', value[0]);
    this.componentOptions.holes = this.componentOptions.menu.filter(f => f.name === value[0])[0];
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
