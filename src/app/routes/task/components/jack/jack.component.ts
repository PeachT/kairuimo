import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Jack, taskModeStr, modeName } from 'src/app/models/jack';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'task-jack',
  templateUrl: './jack.component.html',
  styleUrls: ['./jack.component.less']
})
export class JackComponent implements OnInit {
  @Input() taskJack: Jack;
  @Input() mode: string;
  devModeStr = [];

  constructor() { }

  ngOnInit() {
    this.devModeStr = taskModeStr[this.mode[1]];
    console.log(this.taskJack);
  }
}
