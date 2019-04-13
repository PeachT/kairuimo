import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AsyncValidatorFn,
         AbstractControl, ValidationErrors, FormArray } from '@angular/forms';
import { DB, DbService, tableName } from 'src/app/services/db.service';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { PLCService } from 'src/app/services/PLC.service';
import { map } from 'rxjs/operators';
import { reperitionValidator } from 'src/app/Validator/repetition.validator';
import { Comp } from 'src/app/models/component';

@Component({
  selector: 'app-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.less']
})
export class ComponentComponent implements OnInit {
  formGroup: FormGroup;
  db: DB;
  data: Comp;

  menu = {
    datas: [],
    select: null,
  };
  get formArr(): FormArray {
    return this.formGroup.get('hole') as FormArray;
  }

  tags = ['Unremovable', 'Tag 2', 'Tag 3'];
  inputVisible = false;
  inputValue = '';
  @ViewChild('inputElement') inputElement: ElementRef;

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
    this.createFormGroup();
  }
  createFormGroup() {
    this.formGroup = this.fb.group({
      id: [],
      name: [null, [Validators.required], [this.nameRepetition()]],
      hole: this.fb.array(
        this.holeForm()
      )
    });
  }
  /** 异步验证 */
  nameRepetition(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      console.log('777777', control);
      return from(this.odb.repetition(tableName.comp,
        (item: Comp) => item.name === control.value &&
          item.id !== control.root.value.id)).pipe(
            map(item => {
              return item ? { reperition: `${control.value} 已存在!!` } : null;
            }),
          );
    };
  }
  /** 孔form */
  holeForm() {
    console.log(!this.data);
    if (this.data) {
      return this.data.hole.map(() => {
        return this.createHoleForm();
      });
    }
    return [this.createHoleForm()];
  }
  createHoleForm() {
    return this.fb.group({
      /** 名字 */
      name: [null, [Validators.required, reperitionValidator('hole')]],
      /** 孔明细 */
      holes: [],
      /** 图片 */
      ImgBase64: [],
    });
  }

  getMneu(): Promise<void> {
    // tslint:disable-next-line:no-unused-expression
    return new Promise((resolve, reject) => {
      this.db.comp.toArray().then((d) => {
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
      this.db.comp.filter(a => a.id === id).first().then((p: Comp) => {
        this.data = p;
        this.createFormGroup();
        console.log(this.data);
        console.log(this.formArr);
        this.formGroup.setValue(this.data);
        console.log(this.formArr);
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
          hole: [
            {
              name: null,
              ImgBase64: null,
              holes: []
            }
          ],
        };
        this.createFormGroup();
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
      this.odb.add(tableName.comp, data, (p: Comp) => p.name === data.name).subscribe((r) => {
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
      this.odb.update(tableName.comp, data, (p: Comp) => p.name === data.name && data.id !== p.id).subscribe((r) => {
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
  /** 取消编辑 */
  cancelEdit() {
    const m = this.modalService.warning({
      nzTitle: '确定取消编辑吗？',
      nzContent: '放弃本次数据编辑，数据不会更改！',
      nzCancelText: '继续编辑',
      nzOnOk: () => {
        this.appS.edit = false;
        this.data = null;
        this.createFormGroup();
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
  addHole() {
    // tslint:disable-next-line:no-angle-bracket-type-assertion
    const control = <FormArray> this.formGroup.controls.hole;
    control.push(this.createHoleForm());
    this.data = this.formGroup.value;
  }
  subHole(index) {
    // tslint:disable-next-line:no-angle-bracket-type-assertion
    const control = <FormArray> this.formGroup.controls.hole;
    control.removeAt(index);
    this.data = this.formGroup.value;
  }

  handleClose(form: FormControl, tag): void {
    const v = form.value || [];
    console.log(tag, v)
    const tags = v.filter(f => f !== tag);
    form.setValue(tags);
  }

  sliceTagName(tag: string): string {
    const isLongTag = tag.length > 20;
    return isLongTag ? `${tag.slice(0, 20)}...` : tag;
  }

  showInput(): void {
    this.inputVisible = true;
    setTimeout(() => {
      this.inputElement.nativeElement.focus();
    }, 10);
  }

  handleInputConfirm(event, form: FormControl): void {
    const iv = event.target.value;
    const v = form.value || [];
    console.log(event, form, v);
    if (v.indexOf(iv) === -1) {
      // this.tags = [...this.tags, this.inputValue];
      form.setValue([...v, iv]);
      event.target.value = null;
    } else {
      this.message.error('孔号已存在');
    }
    // this.inputValue = '';
    // this.inputVisible = false;
  }
  ss() {
    console.log(this.data);
    this.formGroup.setValue(this.data);
  }
}
