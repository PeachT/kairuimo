import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter,
         ViewChildren, QueryList } from '@angular/core';
import { Menu } from 'src/app/models/menu';
import { DbService } from 'src/app/services/db.service';
import { AppService } from 'src/app/services/app.service';
import { NzMessageService } from 'ng-zorro-antd';
import { TensionTask } from 'src/app/models/task.models';
import { LeftMenuComponent } from 'src/app/shared/left-menu/left-menu.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'task-menu',
  templateUrl: './task-menu.component.html',
  styleUrls: ['./task-menu.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskMenuComponent implements OnInit {
  project = {
    select: null,
    menu: null,
  };
  component = {
    select: null,
    menu: null,
  };
  bridge = {
    select: null,
    menu: null,
  };

  @Output() menuChange = new EventEmitter();

  constructor(
    private db: DbService,
    private cdr: ChangeDetectorRef,
    public appS: AppService,
    private message: NzMessageService,
    private activatedRoute: ActivatedRoute,
  ) { }

  async ngOnInit() {
    await this.getProject();
    this.activatedRoute.queryParams.subscribe(queryParams => {
      let data = null;
      if (queryParams.project) {
        data = queryParams;
      } else if (this.appS.userInfo) {
        data = JSON.parse(localStorage.getItem(this.appS.userInfo.nameId));
      }
      data = Object.assign({project: null, component: null, selectBridge: null}, data);
      this.project.select = this.project.menu.filter(f => f.id === Number(data.project))[0];
      this.component.select = data.component;
      this.bridge.select = Number(data.selectBridge);
      console.log('路由菜单', data, this.project, this.component, this.bridge);
      this.res();
    });
  }

  res() {
    if (this.project.select) {
      this.getProject();
    }
    if ( this.component.select) {
      this.getComponent();
    }
  }

  async getProject() {
    this.project.menu = await this.db.getMenuData('project', );
    console.log(this.project);
  }
  async getComponent() {
    this.component.menu = await this.db.getTaskComponentMenuData(this.project.select.id);
    console.log(this.component);
    if (this.component.select) {
      this.getBridge(this.bridge.select);
    } else {
      this.cdr.markForCheck();
    }
  }
  async getBridge(id = null) {
    this.bridge.menu = await this.db.getTaskBridgeMenuData(this.project.select.id, this.component.select);
    if (id) {
      this.onBridge(id);
    }
    this.cdr.markForCheck();
    console.log(this.bridge, id);
  }

  onProject() {
    if (this.ifEdit()) { return; }
    this.bridge = { menu: [], select: null};
    this.component = { menu: [], select: null};
    this.appS.leftMenu = null;
    console.log(this.project);
    this.getComponent();
  }
  onComponent(event) {
    if (this.ifEdit()) { return; }
    if (event !== this.component.select) {
      this.component.select = event;
      this.getBridge();
    } else {
      this.component.select = null;
      this.bridge.menu = [];
      this.appS.leftMenu = null;
    }
    console.log(this.component);
  }
  onBridge(event) {
    if (this.ifEdit()) { return; }
    this.bridge.select = event;
    console.log(this.bridge);
    this.onMneu();
  }

  async onMneu() {
    if (!this.bridge.select) {
      return;
    }
    const data = await this.db.getFirstId('task', this.bridge.select);
    console.log(data);
    this.appS.leftMenu = this.bridge.select;
    this.menuChange.emit(data);
    this.saveSelectMneu();
  }
  markForCheck() {
    this.cdr.markForCheck();
  }
  /** 保存寻找的菜单 */
  saveSelectMneu() {
    try {
      localStorage.setItem(this.appS.userInfo.nameId, JSON.stringify(
      {
        project: this.project.select.id,
        component: this.component.select,
        selectBridge: this.bridge.select,
      }));
    } catch (error) {
    }
  }
  ifEdit() {
    if (this.appS.edit) {
      this.message.warning('请完成编辑！');
      return true;
    }
    return false;
  }
}
