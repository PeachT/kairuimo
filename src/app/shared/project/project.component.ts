import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Project } from 'src/app/models/project';
import { NzMessageService } from 'ng-zorro-antd';
import { reperitionValidator } from 'src/app/Validator/repetition.validator';
import { RepetitionARV } from 'src/app/Validator/async.validator';
import { DbService } from 'src/app/services/db.service';
import { AppService } from 'src/app/services/app.service';
import { from, Observable } from 'rxjs';
import { map, catchError, every, first } from 'rxjs/operators';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectComponent implements OnInit {
  validateForm: FormGroup;
  @Input()
  data: Project = null;
  projcetOtherKey = [
    '分布工程',
    '施工单位',
    '分项工程',
    '单位工程',
    '工程部位',
    '合同段',
    '桩号范围',
  ];

  get formArr(): FormArray {
    return this.validateForm.get('supervisions') as FormArray;
  }
  get otherInforFormArr(): FormArray {
    return this.validateForm.get('otherInfo') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private db: DbService,
    public appS: AppService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.createForm();
    console.log(this.formArr.controls);
  }
  /** 手动更新 */
  markForCheck() {
    this.changeDetectorRef.markForCheck();
  }

  createForm() {
    console.log('000000');
    this.validateForm = this.fb.group({
      id: [],
      name: [null, [Validators.required], [new RepetitionARV(this.db, 'project')]],
      /** 监理 */
      supervisions: this.fb.array(this.supervisionsForm()),
      /** 其他信息 */
      otherInfo: this.fb.array(this.otherInfoForm())
    });
  }
  supervisionsForm() {
    if (this.data) {
      return this.data.supervisions.map(() => {
        return this.createSuperVisionsForm();
      });
    }
    return [this.createSuperVisionsForm()];
  }
  /** 监理form */
  createSuperVisionsForm() {
    return this.fb.group({
      /** 名字 */
      name: [null, [Validators.required, reperitionValidator('supervisions')]],
      /** 监理公司 */
      unit: [null, [Validators.required]],
      /** 联系方式 */
      phone: [],
      /** 头像 */
      ImgBase64: [],
    });
  }
  /** 其他信息 */
  otherInfoForm() {
    if (this.data && this.data.otherInfo && this.data.otherInfo.length > 0) {
      return this.data.otherInfo.map(() => {
        return this.otherInfoVisionsForm();
      });
    } else {
      return [this.otherInfoVisionsForm()];
    }
  }
  /** 其他form */
  otherInfoVisionsForm() {
    return this.fb.group({
      /** 名字 */
      key: [null, [Validators.required, reperitionValidator('otherInfo', 'key')]],
      /** 内容 */
      value: [null, [Validators.required]],
    });
  }

  ngSubmit() {
    console.log('13123123123');
  }
  /** 保存数据 */
  save(callpack) {
    if (!this.validateForm.valid) {
      console.log(this.validateForm.valid);
      this.message.error('数据填写有误！！');
      return;
    }
    callpack(this.validateForm.value);
  }
  /** 重置数据 */
  reset(data: Project) {
    this.data = data;
    this.createForm();
    this.validateForm.reset(data);
    this.markForCheck();
  }
  add() {
    // tslint:disable-next-line:no-angle-bracket-type-assertion
    const control = <FormArray> this.validateForm.controls.supervisions;
    control.push(this.createSuperVisionsForm());
    this.data = this.validateForm.value;
  }
  sub(index) {
    // tslint:disable-next-line:no-angle-bracket-type-assertion
    const control = <FormArray> this.validateForm.controls.supervisions;
    control.removeAt(index);
    this.data = this.validateForm.value;
  }
  otherInfoAdd() {
    // tslint:disable-next-line:no-angle-bracket-type-assertion
    const control = <FormArray> this.validateForm.controls.otherInfo;
    control.push(this.otherInfoVisionsForm());
    this.data = this.validateForm.value;
  }
  otherInfoSub(index) {
    // tslint:disable-next-line:no-angle-bracket-type-assertion
    const control = <FormArray> this.validateForm.controls.otherInfo;
    control.removeAt(index);
    this.data = this.validateForm.value;
  }
  ccc() {
    this.validateForm.clearAsyncValidators();
    this.validateForm.clearValidators();
  }

  projcetOtherKeySelect() {
    const arr = this.otherInforFormArr.value.map(v => v.key);
    return this.projcetOtherKey.filter(v =>  arr.indexOf(v) === -1 );
  }
}
