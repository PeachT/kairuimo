import { Injectable, ChangeDetectorRef } from '@angular/core';

import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, RoutesRecognized } from '@angular/router';
import { Subject } from 'rxjs';
import { LoginUser } from '../models/user.models';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';

@Injectable({ providedIn: 'root' })
export class AppService {
  /** 软件信息 */
  public info = {
    version: '0.0.24',
    unit: {
      name: '柳州市凯瑞姆',
      tel: '888-8888888',
      logo: 'assets/img/logo.png'
    }
  };
  /** 运行环境是否是Electron */
  public Environment: boolean;
  /** 登录的用户信息 */
  public userInfo: LoginUser;
  /** 当前路由主路径 */
  public nowUrl = '';
  /** 当前路由参数 */
  public nowRoute = null;
  /** 编辑状态 */
  public edit = false;
  /** 数据导入导出 */
  dataTreatingShow = false;
  /** 调试 */
  debugShow = false;

  public powerState = false;
  public powerDelay = 5;
  public powerDelayT = null;
  public powerText = null;
  public menus = [];
  public leftMenu = null;
  public editId = null;

  constructor(
    private router: Router,
    private e: ElectronService,
    private message: NzMessageService,
  ) {
    const info = JSON.parse(localStorage.getItem('unitInfo'));
    if (!info) {
      localStorage.setItem('unitInfo', JSON.stringify(this.info.unit));
    } else {
      this.info.unit = info;
    }
  }
  // /** 搜索事件 */
  // private plcSub = new Subject();
  // // 获得一个Observable;
  // plcSubject = this.plcSub.asObservable();
  // // 发射数据，当调用这个方法的时候，Subject就会发射这个数据，所有订阅了这个Subject的Subscription都会接受到结果
  // // loading true为启用loading,false为关闭loading
  // public onPlcSub(data) {
  //   this.plcSub.next(data);
  // }

  public power(mode: boolean) {
    this.powerText = mode ? '关机' : '重启';
    console.log(this.powerText);
    this.powerDelay = 5;
    this.powerDelayT = setInterval(() => {
      this.powerDelay = --this.powerDelay;
      console.log(this.powerDelay);
      if (this.powerDelay <= 0) {
        // this.e.ipcRenderer.send('power', mode);
        clearTimeout(this.powerDelayT);
        this.e.ipcRenderer.send('power', mode);
      }
    }, 1000);
  }

  /**
   * * 键盘s
   */
  public onKeyboard(data) {
    this.e.ipcRenderer.send('showKeyboard', data);
  }
  public usb() {
    this.e.ipcRenderer.send('usb-umount');
    this.e.ipcRenderer.once('usb-umount', (event, data) => {
      if (data) {
        this.message.error('U盘正在使用中!!');
      } else {
        this.message.success('U盘已卸载');
      }
    });
  }

  sss(v) {
    console.log(v);
  }
}
