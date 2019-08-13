import { Component, OnInit, ViewChild, ChangeDetectorRef, OnChanges } from '@angular/core';
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
import { DeleteModalComponent } from 'src/app/shared/delete-modal/delete-modal.component';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.less']
})
export class ProjectComponent implements OnInit, OnChanges {
  dbName = 'project';
  @ViewChild('prjDom', null) prjDom: appProjectComponent;
  @ViewChild('leftMenu', null) leftMenu: LeftMenuComponent;
  @ViewChild('del', null) deleteDom: DeleteModalComponent;

  data: Project;
  deleteShow = false;

  menuFilter = (o1: Project) => o1.jurisdiction !== 8;

  constructor(
    private message: NzMessageService,
    private db: DbService,
    public appS: AppService,
    private modalService: NzModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  ngOnChanges() {
    console.log('78999999999999999999999999999999999999999999978978');
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
      this.data.id = null;
    } else {
      this.data = data;
    }
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
  /** 删除 */
  async delete() {
    const id = this.appS.leftMenu;

    const count = await this.db.db.task.filter(t => t.project === id).count();
    if (count === 0) {
      this.deleteShow = true;
      this.cdr.markForCheck();
      console.log('删除', id, '任务', count, this.deleteShow);
    } else {
      this.message.error(`有 ${count} 条任务在该项目下，不允许删除！`);
    }
  }
  async deleteOk(state = false) {
    if (state) {
      const msg = await this.db.db.project.delete(this.appS.leftMenu);
      console.log('删除了', msg);
      this.appS.leftMenu = null;
      this.leftMenu.getMenuData();
    }
    this.deleteShow = false;
  }
}
