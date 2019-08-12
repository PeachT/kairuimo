import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { AppService } from './services/app.service';
import { DbService, DB } from './services/db.service';
import { NzMessageService } from 'ng-zorro-antd';
import { User } from './models/user.models';
import { Router, NavigationEnd } from '@angular/router';
import { PLCService } from './services/PLC.service';
import { DateFormat } from './Function/DateFormat';
import { Jack } from './models/jack';
import { getModelBase } from './models/base';
import { Project } from './models/project';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  title = 'kvm-zl';
  s1 = null;
  s2 = null;
  db: DB;
  keyboardState = true;

  constructor(
    public e: ElectronService,
    private odb: DbService,
    public appS: AppService,
    private message: NzMessageService,
    private router: Router,
    public PLCS: PLCService,
  ) {
    console.log('平台', this.appS.platform);
    if (this.e.isWindows) {
      this.PLCS.lock = {
        state: true,
        success: false,
        code: null,
      };
    } else if (this.e.isLinux) {
      if (this.appS.platform === '') {
        localStorage.setItem('platform', 'devices');
      }
      if (!this.appS.platform || this.appS.platform === 'devices') {
        this.runPLC();
      }
    }
    // 判断运行环境适合是 Electron
    this.appS.Environment = navigator.userAgent.indexOf('Electron') !== -1;
    this.db = this.odb.db;
    /** 添加管理员 */
    this.db.users.count().then((data) => {
      console.log('获取用户数量', data);
      if (data === 0) {
        const user: User = {
          name: 'admin',
          password: 'adminPeach',
          jurisdiction: 9,
          operation: []
        };
        this.db.users.add(user).then(() => {
          this.message.success('添加成功🙂');
        }).catch(() => {
          this.message.error('添加失败😔');
        });
        const user2: User = {
          name: '技术员',
          password: '123465',
          jurisdiction: 1,
          operation: []
        };
        this.db.users.add(user2).then(() => {
          this.message.success('添加成功🙂');
        }).catch(() => {
          this.message.error('添加失败😔');
        });
        for (let index = 0; index < 10; index++) {
          const user1: User = {
            name: `kvmadmin${index}`,
            password: 'kvmadmin',
            jurisdiction: 8,
            operation: []
          };
          this.db.users.add(user1).then(() => {
            this.message.success('添加成功🙂');
          }).catch(() => {
            this.message.error('添加失败😔');
          });
        }
      }
    }).catch((error) => {
      console.log('数据库错误！！', error);
    });
    /** 添加测试项目 */
    this.db.project.count().then((data) => {
      console.log('获取项目数量', data);
      if (data === 0) {
        const project: Project = getModelBase('project');
        project.name = '测试项目';
        project.jurisdiction = 8;
        delete project.id;
        this.db.project.add(project).then(() => {
          this.message.success('添加测试项目成功🙂');
        }).catch((err) => {
          console.log(err);
          this.message.error('项目添加失败😔');
        });
      }
    }).catch((error) => {
      console.log('数据库错误！！', error);
    });
    /** 添加顶 */
    // this.db.jack.count().then((data) => {
    //   console.log('获取用户数量', data);
    //   if (data === 0) {
    //     const jack: Jack = getModelBase('jack');
    //     jack.name = '测试顶';
    //     this.db.jack.add(jack).then(() => {
    //       this.message.success('添加成功🙂');
    //     }).catch(() => {
    //       this.message.error('添加失败😔');
    //     });
    //   }
    // }).catch((error) => {
    //   console.log('数据库错误！！', error);
    // });

    router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        if (!this.appS.userInfo) {
          // this.router.navigate(['/login']);
        }
        console.log(event);
        this.appS.nowUrl = event.url;
      }
    });

  }
  runPLC() {
    const lastTime = Number(localStorage.getItem('lastTime'));
    const nowTime = new Date().getTime();
    if (nowTime < lastTime) {
      this.appS.lock = true;
    } else {
      this.PLCS.runSocket();
    }
  }
  ngOnInit() {
    let keyboard = JSON.parse(localStorage.getItem('keyboard'));
    if (!keyboard) {
      console.log('没有数据');
      keyboard = {
        number: {
          w: 240,
          h: 320
        },
        text: {
          w: 660,
          h: 320
        },
      };
      localStorage.setItem('keyboard', JSON.stringify(keyboard));
    }
    if (this.appS.Environment) {
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
      // 弹出键盘
      // document.body.addEventListener('focus', (event: any) => {
      //   keyboard = JSON.parse(localStorage.getItem('keyboard'));
      //   let type = event.target.type;
      //   // console.log('键盘', type, event);
      //   if (type === 'password') {
      //     type = 'text';
      //   }

      //   // console.log('0000111112222233333', event, document.body.clientWidth , document.body.clientHeight );
      //   if ((type === 'number' || type === 'text') && event.target.classList[0] !== 'ant-calendar-picker-input'
      //     && event.target.classList[0] !== 'ant-calendar-range-picker-input') {
      //     let keyType = type;
      //     if (type === 'number' && event.target.min < 0) {
      //       keyType = 'signed_number';
      //     }
      //     let topmag = type === 'text' ? 130 : 30;
      //     const kwh = keyboard[type];
      //     // 获取元素绝对位置
      //     const rect = event.target.getBoundingClientRect();
      //     let x = Math.round(rect.x + window.screenLeft);
      //     let y = Math.round(rect.y + rect.height + window.screenTop + topmag);

      //     const drx = document.body.clientWidth + window.screenLeft;
      //     const dry = document.body.clientHeight + window.screenTop;

      //     const krx = x + kwh.w;
      //     const kry = y + kwh.h;

      //     x = krx - drx > 0 ? drx - kwh.w : x;
      //     topmag = 0;
      //     if (type === 'text') {
      //       topmag = dry - rect.y - rect.height > 150 ? 0 : 130;
      //       console.log(dry - rect.y - rect.height);
      //     }
      //     y = kry - dry > 0 ? rect.y + window.screenTop - kwh.h - topmag : y;

      //     console.log('打开键盘', keyType);
      //     event.target.select();
      //     this.appService.onKeyboard({ type: keyType, x, y, w: kwh.w, h: kwh.h });
      //   }
      // }, true);
      // 键盘显示|隐藏
      document.body.addEventListener('click', (event: any) => {
        if (event.target.localName !== 'input') {
          if (this.keyboardState) {
            this.keyboardState = false;
            console.log('隐藏键盘', event.target.localName);
            this.appS.onKeyboard({ type: 'text', x: -10000, y: -10000, w: 0, h: 0 });
          }
        } else {
          console.log('键盘', event, event.target.disabled, event.target.readOnly);
          if (event.target.disabled || event.target.readOnly) {
            if (this.keyboardState) {
              this.keyboardState = false;
              console.log('隐藏键盘', event.target.localName);
              this.appS.onKeyboard({ type: 'text', x: -10000, y: -10000, w: 0, h: 0 });
            }
            return;
          }
          this.keyboardState = true;
          keyboard = JSON.parse(localStorage.getItem('keyboard'));
          let type = event.target.type;
          // console.log('键盘', type, event);
          if (type === 'password') {
            type = 'text';
          }

          // console.log('0000111112222233333', event, document.body.clientWidth , document.body.clientHeight );
          if ((type === 'number' || type === 'text') && event.target.classList[0] !== 'ant-calendar-picker-input'
            && event.target.classList[0] !== 'ant-calendar-range-picker-input') {
            let keyType = type;
            if (type === 'number' && event.target.min < 0) {
              keyType = 'signed_number';
            }
            let topmag = type === 'text' ? 130 : 30;
            const kwh = keyboard[type];
            // 获取元素绝对位置
            const rect = event.target.getBoundingClientRect();
            let x = Math.floor(rect.x + window.screenLeft);
            let y = Math.floor(rect.y + rect.height + window.screenTop + topmag);

            const drx = document.body.clientWidth + window.screenLeft;
            const dry = document.body.clientHeight + window.screenTop;

            const krx = x + kwh.w;
            const kry = y + kwh.h;

            x = Math.floor(krx - drx > 0 ? drx - kwh.w : x);
            topmag = 0;
            if (type === 'text') {
              topmag = dry - rect.y - rect.height > 150 ? 0 : 130;
              console.log(dry - rect.y - rect.height);
            }
            y = Math.floor(kry - dry > 0 ? rect.y + window.screenTop - kwh.h - topmag : y);

            console.log('打开键盘', keyType);
            event.target.select();
            this.appS.onKeyboard({ type: keyType, x, y, w: kwh.w, h: kwh.h });
          }
        }
      }, true);
    } else {
      this.PLCS.lock = {
        state: true,
        success: false,
        code: null,
      };
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
}
