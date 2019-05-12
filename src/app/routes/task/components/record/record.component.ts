import { Component, OnInit, Input } from '@angular/core';
import { Record, GroupItem } from 'src/app/models/task.models';
import { taskModeStr, tableDev } from 'src/app/models/jack';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Elongation } from 'src/app/models/live';
import { TensionMm } from 'src/app/Function/device.date.processing';

@Component({
  selector: 'app-record',
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.less']
})
export class RecordComponent implements OnInit {
  @Input()
  GroupData: GroupItem;

  /** 曲线数据 */
  svgData = {
    mpa: null,
    mm: null,
    names: []
  };
  elongation: Elongation;
  holeForm: FormGroup;
  tensionStageArr = null;
  theoryIf = null;
  devModeStr = null;
  holeNames = null;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.tensionStageArrF();
    const data = this.GroupData;
    this.svgData = {
      names: taskModeStr[data.mode],
      mpa: [],
      mm: []
    };
    this.svgData.mpa.push(data.record.time);
    this.svgData.mm.push(data.record.time);
    const ten = null;
    this.svgData.names.map(key => {
      this.svgData.mpa.push(data.record[key].mapData);
      this.svgData.mm.push(data.record[key].mmData);
    });
    this.elongation = TensionMm(data);
    console.log('记录数据处理', this.svgData, this.elongation);
  }

  // 获取阶段数据
  tensionStageArrF() {
    this.tensionStageArr = [...Array(this.GroupData.tensionStage)];
    const mode = this.GroupData.mode;
    this.theoryIf = tableDev(mode, 4);
    this.devModeStr = taskModeStr[mode];
    this.holeNames = this.GroupData.name.split('/');
    console.log('011445445456456456456', this.devModeStr, mode, this.theoryIf);
  }
}
