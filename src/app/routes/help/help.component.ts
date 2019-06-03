import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./help.component.less']
})
export class HelpComponent implements OnInit {
  update = {
    state: false,
    msg: '正在更新',
    sucess: 0,
    cancel: false,
    time: 0
  };

  constructor(
    public appS: AppService,
    private fb: FormBuilder,
    private odb: DbService,
    private message: NzMessageService,
    private router: Router,
    private e: ElectronService,
  ) {

  }

  ngOnInit() {
    console.log(this.update);
  }

  onUpdate() {
    this.update.state = true;
    this.e.ipcRenderer.send('local-update', 'onUpdate');
    const it = setInterval(() => {
      this.update.time ++;
      if (this.update.time > 500) {
        clearTimeout(it);
        this.update.msg = '更新超时，更新失败！请重启！';
        this.e.ipcRenderer.removeAllListeners('onUpdate');
        this.update.sucess = 2;
        return;
      }
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
      return;
    });
  }
  onCancel() {
    this.update = {
      state: false,
      msg: '正在更新',
      sucess: 0,
      cancel: false,
      time: 0
    };
  }
}
