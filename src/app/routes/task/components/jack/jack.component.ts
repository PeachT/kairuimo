import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Jack, taskModeStr } from 'src/app/models/jack';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'task-jack',
  templateUrl: './jack.component.html',
  styleUrls: ['./jack.component.less']
})
export class JackComponent implements OnInit {
  @Input()
    data: Jack;

  jackForm: FormGroup;
  taskModeStr = [];

  constructor(private fb: FormBuilder,) { }

  ngOnInit() {
    console.log(this.data);
    this.jackForm = this.fb.group({
      name: ['1'],
      jackMode: [2],
      equation: [1],
      jackModel: [],
      pumpModel: [],
      zA: this.createDevGroup(),
      zB: this.createDevGroup(),
      zC: this.createDevGroup(),
      zD: this.createDevGroup(),
      cA: this.createDevGroup(),
      cB: this.createDevGroup(),
      cC: this.createDevGroup(),
      cD: this.createDevGroup(),
    });
    this.taskModeStr = taskModeStr('AB8');
    this.jackForm.reset(this.data);
    this.jackForm.disable();
  }

  /** 创建设备标定from */
  createDevGroup() {
    return this.fb.group({
      jackNumber: [],
      pumpNumber: [],
      a: [],
      b: [],
      date: [],
      mpa: this.fb.array([0, 1, 2, 3, 4, 5]),
      mm: this.fb.array([0, 1, 2, 3, 4, 5]),
    });
  }

}
