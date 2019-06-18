import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { DB, DbService, tableName } from 'src/app/services/db.service';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { User } from 'src/app/models/user.models';
import { Router } from '@angular/router';
import { GroupItem, TensionTask } from 'src/app/models/task.models';
import { Observable } from 'rxjs';
import { Jack } from 'src/app/models/jack';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D } from 'src/app/models/IPCChannel';
import { ManualComponent } from '../manual/manual.component';
import { Project } from 'src/app/models/project';
import { ProjectComponent as appProjectComponent } from 'src/app/shared/project/project.component';
import { LeftMenuComponent } from 'src/app/shared/left-menu/left-menu.component';
import { copyAny } from 'src/app/models/base';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.less']
})
export class ProjectComponent implements OnInit {
  dbName = 'project';
  @ViewChild('prjDom')
  prjDom: appProjectComponent;
  @ViewChild('leftMenu')
  leftMenu: LeftMenuComponent;

  data: Project;

  constructor() {}

  ngOnInit() {
  }

  onMneu(data: Project) {
    console.log('一条数据', data);
    this.data = data;
    this.prjDom.reset(this.data);
  }

  /**
   * *编辑
   */
  edit(data) {
    if (!data) {
      data = copyAny(this.data);
      data.id = null;
    }
    this.data = data;
    console.log(this.data, data);
    this.prjDom.reset(this.data);
    this.leftMenu.markForCheck();
  }
  /**
   * *编辑完成
   */
  editOk(id) {
    console.log(id);
    if (id) {
      this.leftMenu.getMenuData(id);
    } else {
      this.leftMenu.onClick();
    }
  }
}
