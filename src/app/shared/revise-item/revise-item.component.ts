import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { ManualItemComponent } from '../manual-item/manual-item.component';
import { PLCService } from 'src/app/services/PLC.service';

@Component({
  selector: 'app-revise-item',
  templateUrl: './revise-item.component.html',
  styleUrls: ['./revise-item.component.less']
})
export class ReviseItemComponent implements OnInit {
  @ViewChild('manual', null) manualDom: ManualItemComponent;

  @Input()
    name: string;
  @Input()
    reviseName: string;
  @Input()
    reviseData = [0, 1, 2, 3, 4, 5];

  revise = {
    state: false,
    devValue: null,
    measureValue: null,
    value: null,
  };
  setIndex = null;
  plcName = 'showMpa';

  setForm = this.fb.group({
    setValue: this.fb.array([0, 1, 2, 3, 4, 5]),
  });

  setData = {
    setMpa: 0,
    setMm: 0,
    setUn: 0
  };
  setStage: Array<string>;

  constructor(
    private fb: FormBuilder,
    public PLCS: PLCService,
  ) {
  }

  ngOnInit() {
    console.log(this.name);
    this.plcName = this.reviseName === 'mpa' ? 'showMpa' : 'showMm';
    this.setStage = this.reviseName === 'mpa' ?
    ['5Mpa', '15Mpa', '25Mpa', '35Mpa', '45Mpa', '55Mpa'] :
    ['20mm', '60mm', '100mm', '140mm', '180mm', '220mm'];
    console.log(this.reviseData);
    this.setForm = this.fb.group({
      setValue: this.fb.array(this.reviseData),
    });
  }

  cancel() {
    this.revise.state = false;
  }
  setMpa(value) {
    this.manualDom.dev[this.reviseName] = value;
  }
  setMm(i) {
    this.setIndex = i;
    if (this.reviseName === 'mpa') {
      const setMpa = i * 10 + 5;
      this.manualDom.set(this.manualDom.setAeeress[0], setMpa, 'mpa');
      this.revise.devValue = setMpa;
    } else {
      const setMm = i * 40 + 20;
      this.manualDom.set(this.manualDom.setAeeress[1], setMm);
      this.revise.devValue = setMm;
    }
    this.revise.measureValue = 0;
    this.countRevise();
  }
  /** 计算校正值 */
  countRevise() {
    console.log(this.revise.devValue + this.revise.measureValue);
    this.revise.value = (this.revise.devValue / (Number(this.revise.devValue) + Number(this.revise.measureValue))).toFixed(5);
  }
  // /** 获取设备值 */
  // getDevValue() {
  //   if (this.reviseName === 'mpa') {
  //     this.revise.devValue = this.PLCS.PD[this.name][this.plcName];
  //   } else {
  //     this.revise.devValue = this.PLCS.PD[this.name][this.plcName] - this.manualDom.zero;
  //   }
  //   this.countRevise();
  // }
  /** 确认校正值 */
  reviseOk() {
    const d = this.setForm.value.setValue;
    d[this.setIndex] = this.revise.value;
    this.setForm.controls.setValue.setValue(d);
  }
  setMeasureValue(value) {
    value = this.reviseName === 'mpa' ? value : value * 10;
    this.revise.measureValue = (Number(this.revise.measureValue) + Number(value)).toFixed(2);
    this.countRevise();
  }
}
