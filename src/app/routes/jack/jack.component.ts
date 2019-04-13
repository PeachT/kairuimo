import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { DB, DbService } from 'src/app/services/db.service';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { User } from 'src/app/models/user.models';
import { Router } from '@angular/router';
import { GroupItem, TensionTask } from 'src/app/models/task.models';
import { Observable } from 'rxjs';
import { Jack } from 'src/app/models/jack';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D } from 'src/app/models/IPCChannel';
import { ManualComponent } from '../manual/manual.component';

// const jackFromBase = {
//   jackNumber: [],
//   pumpNumber: [],
//   a: [],
//   b: [],
//   date: ['2019/03/17'],
//   mpa: this.fb.array([0, 1, 2, 3, 4, 5]),
//   mm: this.fb.array([0, 1, 2, 3, 4, 5]),
// };

@Component({
  selector: 'app-jack',
  templateUrl: './jack.component.html',
  styleUrls: ['./jack.component.less']
})
export class JackComponent implements OnInit {
  jackForm: FormGroup;
  data: Jack;
  db: DB;

  menu = {
    datas: [],
    select: null,
  };

  constructor(
    private fb: FormBuilder,
    private odb: DbService,
    private message: NzMessageService,
    public appS: AppService,
    private router: Router,
    private modalService: NzModalService,
    public PLCS: PLCService,
  ) {
    this.db = this.odb.db;
  }

