import { Component, OnInit, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import {
  FormGroup, FormControl, FormBuilder, Validators, AsyncValidatorFn,
  AbstractControl, ValidationErrors, FormArray
} from '@angular/forms';
import { DB, DbService, tableName } from 'src/app/services/db.service';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D } from 'src/app/models/IPCChannel';
import { ManualComponent } from '../manual/manual.component';
import { map } from 'rxjs/operators';
import { reperitionValidator } from 'src/app/Validator/repetition.validator';
import { User } from 'src/app/models/user.models';
import { LeftMenuComponent } from 'src/app/shared/left-menu/left-menu.component';
import { copyAny } from 'src/app/models/base';
import { nameRepetition } from 'src/app/Validator/async.validator';

const os = ['see'];
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserComponent implements OnInit {
  dbName = 'users';
  @ViewChild('leftMenu' , null) leftMenu: LeftMenuComponent;
  formData: FormGroup;
  data: User;
  deleteShow = false;
  menuFilter = (f) => f.jurisdiction < 8;

  constructor(
    private fb: FormBuilder,
    private db: DbService,
    private message: NzMessageService,
    public appS: AppService,
    private router: Router,
    private modalService: NzModalService,
    public PLCS: PLCService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
    this.carterFormGroup();
  }
  reset() {
    // this.carterFormGroup();
    this.formData.setValue(this.data);
    this.formData.controls.name.updateValueAndValidity();
    // tslint:disable-next-line:forin
    // for (const i in this.formData.controls) {
    //   this.formData.controls[i].markAsDirty();
    // }
  }
  carterFormGroup() {
    this.formData = this.fb.group({
      id: [],
      createdDate: [],
      modificationDate: [],
      user: [],
      name: [null, [Validators.required], [nameRepetition(this.db, 'users')]],
      password: [null, [Validators.required]],
      jurisdiction: [0],
      operation: []
    });
  }

  onMneu(data: User) {
    console.log('一条数据', data);
    this.data = data;
    this.reset();
  }

  /**
   * *编辑
   */
  edit(data) {
    if (!data) {
      this.data.id = null;
    } else {
      this.data = data;
      console.log(this.data, data);
    }
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
  selectOperation(event) {
    // const o = ['see', ...event];
    this.formData.controls.operation.setValue(event);
    console.log(event, this.formData.value.operation);
  }
}
