import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { AppService } from './services/app.service';
import { DbService, DB } from './services/db.service';
import { NzMessageService } from 'ng-zorro-antd';
import { User } from './models/user.models';
import { Router, NavigationEnd } from '@angular/router';
import { PLCService } from './services/PLC.service';
import { DateFormat } from './Function/DateFormat';
import { Jack } from './models/jack';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  title = 'kvm-zl';
  s1 = null;
  s2 = null;
  db: DB;
  time = (DateFormat(new Date(), 'MM-dd hh:mm:ss'));

  constructor(
    private e: ElectronService,
    private odb: DbService,
    public appService: AppService,
    private message: NzMessageService,
    private router: Router,
    public PLCS: PLCService,
  ) {
    // 判断运行环境适合是 Electron
    this.appService.Environment = navigator.userAgent.indexOf('Electron') !== -1;
    this.db = this.odb.db;
    /** 添加管理员 */
    this.db.users.count().then((data) => {
      console.log('获取用户数量', data);
      if (data === 0) {
        const user: User = {
          name: 'kvm',
          password: 'kvmadmin',
          jurisdiction: 9
        };
        this.db.users.add(user).then(() => {
          this.message.success('添加成功🙂');
        }).catch(() => {
          this.message.error('添加失败😔');
        });
      }
    }).catch((error) => {
      console.log('数据库错误！！', error);
    });
    /** 添加顶 */
    this.db.jack.count().then((data) => {
      console.log('获取用户数量', data);
      if (data === 0) {
        for (let index = 0; index < 5; index++) {
          const jack: Jack = {
            name: `未命名${index}`,
            jackMode: 2,
            equation: null,
            jackModel: null,
            pumpModel: null,
            zA: {
              jackNumber: null,
              pumpNumber: null,
              upper: 180,
              floot: 105,
              a: 1,
              b: 0,
              date: null,
              mm: [1, 1, 1, 1, 1, 1],
            },
            zB: {
              jackNumber: null,
              pumpNumber: null,
              upper: 180,
              floot: 105,
              a: 1,
              b: 0,
              date: null,
              mm: [1, 1, 1, 1, 1, 1],
            },
            zC: {
              jackNumber: null,
              pumpNumber: null,
              upper: 180,
              floot: 105,
              a: 1,
              b: 0,
              date: null,
              mm: [1, 1, 1, 1, 1, 1],
            },
            zD: {
              jackNumber: null,
              pumpNumber: null,
              upper: 180,
              floot: 105,
              a: 1,
              b: 0,
              date: null,
              mm: [1, 1, 1, 1, 1, 1],
            },
            cA: {
              jackNumber: null,
              pumpNumber: null,
              upper: 180,
              floot: 105,
              a: 1,
              b: 0,
              date: null,
              mm: [1, 1, 1, 1, 1, 1],
            },
            cB: {
              jackNumber: null,
              pumpNumber: null,
              upper: 180,
              floot: 105,
              a: 1,
              b: 0,
              date: null,
              mm: [1, 1, 1, 1, 1, 1],
            },
            cC: {
              jackNumber: null,
              pumpNumber: null,
              upper: 180,
              floot: 105,
              a: 1,
              b: 0,
              date: null,
              mm: [1, 1, 1, 1, 1, 1],
            },
            cD: {
              jackNumber: null,
              pumpNumber: null,
              upper: 180,
              floot: 105,
              a: 1,
              b: 0,
              date: null,
              mm: [1, 1, 1, 1, 1, 1],
            },
          };
          this.db.jack.add(jack).then(() => {
            this.message.success('添加成功🙂');
          }).catch(() => {
            this.message.error('添加失败😔');
          });
        }
      }
    }).catch((error) => {
      console.log('数据库错误！！', error);
    });
    // this.router.events.filter((event) => event instanceof NavigationEnd)
    //   .subscribe((event: NavigationEnd) => {
    //     // do something
    //   console.log(event);
    // });
    router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        if (!this.appService.userInfo) {
          // this.router.navigate(['/login']);
        }
        console.log(event);
        this.appService.nowUrl = event.url;
      }
    });

    // this.e.ipcRenderer.on('PLCConnection', (event, data) => {
    //   console.log(data);
    // });
  }

  ngOnInit() {
    if (this.appService.Environment) {
      console.log('在 Electron 中运行');
      // 监听主进程
      this.e.ipcRenderer.on('message', (event, message) => {
        alert(message);
      });
      this.e.ipcRenderer.on('isUpdateNow', (event, message) => {
        this.s1 = '下载完成';
        alert('下载完成');
        this.e.ipcRenderer.send('isUpdateNow');
      });
      this.e.ipcRenderer.on('downloadProgress', (event, message) => {
        this.s2 = message;
      });
      // 更新请求
      // this.e.ipcRenderer.send('update');
      setInterval(() => {
        this.time = (DateFormat(new Date(), 'MM-dd hh:mm:ss'));
      }, 1000);
      this.PLCS.PLCobservble.subscribe(() => {
        // console.log('123132');
      });
    }
    const ips = document.getElementsByTagName('input');
    // tslint:disable-next-line: prefer-for-of
    for (let index = 0; index < ips.length; index++) {
      console.log('djflsjdf', ips[index]);
    }
  }

  onClick() {
    this.e.ipcRenderer.send('coil');
  }

  offClick() {
    this.e.ipcRenderer.send('offCoil');
  }

  updateClick() {
    this.e.ipcRenderer.send('update');
  }
  power(mode) {
    // this.appService.powerState = false;
    this.appService.power(mode);

  }
  loginOut() {
    this.appService.powerState = false;
    this.router.navigate(['/login']);
  }
  cancle() {
    console.log('取消');
    clearTimeout(this.appService.powerDelayT);
    this.appService.powerDelayT = null;
  }
}
