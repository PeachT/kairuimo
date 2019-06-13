import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
import { RepetitionARV } from 'src/app/Validator/async.validator';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.less']
})
export class UserComponent implements OnInit {
  dbName = 'users';
  @ViewChild('leftMenu')
  leftMenu: LeftMenuComponent;
  formGroup: FormGroup;
  data: User;

  constructor(
    private fb: FormBuilder,
    private db: DbService,
    private message: NzMessageService,
    public appS: AppService,
    private router: Router,
    private modalService: NzModalService,
    public PLCS: PLCService,
  ) {
  }

  ngOnInit() {

    this.carterFormGroup();
  }
  carterFormGroup() {
    this.formGroup = this.fb.group({
      id: [],
      name: [null, [Validators.required], [new RepetitionARV(this.db, 'jack')]],
      password: [null, [Validators.required]],
      jurisdiction: [0],
    });
  }

  onMneu(data: User) {
    console.log('一条数据', data);
    this.data = data;
    this.carterFormGroup();
    this.formGroup.setValue(this.data);
  }

  /**
   * *编辑
   */
  edit(data) {
    if (!data) {
      data = copyAny(this.data);
      delete data.id;
    }
    this.data = data;
    console.log(this.data, data);
    this.carterFormGroup();
    this.formGroup.setValue(this.data);
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

}
