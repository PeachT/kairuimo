import { Component, OnInit, Input } from '@angular/core';
import { taskModeStr } from 'src/app/models/jack';
import { PLCService } from 'src/app/services/PLC.service';
import { Router } from '@angular/router';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'task-tension',
  templateUrl: './tension.component.html',
  styleUrls: ['./tension.component.less']
})
export class TensionComponent implements OnInit {
  @Input() show: boolean;

  /** 张拉设备状态 */
  tensionDevice = {
    state: false,
    names: [],
    zA: null,
    zB: null,
    zC: null,
    zD: null,
    cA: null,
    cB: null,
    cC: null,
    cD: null,
  };
  holeMneuData = null;
  localStorageData = null;

  constructor(
    public PLCS: PLCService,
    private router: Router,
  ) { }

  ngOnInit() {
  }
  /**
   * *张拉
   */
  tension(holeMneuData = this.holeMneuData, localStorageData = this.localStorageData) {
    this.localStorageData = localStorageData;
    this.holeMneuData = holeMneuData;
    this.tensionDevice.state = true;
    console.log('张拉', this.holeMneuData.data, this.PLCS.mpaRevise, this.PLCS.jack);
    if (this.tensionDeviceState()) {
      this.tensionDevice.state = true;
      this.tensionDevice.names = taskModeStr[this.holeMneuData.data.mode];
      console.log('记录', 'record' in this.holeMneuData.data);
    } else {
    // await this.PLCS.selectJack(this.jackData.id);
    //   localStorage.setItem('autoTask', JSON.stringify({
    //     project: this.project.id,
    //     component: this.menu.selectComponent,
    //     id: this.data.id,
    //     jackId: this.jackData.id,
    //     groupData: this.holeMneuData.data
    //   }));
      localStorage.setItem('autoTask', JSON.stringify(localStorageData));
      this.tensionDevice.state = false;
      this.router.navigate(['/auto']);
    }
  }
  /** 检查设备状态 */
  tensionDeviceState(): boolean {
    if (!this.PLCS.plcState.z) {
      return true;
    }
    if (this.holeMneuData.data.mode !== 'A1' && this.holeMneuData.data.mode !== 'B1' && !this.PLCS.plcState.c) {
      return true;
    }
    let s = false;
    for (const name of taskModeStr[this.holeMneuData.data.mode]) {
      console.log(this.PLCS.PD[name].alarm, this.PLCS.PD[name].state);
      this.tensionDevice[name] = null;
      if (Number(this.holeMneuData.data[name].kn[this.holeMneuData.data.tensionStage]) < 2) {
        this.tensionDevice[name] = '最终张拉压力不能 < 2Mpa';
        s = true;
        break;
      }
      for (let index = 1; index < this.holeMneuData.data.tensionStage; index++) {
        const i0 = Number(this.holeMneuData.data[name].kn[index - 1]);
        const i1 = Number(this.holeMneuData.data[name].kn[index]);
        console.log(i0, '>=', i1, '=', i0 >= i1);
        if ((i0 > i1) || i0 > 56 || i1 > 56) {
          this.tensionDevice[name] = '阶段压力设置错误';
          s = true;
        }
      }
      if (this.PLCS.PD[name].alarm.length !== 0 || this.PLCS.PD[name].state !== '待机') {
        s = true;
      }
    }
    return s;
  }
}
