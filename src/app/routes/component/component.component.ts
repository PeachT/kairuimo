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
import { RepetitionARV, nameRepetition } from 'src/app/Validator/async.validator';

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

  formData: FormGroup;
  data: Comp;

  get formArr(): FormArray {
    return this.formData.get('hole') as FormArray;
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
    this.formData = this.fb.group({
      id: [],
      name: [null, [Validators.required], [nameRepetition(this.db, 'comp')]],
      hole: this.fb.array(
        this.holeForm()
      )
    });
  }
  reset() {
    // this.createFormGroup();
    this.formData.setControl('hole', this.fb.array(this.holeForm()));
    this.formData.setValue(this.data);
    // tslint:disable-next-line:forin
    for (const i in this.formData.controls) {
      this.formData.controls[i].markAsDirty();
      this.formData.controls[i].updateValueAndValidity();
    }
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
    this.reset();
  }
  /**
   * * 编辑
   */
  edit(data) {
    if (!data) {
      data = copyAny(this.data);
      data.id = null;
    }
    this.data = data;
    console.log(this.data, data);
    this.reset();
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
    const control = <FormArray> this.formData.controls.hole;
    control.push(this.createHoleForm());
    this.data = this.formData.value;
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
    const control = <FormArray> this.formData.controls.hole;
    control.removeAt(index);
    this.data = this.formData.value;
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
    this.formData.setValue(this.data);
  }
}
