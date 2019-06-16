import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd';
import { groupModeStr, taskModeStr } from 'src/app/models/jack';
import { GroupItem } from 'src/app/models/task.models';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'task-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.less']
})
export class GroupComponent implements OnInit {
  deviceMode: any  = null;
  holes: Array<string> = [];

  show = false;
  modeGroup: Array<string> = [];
  holeGroup: Array<any> = [];
  residueHole: Array<string> = [];
  selectMde = {};

  err: Array<string> = [];

  @Output() outGroup = new EventEmitter();

  constructor(
    private message: NzMessageService,
  ) { }

  ngOnInit() {}

  onShow() {
    if (!this.deviceMode) {
      this.message.error('请选择设备😔！');
    }
    if (!this.holes) {
      this.message.error('请选择构建😔！');
    }
    if (this.deviceMode && this.holes) {
      this.show = true;
      this.modeGroup = groupModeStr(this.deviceMode);
    }
  }
  /** 初始化选择值 */
  selectModeInit() {
    this.modeGroup.map(key => {
      this.selectMde[key] = null;
    });
  }
  /** 下拉框打开 */
  open() {
    const modeHole = [];
    this.modeGroup.map(key => {
      modeHole.push(this.selectMde[key]);
    });
    this.holeGroup.map(arr => {
      modeHole.push(...arr);
    });
    this.residueHole = this.holes.filter(v =>  modeHole.indexOf(v) === -1 );
  }
  /** 保存单个分组 */
  itemGroupSave() {
    const modeHole = [];
    const err = [];
    this.modeGroup.map(key => {
      if (!this.selectMde[key]) {
        err.push(key);
      }
      modeHole.push(this.selectMde[key]);
    });
    if (err.length === 0) {
      this.holeGroup.push(modeHole);
      this.selectModeInit();
    }
    this.err = err;
  }
  /** 删除单个分组 */
  delHoleGroup(i) {
    this.holeGroup.splice(i, 1);
  }
  /** 取消分组 */
  onCancel() {
    this.show = false;
  }
  /** 保存分组 */
  onSave() {
    const modeHole = [];
    this.holeGroup.map(arr => {
      modeHole.push(...arr);
    });
    if (this.holes.length === modeHole.length) {
      const group = [];
      this.holeGroup.map(arr => {
        group.push(arr.join('/'));
      });
      console.log(group);
      this.creategroupData(group);
    } else {
      this.message.warning('请完成分组');
    }

  }

  /** 自动分组 */
  autoGroup() {
    if (this.deviceMode && this.holes.length > 0) {
      this.modeGroup = groupModeStr(this.deviceMode);
      console.log(this.deviceMode, this.holes, this.modeGroup.length);
      const group = [];
      for (let index = 0; index < this.holes.length; index += this.modeGroup.length) {
        group.push(this.holes.slice(index, index + this.modeGroup.length).join('/'));
      }
      this.creategroupData(group);
    }
  }
  /** 创建分组数据 */
  creategroupData(group) {
    if (!group.length) {
      this.message.error('至少需要一个分组');
      return;
    }
    const groupData = [];
    group.map(item => {
      const taskBase: GroupItem = {
        name: item,
        mode: this.deviceMode,
        length: 0,
        tensionKn: 0,
        steelStrandNumber: 0,
        tensionStage: 3,
        stage: [10, 20, 50, 100, 0, 0, 0],
        time: [30, 30, 30, 300, 0, 0, 0],
        returnMm: 6,
        twice: false,
        super: false,
      };
      taskModeStr[taskBase.mode].map(d => {
        taskBase[d] = {
          kn: [0, 0, 0, 0, 0, 0, 0],
          wordMm: 4,
        };
        if (d.indexOf('zA') > -1 || d.indexOf('zB') > -1 || d.indexOf('zC') > -1 || d.indexOf('zD') > -1) {
          taskBase[d].theoryMm = 0;
        }
      });
      groupData.push(taskBase);
    });
    console.log(group, groupData);
    this.show = false;
    this.outGroup.emit({names: group, data: groupData});
  }
}
