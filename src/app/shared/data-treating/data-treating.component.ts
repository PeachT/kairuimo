import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild, TemplateRef } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DbService } from 'src/app/services/db.service';
import { NzFormatEmitEvent, NzTreeComponent } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { ElectronService } from 'ngx-electron';
import { PLCService } from 'src/app/services/PLC.service';
import { Elongation } from 'src/app/models/live';
import { TensionMm, mpaToKN, mpaToKNSingle } from 'src/app/Function/device.date.processing';
import { taskModeStr, modeName } from 'src/app/models/jack';
import { NzMessageService, NzModalRef, NzModalService } from 'ng-zorro-antd';
import { DateFormat } from 'src/app/Function/DateFormat';
import { utf8_to_b64, b64_to_utf8 } from 'src/app/Function/stringToBase64';
import { TensionTask } from 'src/app/models/task.models';
import { lastDayOfWeek, lastDayOfMonth, startOfWeek, startOfMonth, getTime, compareAsc, compareDesc} from 'date-fns';

@Component({
  selector: 'app-data-treating',
  templateUrl: './data-treating.component.html',
  styleUrls: ['./data-treating.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTreatingComponent implements OnInit {
  @ViewChild('tplTitle', null) tplTitle: TemplateRef<{}>;
  @ViewChild('taskTerr', null) taskTerr: NzTreeComponent;
  exportMode = null;
  savePath = null;
  tempPath = null;
  progress = {
    state: false,
    btnTitle: null,
    msg: '导出',
    length: null,
    now: 0,
    success: false
  };

  taskData = {
    /** 项目列表 */
    project: [],
    sp: null,
    /** 构建列表 */
    component: [],
    sc: null,
    /** 梁列表 */
    bridge: [],
    /** 已选择的梁id */
    sb: [],
    jack: [],
    sj: null,
  };
  template = {
    state: false,
    files: null,
    selectFile: null,
    start: false,
    fileMsg: null,
  };
  inData = {
    state: false,
    files: null,
    selectFile: null,
    selsectPath: null,
    start: false,
    fileMsg: null,
    msg: null
  };
  indatas: Array<TensionTask>;
  selectIndatas: Array<TensionTask>;
  upanState = {
    path: null,
    msg: null,
    state: false,
  };
  /** 顶模式字符串 */
  modeName = modeName;
  inResult = {
    add: [],
    merge: [],
    jump: [],
  };
  /** 修改梁号 */
  nowBridgeName = null;
  filter = {
    pageIndex: 1,
    pageSize: 5,
    ok: false,
    no: false,
    tension: {
      startDate: null,
      entDate: null,
      date: [],
    },
    pouring: {
      startDate: null,
      entDate: null,
      date: [],
    },
    count: 0
  };
  rangesDate = {本周: [startOfWeek(new Date()), lastDayOfWeek(new Date())], 本月: [startOfMonth(new Date()), lastDayOfMonth(new Date())] };

  constructor(
    private message: NzMessageService,
    private cdr: ChangeDetectorRef,
    private db: DbService,
    public apps: AppService,
    public e: ElectronService,
    private PLCS: PLCService,
    private modalService: NzModalService
  ) { }

  ngOnInit() {
  }

  onDataProcessing() {
    this.apps.dataTreatingShow = true;
  }

  dataHandleCancel() {
    this.apps.dataTreatingShow = false;
  }
  dataHandleOk() {
    this.apps.dataTreatingShow = false;
  }
  /** 选择处理模式 */
  selectEM() {
    console.log('选择Mode', this.exportMode, this.e.isWindows);
    switch (this.exportMode) {
      case 1:
        this.progress.btnTitle = '导出';
        this.getTemplate();
        this.getTaskProject();
        break;
      case 2:
        this.progress.btnTitle = '导出';
        this.getUpan();
        this.getTaskProject();
        break;
      case 3:
        this.progress.btnTitle = '导入';
        this.getDbFile();
        break;
      default:
        break;
    }
  }
  /** 获取U盘 */
  getUpan() {
    if (this.e.isLinux) {
      this.e.ipcRenderer.send('get-upan', 'get-upan-back');
      this.upanState.state = true;
      this.e.ipcRenderer.once('get-upan-back', (event, data) => {
        this.upanState.path = data.stdout;
        this.savePath = data.stdout;
        this.upanState.msg = data;
        this.upanState.state = false;
        console.log('获取U盘返回', data);
        this.cdr.markForCheck();
      });
    }
  }
  /** 获取模板 */
  getTemplate() {
    if (this.e.isLinux) {
      this.e.ipcRenderer.send('get-template', 'get-template-back');
      this.e.ipcRenderer.once('get-template-back', (event, data) => {
        console.log(data);
        this.template.files = data.stdout;
        this.savePath = data.stdout;
        this.template.fileMsg = data;
        this.cdr.markForCheck();
      });
    }
  }
  getDbFile() {
    if (this.e.isLinux) {
      this.e.ipcRenderer.send('get-dbfile', 'get-dbfile-back');
      this.e.ipcRenderer.once('get-dbfile-back', (event, data) => {
        console.log(data);
        this.inData.files = data.stdout;
        this.inData.fileMsg = data;
        this.cdr.markForCheck();
      });
    }
  }
  /** 选择保存路径 */
  selectSavePath() {
    this.savePath = this.e.remote.dialog.showOpenDialog({ properties: ['openDirectory'] })[0];
    console.log(this.savePath);
  }
  /** 获取模板路径 */
  selectTemp() {
    this.tempPath = this.e.remote.dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '模板', extensions: ['kvmt'] }]
    })[0];
    this.savePath = this.createSavePath(this.tempPath);
  }
  /** 选择模板文件 */
  radioSelectTemp() {
    console.log(this.template.selectFile);
    this.tempPath = this.template.selectFile;
    this.savePath = this.createSavePath(this.tempPath);
  }
  /** 获取数据文件 */
  selectDb() {
    this.inData.selectFile = this.e.remote.dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '数据文件', extensions: ['db'] }]
    })[0];
    this.inData.selsectPath = this.inData.selectFile;
    if (this.e.isWindows) {
      this.inData.selsectPath = this.inData.selectFile.replace(/\\/g, '/');
    }
    this.inDb();
  }
  /** 选择数据文件 */
  radioSelectDb() {
    this.inDb();
  }
  createSavePath(path: string): string {
    let obj = null;
    if (this.e.isWindows) {
      obj = path.lastIndexOf(`\\`);
    } else if (this.e.isLinux) {
      obj = path.lastIndexOf(`/`);
    }
    return path.substr(0, obj);
  }
  /** 获取项目数据 */
  async getTaskProject() {
    this.taskData.project = await this.db.getTaskDataTreatingProject();
    console.log(this.taskData.project);
    if (this.taskData.project.length === 1) {
      this.taskData.sp = this.taskData.project[0].key;
      this.getTaskComponent();
    } else {
      this.taskData.sp = null;
    }
    this.cdr.markForCheck();
  }
  /** 选择任务项目 */
  selectTaskProject(e) {
    console.log(this.taskData.sp, e);
    this.getTaskComponent();
  }
  /** 获取任务构建数据 */
  async getTaskComponent() {
    const project = this.taskData.sp;
    this.taskData.component = await this.db.getTaskComponentMenuData(o1 => o1.project === Number(project));
    console.log(this.taskData.component);
    if (this.taskData.component.length === 1) {
      this.taskData.sc = this.taskData.component[0];
      this.getTaskBridge();
    } else {
      this.taskData.sc = null;
    }
    this.cdr.markForCheck();
  }
  /** 选择构建 */
  selectTaskComponent(e) {
    console.log(this.taskData.sp, e);
    this.getTaskBridge();
  }
  /** 选择顶 */
  selectTaskJack(e) {
    this.selectIndatas = this.indatas.filter(t => t.jack.name === this.taskData.sj);
    console.log(this.taskData.sj, e, this.selectIndatas);
    this.cdr.markForCheck();
  }
  /** 获取任务梁数据 */
  async getTaskBridge() {
    // this.taskData.bridge = await this.db.getTaskBridgeMenuData(
    //   (o1) => o1.project === this.taskData.sp && o1.component === this.taskData.sc);
    // console.log(this.taskData.bridge);
    // this.cdr.markForCheck();

    const bridge = await this.db.getTaskBridgeMenuData(
      (o1) => {
        if (o1.project !== this.taskData.sp || o1.component !== this.taskData.sc) {
          return false;
        }
        if (this.filter.ok) {
          if (!this.filter.tension.startDate) {
            return true;
          } else if ( o1.startDate >= this.filter.tension.startDate && o1.startDate <= this.filter.tension.entDate) {
            return true;
          }
        }
        // 86400000 时间戳24小时 ms
        if (this.filter.pouring.startDate
          && (
            (getTime(o1.otherInfo[0].value) < this.filter.pouring.startDate + 86400000
            || getTime(o1.otherInfo[0].value) > this.filter.pouring.entDate + 86400000)
            )) {
          return false;
        }
        if (!this.filter.no && !this.filter.ok) {
          return true;
        }
        if (this.filter.no && !o1.startDate) {
          return true;
        }

        return false;
      },
      false, (this.filter.pageIndex - 1) * this.filter.pageSize, this.filter.pageSize);
    this.taskData.bridge = bridge.menus;
    this.filter.count = bridge.count;
    console.log(this.filter);
    this.cdr.markForCheck();
  }
  /** 选择梁 */
  setBridge(b) {
    const id = b;
    const index = this.taskData.sb.indexOf(id);
    console.log(id, index);
    if (index > -1) {
      // 有则移出
      this.taskData.sb.splice(index, 1);
      // this.onChange(this.model); // 需更新绑定的值
    } else {
      // 无则添加
      this.taskData.sb.push(id);
      // this.onChange(this.model); // 需更新绑定的值
    }
    console.log(this.taskData.sb);
    this.progress.length = this.taskData.sb.length;
    this.cdr.markForCheck();
  }
  /** 过滤 */
  onTaskFliter(e) {
    console.log(e);
  }

  exportOk() {
    switch (this.exportMode) {
      case 1:
        this.derivedExcel();
        break;
      case 2:
        this.dataEX();
        break;
      case 3:
        this.message.warning('功能没有实现');
        this.inDataRun();
        break;
      default:
        break;
    }
  }

  /** 导出表格 */
  async derivedExcel() {
    const id = this.taskData.sb[this.progress.now];
    if (this.progress.now === 0) {
      this.savePath = `${this.savePath}/${DateFormat(new Date(), 'yyyy年MM月dd日Thh时mm分ss秒')}导出`;
    }
    // this.savePath = this.savePath.replace(new RegExp(/(\\)/g), '/');
    const outdata = {
      record: [],
      data: {
        name: null,
        component: null,
        tensionDate: null,
        project: null,
        bridgeOtherInfo: null
      }
    };
    this.progress.state = true;
    // {mm: 12.25, sumMm: 24.01, percent: -3.96, remm: 17.27}
    console.log(id);
    const data = await this.db.db.task.filter(t => t.id === id).first();
    const project = await this.db.db.project.filter(p => p.id === this.taskData.sp).first();
    outdata.data.name = data.name;
    outdata.data.component = data.component;
    outdata.data.bridgeOtherInfo = data.otherInfo;
    outdata.data.project = project;
    console.log(data, id);
    // const jack = await this.db.db.jack.filter(j => j.id === data.device[0]).first();
    const jack = data.jack;
    const tensionDate = [];
    data.groups.map(g => {
      if (g.record) {
        tensionDate.push(g.record.time[1]);
        const re = TensionMm(g, true);
        const kns = mpaToKN(jack, g.mode, g.record);
        console.log(re);
        const elongation: Elongation = TensionMm(g);
        taskModeStr[g.mode].map(name => {
          outdata.record.push({
            name: g.name,
            devName: name,
            jackNumber: jack[name].jackNumber,
            pumpNumber: jack[name].pumpNumber,
            tensionDate: DateFormat(new Date(g.record.time[1]), 'yyyy-MM-dd hh:mm'),
            mpa: g.record[name].mpa,
            kn: kns[name],
            mm: g.record[name].mm,
            setKn: g.tensionKn,
            theoryMm: g[name].theoryMm,
            lengthM: g.length,
            tensiongMm: elongation[name].sumMm,
            percent: elongation[name].percent,
            wordMm: g[name].wordMm,
            returnMm: g.returnMm,
            returnKn: {
              mpa: g.record[name].reData.map,
              kn: mpaToKNSingle(jack, name, g.record[name].reData.map),
              mm: g.record[name].reData.mm,
              countMm: re[name].remm
            }
          });
        });
      }
    });
    const max = Math.max.apply(null, tensionDate);
    const min = Math.min.apply(null, tensionDate);
    outdata.data.tensionDate = `${DateFormat(new Date(min), 'yyyy-MM-dd hh:mm')} ~ ${DateFormat(new Date(max), 'yyyy-MM-dd hh:mm')}`;
    console.log('处理后的数据', id, outdata);
    // outdata.data = JSON.stringify(outdata.record);
    // const exData = {data: outdata.data, exData: JSON.stringify(outdata.record)};
    console.log('导出的数据', outdata);
    const channel = `ecxel${this.PLCS.constareChannel()}`;
    this.e.ipcRenderer.send('derivedExcel', {
      channel,
      templatePath: this.tempPath,
      outPath: this.savePath,
      data: outdata,
    });
    this.e.ipcRenderer.once(channel, (event, data) => {
      if (data.success) {
        this.progress.now++;
        if (this.progress.now === this.taskData.sb.length) {
          // this.message.success(`导出${count}条完成`);
          this.progress.msg = '导出完成';
          this.progress.success = true;
        } else {
          this.derivedExcel();
        }
      } else {
        this.progress.msg = '导出错误';
        this.progress.success = true;
      }
      this.cdr.markForCheck();
      console.log('导出', data);
    });
    // this.taskData.sb.map(async id => {

    // });
  }
  /** 导出数据 */
  async dataEX() {
    const datas = await this.db.db.task.filter(t => this.taskData.sb.indexOf(t.id) > -1).toArray();
    const strb64 = utf8_to_b64(JSON.stringify(datas));
    console.log('导出数据', datas, strb64);

    this.savePath = `${this.savePath}/${DateFormat(new Date(), 'yyyy年MM月dd日hh时mm分ss秒')}.db`;
    const channel = `ecxel${this.PLCS.constareChannel()}`;
    this.e.ipcRenderer.send('dateEX', {
      channel,
      outPath: this.savePath,
      data: strb64,
    });
    this.e.ipcRenderer.once(channel, (event, data) => {
      if (data.success) {
        this.progress.msg = '导出完成';
        this.progress.success = true;
      } else {
        this.progress.msg = '导出错误';
        this.progress.success = true;
        console.log(data);
      }
      this.cdr.markForCheck();
      console.log('导出', data);
    });
  }
  async inDb() {
    this.inData.state = true;
    console.log(this.inData.selsectPath);
    const channel = `ecxel${this.PLCS.constareChannel()}`;
    this.e.ipcRenderer.send('indb', {
      channel,
      inPath: this.inData.selsectPath,
    });
    this.e.ipcRenderer.once(channel, async (event, data) => {
      console.log(data);
      if (data.success) {
        this.taskData.project = await this.db.getTaskDataTreatingProject();
        console.log(this.taskData.project);
        if (this.taskData.project.length === 1) {
          this.taskData.sp = this.taskData.project[0].key;
        }
        this.taskData.jack = [];
        await this.db.db.jack.filter(j => j.state).toArray().then(j => {
          j.map(jack => {
            this.taskData.jack.push({ title: jack.name, key: jack.id, mode: jack.jackMode });
          });
        });
        this.indatas = JSON.parse(b64_to_utf8(data.data));
        console.log('导入的文件', data, this.indatas);
        this.inData.state = false;
        this.cdr.markForCheck();
      } else {
        console.log(data);
        this.inData.msg = data.msg;
        this.message.error('获取数据错误');
        this.inData.state = false;
        this.cdr.markForCheck();
      }
    });
  }
  async inDataRun() {
    if (!this.taskData.sp) {
      this.message.error('请选择项目');
      return;
    }
    if (!this.taskData.sj) {
      this.message.error('请选择顶');
      return;
    }
    // tslint:disable-next-line: no-shadowed-variable
    const task = this.indatas.filter(t => t.id === this.taskData.sb[this.progress.now])[0];

    // 获取是否有数据
    const t = await this.db.inRepetitionAsync(
      (o1: TensionTask) => o1.name === task.name && task.project === o1.project && task.component === o1.component);
    if (t) {
      console.log(t, task);
      if (t.name === task.name && t.createdDate === task.createdDate) {
        if (t.modificationDate !== task.modificationDate) {
          task.id = t.id;
          await this.db.inUpdateAsync(task).then(data => {
            this.progress.now++;
            if (this.progress.now === this.taskData.sb.length) {
              // this.message.success(`导出${count}条完成`);
              this.progress.msg = '导出完成';
              this.progress.success = true;
            }
            console.log('覆盖导入', task);
            this.inResult.merge.push(task.name);
            this.cdr.markForCheck();
            this.inDataRun();
          });
        } else {
          this.injump(task);
        }
      } else {
        this.nowBridgeName = task.name;
        const modal: NzModalRef = this.modalService.create({
          nzTitle: '千斤顶不一致',
          // nzContent: '千斤顶名称模式不一致不能导入',
          nzContent: this.tplTitle,
          nzClosable: false,
          nzMaskClosable: false,
          nzFooter: [
            {
              label: '跳过这一条',
              shape: 'default',
              type: 'danger',
              onClick: () => {
                modal.destroy();
                this.injump(task);
                return;
              }
            },
            {
              label: '修改添加',
              shape: 'default',
              type: 'primary',
              onClick: () => {
                // modal.destroy();
                task.name = this.nowBridgeName;
                console.log(task, this.selectIndatas);
                modal.destroy();
                this.inDataRun();
                return;
              }
            },
          ]
        });
      }
    } else {
      this.inadd(task);
    }
    console.log('159753122222222222222222222222222222222222');
  }
  async inadd(task: TensionTask) {
    delete task.id;
    task.project = this.taskData.sp;
    console.log(task);
    await this.db.inAddTaskAsync(task).then(data => {
      this.inResult.add.push(task.name);
      console.log('添加导入', task);
      this.progress.now++;
      if (this.progress.now === this.taskData.sb.length) {
        // this.message.success(`导出${count}条完成`);
        this.progress.msg = '导出完成';
        this.progress.success = true;
      }
      this.cdr.markForCheck();
      this.inDataRun();
    });
  }
  injump(task: TensionTask) {
    this.progress.now++;
    if (this.progress.now === this.taskData.sb.length) {
      // this.message.success(`导出${count}条完成`);
      this.progress.msg = '导出完成';
      this.progress.success = true;
    }
    console.log('跳过导入', task);
    this.inResult.jump.push(task.name);
    this.cdr.markForCheck();
  }

  onFilter() {
    console.log(this.filter);
    this.getTaskBridge();
  }
  onFilterDate(e, key) {
    this.filter[key].startDate = getTime(e[0]);
    this.filter[key].entDate = getTime(e[1]);
    this.filter[key].date = e;
    this.getTaskBridge();
    console.log(e, this.filter);
  }
  paginationChange() {
    console.log(this.filter);
    this.getTaskBridge();
  }
}
