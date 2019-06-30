import { Component, OnInit, ViewChild, ViewContainerRef, ComponentFactoryResolver, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { DB, DbService } from 'src/app/services/db.service';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { User } from 'src/app/models/user.models';
import { Router } from '@angular/router';
import { GroupItem, TensionTask } from 'src/app/models/task.models';
import { Observable } from 'rxjs';
import { Jack, deviceGroupMode } from 'src/app/models/jack';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D } from 'src/app/models/IPCChannel';
import { ManualComponent } from '../manual/manual.component';
import { JackItemComponent } from 'src/app/shared/jack-item/jack-item.component';
import { LeftMenuComponent } from 'src/app/shared/left-menu/left-menu.component';
import { copyAny } from 'src/app/models/base';
import { nameRepetition } from 'src/app/Validator/async.validator';

@Component({
  selector: 'app-jack',
  templateUrl: './jack.component.html',
  styleUrls: ['./jack.component.less']
})
export class JackComponent implements OnInit {
  dbName = 'jack';
  @ViewChild('leftMenu', {static: false}) leftMenu: LeftMenuComponent;
  @ViewChild('device', {static: false}) deviceDom: ViewContainerRef;

  formData: FormGroup;
  data: Jack;
  deleteShow = false;

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private db: DbService,
    public appS: AppService,
    public PLCS: PLCService,
    private cfr: ComponentFactoryResolver,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
    this.createJackForm();
  }
  createJackForm() {
    this.formData = this.fb.group({
      id: [],
      name: [null, [Validators.required], [nameRepetition(this.db, 'jack')]],
      jackMode: [null],
      equation: [false],
      jackModel: [],
      pumpModel: [],
      // zA: this.createDevGroup(),
      // zB: this.createDevGroup(),
      // zC: this.createDevGroup(),
      // zD: this.createDevGroup(),
      // cA: this.createDevGroup(),
      // cB: this.createDevGroup(),
      // cC: this.createDevGroup(),
      // cD: this.createDevGroup(),
    });
  }
  reset() {
    if (this.formData.value.jackMode !== null) {
      console.log(this.formData.value.jackMode);
      this.data = Object.assign(this.data, this.formData.value);
    }
    this.createJackForm();
    deviceGroupMode[this.data.jackMode].map(key => {
      this.formData.addControl(key, this.createDevGroup());
    });
    console.log(this.data);
    this.formData.reset(this.data);
    this.f5();
    // tslint:disable-next-line:forin
    for (const i in this.formData.controls) {
      this.formData.controls[i].markAsDirty();
      this.formData.controls[i].updateValueAndValidity();
    }
  }
  /** 创建设备标定from */
  createDevGroup() {
    return this.fb.group({
      jackNumber: [null, [Validators.required]],
      pumpNumber: [null, [Validators.required]],
      upper: [225, [Validators.required]],
      floot: [10, [Validators.required]],
      a: [1, [Validators.required]],
      b: [0, [Validators.required]],
      date: [null, [Validators.required]],
      mpa: this.fb.array([0, 1, 2, 3, 4, 5]),
      mm: this.fb.array([0, 1, 2, 3, 4, 5]),
    });
  }
  onMneu(data: Jack) {
    console.log('一条数据', data);
    this.data = data;
    this.reset();
  }

  /**
   * *编辑
   */
  edit(data) {
    if (!data) {
      data = copyAny(this.data);
      data.id = null;
    }
    this.data = data;
    console.log(this.data, data);
    this.reset();
    this.leftMenu.markForCheck();
  }
  /**
   * *编辑完成
   */
  editOk(id) {
    console.log(id);
    if (id) {
      this.leftMenu.getMenuData(id);
    } else {
      this.leftMenu.onClick();
    }
  }

  /** 删除 */
  async delete() {
    const id = this.appS.leftMenu;
    const count = await this.db.db.task.filter(t => t.device[0] === id).count();
    if (count === 0) {
      this.deleteShow = true;
      this.cdr.markForCheck();
      console.log('删除', id, '任务', count, this.deleteShow);
    } else {
      this.message.error(`有 ${count} 条任务在该项目下，不允许删除！`);
    }
  }
  async deleteOk(state = false) {
    if (state) {
      const msg = await this.db.db.jack.delete(this.appS.leftMenu);
      console.log('删除了', msg);
      this.appS.leftMenu = null;
      this.leftMenu.getMenuData();
    }
    this.deleteShow = false;
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
      this.formData.reset(this.data);
    });
  }
  /** 获取手动数据 */
  savePLC(dev: string = 'z', address: number, value) {
    this.PLCS.ipcSend(`${dev}F016_float`, address, value);
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
  f5() {


    this.deviceDom.clear();
    deviceGroupMode[this.formData.value.jackMode].map(name => {
      const com = this.cfr.resolveComponentFactory(JackItemComponent);
      const comp = this.deviceDom.createComponent(com);
      comp.instance.formGroup = this.formData;
      comp.instance.name = name;
      console.log('添加', name);
    });
  }
  getForm() {
    console.log(this.formData.value);
    // tslint:disable-next-line: forin
    for (const i in this.formData.controls) {
      this.formData.controls[i].markAsDirty();
      this.formData.controls[i].updateValueAndValidity();
      console.log(i, this.formData.controls[i].valid);
    }
  }
}
