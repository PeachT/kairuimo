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
  @ViewChild('manual')
    manualDom: ManualItemComponent;

  @Input()
    name: string;
  @Input()
    reviseName: string;

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
  ) {}

  ngOnInit() {
    console.log(this.name);
    this.plcName = this.reviseName === 'mpa' ? 'showMpa' : 'showMm';
    this.setStage = this.reviseName === 'mpa' ?
    ['5Mpa', '15Mpa', '25Mpa', '35Mpa', '45Mpa', '55Mpa'] :
    ['20mm', '60mm', '100mm', '140mm', '180mm', '220mm'];
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
      this.manualDom.dev.setMpa = i * 10 + 5;
    } else {
      this.manualDom.dev.setMm = i * 40 + 20;
    }
  }

  countRevise() {
    this.revise.value = this.revise.devValue / this.revise.measureValue;
  }
  /** 获取设备值 */
  getDevValue() {
    if (this.reviseName === 'mpa') {
      this.revise.devValue = this.PLCS.PD[this.name][this.plcName];
    } else {
      this.revise.devValue = this.PLCS.PD[this.name][this.plcName] - this.manualDom.zero;
    }
    this.countRevise();
  }
  /** 确认校正值 */
  reviseOk() {
    const d = this.setForm.value.setValue;
    d[this.setIndex] = this.revise.value;
    this.setForm.controls.setValue.setValue(d);
  }
}
