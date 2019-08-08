import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DB, DbService } from 'src/app/services/db.service';
import { NzMessageService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { User } from 'src/app/models/user.models';
import { Router } from '@angular/router';
import { randomWord } from 'src/app/Function/randomWord';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.less'],
})
export class HelpComponent implements OnInit {
  update = {
    state: false,
    msg: '正在更新',
    sucess: 0,
    cancel: false,
    time: 0,
    files: null,
    selectFile: null,
    start: false,
    fileMsg: null,
  };
  testMsg: null;
  get powerDelay(): number {
    return this.appS.powerDelay;
  }

  constructor(
    public appS: AppService,
    private fb: FormBuilder,
    private odb: DbService,
    private message: NzMessageService,
    private router: Router,
    public e: ElectronService,
    private cdr: ChangeDetectorRef,
  ) {

  }

  ngOnInit() {
    console.log(this.update);
  }

  onUpdate() {
    this.update.state = true;
    this.e.ipcRenderer.send('select-file', 'select-file-out');

    this.e.ipcRenderer.once('select-file-out', (event, data) => {
      console.log(data);
      this.update.files = data.stdout;
      this.update.fileMsg = data;
      this.cdr.markForCheck();
    });

  }
  runUpdate() {
    console.log(this.update.selectFile);
    this.update.start = true;
    this.e.ipcRenderer.send('local-update', this.update.selectFile);
    const it = setInterval(() => {
      this.update.time ++;
      if (this.update.time > 120) {
        clearTimeout(it);
        this.update.msg = '更新失败！2分钟未更新完成！更新超时，请重启！';
        this.e.ipcRenderer.removeAllListeners('onUpdate');
        this.update.sucess = 2;
        return;
      }
      this.cdr.markForCheck();
    }, 1000);
    this.e.ipcRenderer.once('onUpdate', (event, data) => {
      clearTimeout(it);
      // stdout
      // stderr
      console.log(data);
      if (!data.stderr) {
        if (data.stdout.indexOf('不存在') !== -1) {
          this.update.msg = '未找到更新文件';
          this.update.sucess = 3;
        } else {
          this.update.msg = '更新成功，需重启！';
          this.update.sucess = 1;
        }
      } else {
        this.update.msg = data.stderr;
        this.update.sucess = 2;
      }
      this.cdr.markForCheck();
      return;
    });
  }
  onCancel() {
    this.update = {
      state: false,
      msg: '正在更新...',
      sucess: 0,
      cancel: false,
      time: 0,
      files: null,
      selectFile: null,
      start: false,
      fileMsg: null,
    };
  }
  power(mode) {
    // this.appService.powerState = false;
    this.appS.power(mode);

  }
  loginOut() {
    this.appS.powerState = false;
    this.router.navigate(['/login']);
  }
  cancle() {
    console.log('取消');
    clearTimeout(this.appS.powerDelayT);
    this.appS.powerDelayT = null;
  }

  test(value) {
    this.e.ipcRenderer.send('test', { data: value, out: 'test'});

    this.e.ipcRenderer.once('test', (event, data) => {
      this.testMsg = data;
      this.cdr.markForCheck();
    });
  }
  /** 打开天使面板 */
  openDevTools() {
    this.e.ipcRenderer.send('openDevTools');
  }
  /** 选择更新文件 */
  getUpdateFile() {
    this.update.selectFile = this.e.remote.dialog.showOpenDialog({properties: ['openFile'],
      filters: [{ name: 'KVM更新文件', extensions: ['kvm'] }]
    })[0];
  }
  /** 设置软件端 */
  setPlatform() {
    const pf = localStorage.getItem('platform');
    if (pf === 'devices') {
      localStorage.setItem('platform', '');
    } else {
      localStorage.setItem('platform', 'devices');
    }
    this.appS.platform = localStorage.getItem('platform');
  }
}
