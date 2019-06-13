import { Component, OnInit, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
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
import { copyAny } from 'src/app/models/base';
import { LeftMenuComponent } from 'src/app/shared/left-menu/left-menu.component';
import { RepetitionARV } from 'src/app/Validator/async.validator';

@Component({
  selector: 'app-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComponentComponent implements OnInit {
  dbName = 'comp';
  @ViewChild('leftMenu')
  leftMenu: LeftMenuComponent;

  formGroup: FormGroup;
  data: Comp;

  get formArr(): FormArray {
    return this.formGroup.get('hole') as FormArray;
  }

  tags = ['Unremovable', 'Tag 2', 'Tag 3'];
  inputVisible = false;
  inputValue = '';
  @ViewChild('inputElement') inputElement: ElementRef;

  constructor(
    private fb: FormBuilder,
    private db: DbService,
    private message: NzMessageService,
    public appS: AppService,
  ) {
  }

  ngOnInit() {
    this.createFormGroup();
  }
  createFormGroup() {
    this.formGroup = this.fb.group({
      id: [],
      name: [null, [Validators.required], [new RepetitionARV(this.db, 'comp')]],
      hole: this.fb.array(
        this.holeForm()
      )
    });
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
      holes: [null, [Validators.required]],
      /** 图片 */
      ImgBase64: [],
    });
  }

  onMneu(data: Comp) {
    console.log('一条数据', data);
    this.data = data;
    this.createFormGroup();
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
    this.createFormGroup();
    this.formGroup.setValue(this.data);
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


  addHole() {
    // tslint:disable-next-line:no-angle-bracket-type-assertion
    const control = <FormArray> this.formGroup.controls.hole;
    control.push(this.createHoleForm());
    this.data = this.formGroup.value;
  }
  /**
   * *删除梁型
   * @param index 序号
   */
  delHole(index = null, event) {
    console.log('删除构建梁', index, event, event.x);
    if (index === null || event.x === 0) {
      return;
    }
    // tslint:disable-next-line:no-angle-bracket-type-assertion
    const control = <FormArray> this.formGroup.controls.hole;
    control.removeAt(index);
    this.data = this.formGroup.value;
  }

  handleClose(form: FormControl, tag): void {
    const v = form.value || [];
    console.log(tag, v);
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
    const iv = event.target.value.replace(/\s+/g, '');
    console.log(iv, iv.length);
    if (iv.length <= 0) {
      return;
    }
    const v = form.value || [];
    // console.log(event, form, v);
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
