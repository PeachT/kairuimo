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

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.less']
})
export class UserComponent implements OnInit {
  formGroup: FormGroup;
  db: DB;
  data: User;

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
    this.carterFormGroup();
  }
  carterFormGroup() {
    this.formGroup = this.fb.group({
      id: [],
      name: [null, [Validators.required], [this.nameRepetition()]],
      password: [null, [Validators.required]],
      jurisdiction: [0],
    });
  }
  /** 异步验证 */
  nameRepetition(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      console.log('777777', control);
      return from(this.odb.repetition(tableName.users,
        (item: User) => item.name === control.value &&
          item.id !== control.root.value.id)).pipe(
            map(item => {
              return item ? { reperition: `${control.value} 已存在!!` } : null;
            }),
          );
    };
  }

  getMneu(): Promise<void> {
    // tslint:disable-next-line:no-unused-expression
    return new Promise((resolve, reject) => {
      this.db.users.filter(f => f.jurisdiction < 9).toArray().then((d) => {
        console.log(d);
        this.menu.datas = d.map(item => {
          return { name: item.name, id: item.id };
        });
        resolve();
      }).catch(() => {
        this.message.error('获取菜单数据错误!!');
        reject();
      });
    });
  }
  onMneu(id, copy = null) {
    console.log('选项目', id);
    console.log(this.menu);
    if ((id !== null && this.menu.select === id) || this.ifEdit()) { return; }
    if (id !== null) {
      this.menu.select = id;
      this.db.users.filter(a => a.id === id).first().then((p: User) => {
        this.data = p;
        this.carterFormGroup();
        console.log(this.data);
        this.formGroup.setValue(this.data);
      }).catch(() => {
      });
    } else {
      this.menu.select = null;
      if (copy) {
        this.data = copy;
      } else {
        this.data = {
          id: null,
          name: null,
          password: null,
          jurisdiction: 0
        };
        this.carterFormGroup();
        this.formGroup.setValue(this.data);
      }
      this.appS.edit = true;
    }
    console.log(this.menu);
  }

  /** 保存数据 */
  save() {
    const data = this.formGroup.value;
    console.log(data, !data.id);
    if (!data.id) {
      delete data.id;
      this.odb.add(tableName.users, data, (p: User) => p.name === data.name).subscribe((r) => {
        if (r !== null) {
          this.message.success('添加成功🙂');
          this.appS.edit = false;
          this.menu.select = null;
          this.getMneu().then(() => {
            this.onMneu(data.id);
          }, (err) => {
            this.message.error('添加失败😔');
            console.log(err);
          });
        }
      });
    } else {
      this.odb.update(tableName.users, data, (p: User) => p.name === data.name && data.id !== p.id)
        .subscribe((r) => {
        if (r !== null) {
          this.message.success('修改成功🙂');
          this.appS.edit = false;
        } else {
          this.message.error(`修改失败😔`);
        }
      }, (err) => {
        this.message.error(`修改错误！😔${err}`);
      });
    }
  }
  /** 取消保存 */
  saveCancel() {
    const m = this.modalService.warning({
      nzTitle: '确定取消编辑吗？',
      nzContent: '放弃本次数据编辑，数据不会更改！',
      nzCancelText: '继续编辑',
      nzOnOk: () => {
        this.appS.edit = false;
        this.data = null;
        // menu.selectComponent
        // menu.selectBridge
        if (this.menu.select) {
          this.onMneu(this.menu.select);
        }
        // m.close();
      },
      nzOnCancel: () => { console.log('取消'); }
    });
  }
  /** 添加 */
  add() {
    this.onMneu(null);
  }
  /** 修改 */
  modification() {
    this.appS.edit = true;
  }

  /** 复制 */
  copy() {
    console.log('复制');
    const copy = Object.assign(JSON.parse(JSON.stringify(this.data)), { name: null });
    delete copy.id;
    this.onMneu(null, copy);
  }

  /** 判断编辑状态 */
  ifEdit(): boolean {
    if (this.appS.edit) {
      this.message.warning('请完成编辑！');
      return true;
    }
    return false;
  }
}
