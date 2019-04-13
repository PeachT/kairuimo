import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { taskModeStr, Jack, tableDev } from 'src/app/models/jack';
import { PLCService } from 'src/app/services/PLC.service';
import { AppService } from 'src/app/services/app.service';

@Component({
  selector: 'app-task-data',
  templateUrl: './task-data.component.html',
  styleUrls: ['./task-data.component.less']
})
export class TaskDataComponent implements OnInit {
  @Input()
  editGroupIndex = null;
  @Input()
    jackData: Jack;

  tensionStageArr = [];
  devModeStr = [];
  holeNames = [];
  theoryIf: any = {
    zA: false,
    zB: false,
    zC: false,
    zD: false,
    cA: false,
    cB: false,
    cC: false,
    cD: false,
  };
  holeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public appS: AppService
  ) { }

  ngOnInit() {
    this.holeForm = this.fb.group({
      name: ['1'],
      mode: [4],
      length: [20],
      tensionKn: [2000],
      steelStrandNumber: [6],
      tensionStage: [3],
      stage: this.fb.array([
        10, 10, 100, 0, 0
      ]),
      returnMm: [6],
      twice: [false],
      zA: this.createDevFrom(),
      zB: this.createDevFrom(),
      zC: this.createDevFrom(),
      zD: this.createDevFrom(),
      cA: this.createDevFrom(),
      cB: this.createDevFrom(),
      cC: this.createDevFrom(),
      cD: this.createDevFrom(),
    });
  }

  /** 创建设备from */
  createDevFrom() {
    return this.fb.group({
      kn: this.fb.array([0, 1, 2, 3, 4, 5]),
      wordMm: [],
      theoryMm: [],
    });
  }
  /** 压力换算计算 */
  inputKn() {
    const kn = this.holeForm.controls.tensionKn.value;
    const stage = this.holeForm.controls.stage.value;
    console.log(kn, stage);

    taskModeStr(this.holeForm.controls.mode.value).map(d => {
      const a = this.jackData[d].a;
      const b = this.jackData[d].b;
      const value = this.holeForm.controls[d].value;
      console.log(d, value);
      stage.map((s, i) => {
        const sp = s / 100;
        console.log('a=', a, 'ap=', sp, 'kn=', kn, 'b=', b);
        if (this.jackData.equation) {
          // Mpa = a * Kn + b;
          value.kn[i] = (a * sp * kn + b).toFixed(2);
        } else {
          // Kn = a * Mpa + b;
          value.kn[i] = ((kn * sp - b) / a).toFixed(2);
        }
      });
      this.holeForm.controls[d].setValue(value);
    });
  }
  /** 阶段修改 */
  inputStage(i) {
    const stage = this.holeForm.controls.stage.value;
    if (i === 0) {
      stage[1] = stage[0] * 2;
      this.holeForm.controls.stage.setValue(stage);
    }
    this.inputKn();
  }
  // 切换张拉段数
  onStage(value) {
    console.log(value);
    console.log(this.holeForm.controls.mode.value);
    this.tensionStageArrF(value);
    const stage = value;
    let stages = [10, 20, 100, 0, 0];
    switch (stage) {
      case 4:
        stages = [10, 10, 50, 100, 0];
        break;
      case 5:
        stages = [10, 10, 50, 80, 100];
        break;
      default:
        break;
    }
    this.holeForm.controls.stage.setValue(stages);
    this.inputKn();
  }
  // 切换二次张拉
  onTwice(value) {
    if (value) {
      this.holeForm.controls.tensionStage.setValue(4);
      this.holeForm.controls.stage.setValue([10, 10, 50, 100, 0]);
    }
  }
  // 获取阶段数据
  tensionStageArrF(value = this.holeForm.controls.tensionStage.value) {
    this.tensionStageArr =  [...Array(value)];
    const mode = this.holeForm.controls.mode.value;
    let zA = 0;
    let zB = 0;
    if (mode === 'AB4' || mode === 'AB8') {
      zA = 2;
      zB = 2;
    }
    if (mode === 'A2') {
      zA = 2;
    }
    if (mode === 'B2') {
      zA = 2;
    }
    this.theoryIf = {
      zA: mode === 'A1' ? 1 : zA,
      zB: mode === 'B1' ? 1 : zB,
      zC: mode === 'AB8' ? 2 : 0,
      zD: mode === 'AB8' ? 2 : 0,
      cA: 0,
      cB: 0,
      cC: 0,
      cD: 0,
    };
    this.theoryIf = tableDev(mode);
    this.devModeStr = taskModeStr(mode);
    this.holeNames = this.holeForm.value.name.split('/');
    console.log('011445445456456456456', this.devModeStr, mode);
  }
}
