import { Injectable } from '@angular/core';

import { PLCService } from './PLC.service';
import { PLC_D } from '../models/IPCChannel';
import { TensionTask, GroupItem } from '../models/task.models';

@Injectable({ providedIn: 'root' })
export class AutoService {
  public task: {
    id: any,
    groupData: GroupItem
    project: any;
    component: any;
  };
  public autoData = [];

  constructor(
    public PLCS: PLCService,
  ) {
  }

  public getData() {
    this.task = JSON.parse(localStorage.getItem('autoTask'));
    this.getAutoPLC();
  }

  public getAutoPLC() {
    this.PLCS.ipcSend('zF03', PLC_D(430), 10).then((data: any) => {
      if (data) {
        this.autoData = data.float;
        this.autoData[4] = data.int16[8] / 10;
      }
      console.log(this.autoData);
    }).finally(() => {
    });
  }
}
