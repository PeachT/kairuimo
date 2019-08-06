import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DbService } from 'src/app/services/db.service';
import { NzFormatEmitEvent, NzTreeComponent } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { ElectronService } from 'ngx-electron';
import { PLCService } from 'src/app/services/PLC.service';
import { Elongation } from 'src/app/models/live';
import { TensionMm, mpaToKN, mpaToKNSingle } from 'src/app/Function/device.date.processing';
import { taskModeStr } from 'src/app/models/jack';
import { NzMessageService } from 'ng-zorro-antd';
import { DateFormat } from 'src/app/Function/DateFormat';
import { utf8_to_b64 } from 'src/app/Function/stringToBase64';

@Component({
  selector: 'app-data-treating',
  templateUrl: './data-treating.component.html',
  styleUrls: ['./data-treating.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTreatingComponent implements OnInit {
  @ViewChild('taskTerr', null) taskTerr: NzTreeComponent;
  exportMode = null;
  savePath = null;
  tempPath = null;
  progress = {
    state: false,
    msg: '导出',
    length: null,
    now: 0,
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
    sb: []
  };
  template = {
    state: false,
    files: null,
    selectFile: null,
    start: false,
    fileMsg: null,
  };
  upanState = {
    path: null,
    msg: null,
    state: false,
  };

  constructor(
    private message: NzMessageService,
    private cdr: ChangeDetectorRef,
    private db: DbService,
    public apps: AppService,
    public e: ElectronService,
    private PLCS: PLCService,
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
        this.getTemplate();
        this.getTaskProject();
        break;
      case 2:
        this.getUpan();
        this.getTaskProject();
        break;
      case 3:
        this.message.warning('功能没有实现');
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
  /** 选择保存路径 */
  selectSavePath() {
    this.savePath = this.e.remote.dialog.showOpenDialog({properties: ['openDirectory']})[0];
    console.log(this.savePath);
  }
  /** 获取模板路径 */
  selectTemp() {
    this.tempPath = this.e.remote.dialog.showOpenDialog({properties: ['openFile'],
      filters: [{ name: '模板', extensions: ['kvmt'] }]
    })[0];
    this.createSavePath();
    // let obj = null;
    // if (this.e.isWindows) {
    //   obj = this.tempPath.lastIndexOf(`\\`);
    // } else if (this.e.isLinux) {
    //   obj = this.tempPath.lastIndexOf(`/`);
    // }
    // this.savePath = this.tempPath.substr(0, obj);
    // console.log(obj, this.savePath);
  }
  radioSelectTemp() {
    console.log(this.template.selectFile);
    this.tempPath = this.template.selectFile;
    this.createSavePath();
  }
  createSavePath() {
    let obj = null;
    if (this.e.isWindows) {
      obj = this.tempPath.lastIndexOf(`\\`);
    } else if (this.e.isLinux) {
      obj = this.tempPath.lastIndexOf(`/`);
    }
    this.savePath = this.tempPath.substr(0, obj);
    console.log(obj, this.savePath);
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
  /** 获取任务梁数据 */
  async getTaskBridge() {
    this.taskData.bridge = await this.db.getTaskBridgeMenuData(
      (o1) => o1.project === this.taskData.sp && o1.component === this.taskData.sc);
    console.log(this.taskData.bridge);
    this.cdr.markForCheck();
  }
  /** 选择梁 */
  setBridge(b) {
    const {id} = b;
    const index = this.taskData.sb.indexOf(id);
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
    console.log(this.exportMode);
    switch (this.exportMode) {
      case 1:
        this.derivedExcel();
        break;
      case 2:
        this.dataEX();
        break;
      case 3:
        this.message.warning('功能没有实现');
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
    const jack = await this.db.db.jack.filter(j => j.id === data.device[0]).first();
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
        } else {
          this.derivedExcel();
        }
      } else {
        this.progress.msg = '导出错误';
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
      } else {
        this.progress.msg = '导出错误';
        console.log(data);
      }
      this.cdr.markForCheck();
      console.log('导出', data);
    });
  }
}
