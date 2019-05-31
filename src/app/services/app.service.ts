import { Injectable } from '@angular/core';

import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, RoutesRecognized } from '@angular/router';
import { Subject } from 'rxjs';
import { LoginUser } from '../models/user.models';
import { ElectronService } from 'ngx-electron';

@Injectable({ providedIn: 'root' })
export class AppService {
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
  /** 搜索事件 */
  private sharchSub = new Subject();
  public powerState = false;
  public powerDelay = 5;
  public powerDelayT = null;
  public powerText = null;
  public menus = [];

  constructor(
    private router: Router,
    private e: ElectronService,
    ) {
  }
  // 获得一个Observable;
  sharch = this.sharchSub.asObservable();

  // 发射数据，当调用这个方法的时候，Subject就会发射这个数据，所有订阅了这个Subject的Subscription都会接受到结果
  // loading true为启用loading,false为关闭loading
  public onSharch(name: string) {
    this.sharchSub.next(name);
  }

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
      }
    }, 1000);
  }

  /**
   * * 键盘
   */
  public onKeyboard() {
    this.e.ipcRenderer.send('onKdNumber');
  }
}