  ngOnInit() {
    this.getMneu();
    this.db.jack.count().then((data) => {
      console.log('获取用户数量', data);
      if (data === 0) {
        for (let index = 0; index < 5; index++) {
          const jack: Jack = {
            name: `未命名${index}`,
            jackMode: null,
            equation: null,
            jackModel: null,
            pumpModel: null,
            zA: {
              jackNumber: null,
              pumpNumber: null,
              a: null,
              b: null,
              date: null,
              mm: [],
            },
            zB: {
              jackNumber: null,
              pumpNumber: null,
              a: null,
              b: null,
              date: null,
              mm: [],
            },
            zC: {
              jackNumber: null,
              pumpNumber: null,
              a: null,
              b: null,
              date: null,
              mm: [],
            },
            zD: {
              jackNumber: null,
              pumpNumber: null,
              a: null,
              b: null,
              date: null,
              mm: [],
            },
            cA: {
              jackNumber: null,
              pumpNumber: null,
              a: null,
              b: null,
              date: null,
              mm: [],
            },
            cB: {
              jackNumber: null,
              pumpNumber: null,
              a: null,
              b: null,
              date: null,
              mm: [],
            },
            cC: {
              jackNumber: null,
              pumpNumber: null,
              a: null,
              b: null,
              date: null,
              mm: [],
            },
            cD: {
              jackNumber: null,
              pumpNumber: null,
              a: null,
              b: null,
              date: null,
              mm: [],
            },
            eAddress: index * 100,
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
    // this.getMenuOne();
    this.createJackForm();
    // this.startBaseSub();
  }
  createJackForm() {
    this.jackForm = this.fb.group({
      name: ['1'],
      jackMode: [2],
      equation: [1],
      jackModel: [],
      pumpModel: [],
      zA: this.createDevGroup(),
      zB: this.createDevGroup(),
      zC: this.createDevGroup(),
      zD: this.createDevGroup(),
      cA: this.createDevGroup(),
      cB: this.createDevGroup(),
      cC: this.createDevGroup(),
      cD: this.createDevGroup(),
    });
  }
  /** 创建设备标定from */
  createDevGroup() {
    return this.fb.group({
      jackNumber: [],
      pumpNumber: [],
      a: [],
      b: [],
      date: [],
      mpa: this.fb.array([0, 1, 2, 3, 4, 5]),
      mm: this.fb.array([0, 1, 2, 3, 4, 5]),
    });
  }

  getMneu() {
    this.db.jack.toArray().then((d) => {
      console.log(d);
      this.menu.datas = d.map(item => {
        return { name: item.name, eAddress: item.eAddress, id: item.id };
      });
    });
  }
  onMneu(id) {
    console.log(id);
    if (this.menu.select !== id) {
      this.menu.select = id;
      this.db.jack.filter(a => a.id === id).first().then((jack: Jack) => {
        console.log(jack);
        if (jack) {
          this.data = jack;
          this.getPLCData('z', (id - 1) * 100);
          this.getPLCData('c', (id - 1) * 100);
        } else {
          this.message.error('获取数据失败😔');
        }
      }).catch(() => {
      });
    }
  }

  /** 获取顶设置数据 */
  getPLCData(dev: string = 'z', address: number) {
    this.PLCS.ipcSend(`${dev}F03`, PLC_D(2000 + address), 100).then((data: any) => {
      console.log(`${dev}返回的结果`, data);
      this.data.jackMode = Math.round(data.float[0]);
      this.data.equation = Math.round(data.float[1]);

      this.data[`${dev}A`].mm = data.float.slice(5, 11);
      this.data[`${dev}A`].a = data.float[11];
      this.data[`${dev}A`].b = data.float[12];
      this.data[`${dev}A`].date = this.nd(data.float[13]);

      this.data[`${dev}B`].mm = data.float.slice(15, 21);
      this.data[`${dev}B`].a = data.float[21];
      this.data[`${dev}B`].b = data.float[22];
      this.data[`${dev}B`].date = this.nd(data.float[23]);

      this.data[`${dev}C`].mm = data.float.slice(25, 31);
      this.data[`${dev}C`].a = data.float[31];
      this.data[`${dev}C`].b = data.float[32];
      this.data[`${dev}C`].date = this.nd(data.float[33]);

      this.data[`${dev}D`].mm = data.float.slice(35, 41);
      this.data[`${dev}D`].a = data.float[41];
      this.data[`${dev}D`].b = data.float[42];
      this.data[`${dev}D`].date = this.nd(data.float[43]);

      console.log(this.data);
      this.jackForm.reset(this.data);
    });
  }
  /** 获取手动数据 */
  savePLC(dev: string = 'z', address: number, value) {
    this.PLCS.ipcSend(`${dev}F016_float`, address, value);
  }
  /** 修改 */
  modification() {
    this.appS.edit = true;
  }
  /** 取消编辑 */
  cancelEdit() {
    const m = this.modalService.warning({
      nzTitle: '确定取消编辑吗？',
      nzContent: '放弃本次数据编辑，数据不会更改！',
      nzCancelText: '继续编辑',
      nzOnOk: () => {
        this.appS.edit = false;
        this.data = null;
        this.createJackForm();
        if (this.menu.select) {
          this.onMneu(this.menu.select);
        }
        // m.close();
      },
      nzOnCancel: () => { console.log('取消'); }
    });
  }
  /** 保存数据 */
  save() {
    // tslint:disable-next-line:forin
    for (const i in this.jackForm.controls) {
      this.jackForm.controls[i].markAsDirty();
      this.jackForm.controls[i].updateValueAndValidity();
    }
    console.log(this.jackForm.valid);
    if (!this.jackForm.valid) {
      this.message.error('数据填写有误！！');
      return;
    }

    const data: Jack = this.jackForm.value;

    data.id = this.menu.select;
    console.log(data);
    const z = [
      data.jackMode, data.equation, 2, 3, 4,
      ...data.zA.mm, data.zA.a, data.zA.b, this.dn(data.zA.date), 0,
      ...data.zB.mm, data.zB.a, data.zB.b, this.dn(data.zB.date), 0,
      ...data.zC.mm, data.zC.a, data.zC.b, this.dn(data.zC.date), 0,
      ...data.zD.mm, data.zD.a, data.zD.b, this.dn(data.zD.date)
    ];
    // .map(item => {
    //   // tslint:disable-next-line:no-bitwise
    //   return Number(item);
    // });
    const c = [
      data.jackMode, data.equation, 2, 3, 4,
      ...data.cA.mm, data.cA.a, data.cA.b, this.dn(data.cA.date), 0,
      ...data.cB.mm, data.cB.a, data.cB.b, this.dn(data.cB.date), 0,
      ...data.cC.mm, data.cC.a, data.cC.b, this.dn(data.cC.date), 0,
      ...data.cD.mm, data.cD.a, data.cD.b, this.dn(data.cD.date)
    ];
    // .map(item => {
    //   return Number(item);
    // });
    const address = PLC_D(2000 + ((data.id - 1) * 100));
    console.log(z, c, address);
    this.savePLC('z', address, z);
    this.savePLC('c', address, c);
    this.db.jack.update(data.id, data).then((updata) => {
      this.message.success('修改成功🙂');
      this.getMneu();
    }).catch((err) => {
      this.message.error(`修改失败😔${err}`);
    });
  }
  /** 数字时间转时间 */
  nd(data) {
    const d = data.toString();
    console.log(d, d.length);
    if (d.length === 8) {
      return `${d.slice(0, 4)}/${d.slice(4, 6)}/${d.slice(6, 8)}`;
    }
    return null;
  }
  /** 数字时间转时间 */
  dn(date) {
    console.log(date);
    if (date) {
      const y = new Date(date).getFullYear();
      const m = String(new Date(date).getMonth() + 1).padStart(2, '0');
      const d = String(new Date(date).getDate() + 1).padStart(2, '0');
      const n = Number(`${y}${m}${d}`);
      console.log(y, m, d, n);
      return n;
    }
    return 0;
  }
}
