import {
  Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter,
  ViewChildren, QueryList, ViewChild, ElementRef
} from '@angular/core';
import { Menu } from 'src/app/models/menu';
import { DbService } from 'src/app/services/db.service';
import { AppService } from 'src/app/services/app.service';
import { NzMessageService } from 'ng-zorro-antd';
import { TensionTask } from 'src/app/models/task.models';
import { LeftMenuComponent } from 'src/app/shared/left-menu/left-menu.component';
import { ActivatedRoute } from '@angular/router';
import { fromEvent } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
// import endOfMonth from 'date-fns/end_of_month';
// import * as endOfMonth from 'date-fns/end_of_month';
import { lastDayOfWeek, lastDayOfMonth, startOfWeek, startOfMonth, getTime} from 'date-fns';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'task-menu',
  templateUrl: './task-menu.component.html',
  styleUrls: ['./task-menu.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskMenuComponent implements OnInit {
  @ViewChild('bridgeScroll', null) bridgeScrollDom: ElementRef;
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
  paddingTop = 0;
  pts = [];
  sg = 0;
  sgs = true;
  sgsd = true;
  pt10 = 0;
  pt20 = 0;
  scrollTop = 0;
  setScrollTop = 0;
  filter = {
    ok: false,
    no: false,
    tension: {
      startDate: null,
      entDate: null,
      date: [],
    },
    pouring: {
      startDate: null,
      entDate: null,
      date: [],
    },
  };
  rangesDate = {本周: [startOfWeek(new Date()), lastDayOfWeek(new Date())], 本月: [startOfMonth(new Date()), lastDayOfMonth(new Date())] };

  @Output() menuChange = new EventEmitter();

  constructor(
    private db: DbService,
    private cdr: ChangeDetectorRef,
    public appS: AppService,
    private message: NzMessageService,
    private activatedRoute: ActivatedRoute,
  ) { }

  async ngOnInit() {
    const date = new Date();
    this.filter.tension.date = [startOfWeek(date), lastDayOfWeek(date)];
    this.filter.tension.startDate = getTime(startOfWeek(date));
    this.filter.tension.entDate = getTime(lastDayOfWeek(date));
    this.filter.pouring.date = [startOfWeek(date), lastDayOfWeek(date)];
    this.filter.pouring.startDate = getTime(startOfWeek(date));
    this.filter.pouring.entDate = getTime(lastDayOfWeek(date));
    await this.getProject();
    this.activatedRoute.queryParams.subscribe(queryParams => {
      let data = null;
      if (queryParams.project) {
        data = queryParams;
      } else if (this.appS.userInfo) {
        data = JSON.parse(localStorage.getItem(this.appS.userInfo.nameId));
      }
      data = Object.assign({ project: null, component: null, selectBridge: null }, data);
      this.project.select = this.project.menu.filter(f => f.id === Number(data.project))[0];
      this.res(data);
    });
    fromEvent(this.bridgeScrollDom.nativeElement, 'scroll').pipe(
      debounceTime(200),
      map(y => console.log(y))
    );

  }

  res(data) {
    this.component.select = data.component;
    this.bridge.select = Number(data.selectBridge);
    console.log('路由菜单', this.project, this.component, this.bridge);
    if (this.project.select) {
      this.getProject();
    }
    if (this.component.select) {
      this.getComponent();
    }
  }

  async getProject() {
    this.project.menu = await this.db.getMenuData('project');
    console.log(this.project);
  }
  async getComponent() {
    this.component.menu = await this.db.getTaskComponentMenuData((o1) => o1.project === this.project.select.id);
    console.log(this.component);
    if (this.component.select) {
      this.getBridge(this.bridge.select);
    } else {
      this.cdr.markForCheck();
    }
  }
  async getBridge(id = null) {
    if (!this.project.select.id ||  !this.component.select) {
      return;
    }
    this.paddingTop = 0;
    this.pts = [];
    this.sg = 0;
    this.sgs = true;
    this.sgsd = true;
    this.pt10 = 0;
    this.pt20 = 0;
    this.scrollTop = 0;
    this.setScrollTop = 0;
    this.bridgeScrollDom.nativeElement.scrollTop = 0;
    // this.resetScrollTop();
    this.getBridgedb(id, 0, 45);
    // tslint:disable-next-line:max-line-length
    // this.bridge.menu = await this.db.getTaskBridgeMenuData((o1) => o1.project === this.project.select.id && o1.component === this.component.select, false, 0, 50);
    // if (id) {
    //   this.onBridge(id);
    // }
    // this.cdr.markForCheck();
    // console.log(this.bridge, id);
  }

  onProject() {
    if (this.ifEdit()) { return; }
    this.bridge = { menu: [], select: null };
    this.component = { menu: [], select: null };
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
  async bScroll(event) {
    const data = event.target;
    const scrollTop = data.scrollTop;

    // const page = Math.floor(scrollTop / (15 * 49)) * 15;
    // const top = page * 49;
    // if (top !== this.paddingTop) {
    //   await this.getBridgedb(null, page, 45);
    //   this.paddingTop = page * 49;
    //   this.setPadding(data);
    // }
    const sg = this.pt20 === 0 ? 0 : Math.floor(scrollTop / (this.pt20 + this.paddingTop));
    const sgd =  Math.floor(scrollTop / this.paddingTop);
    console.log(this.sg, sg, sgd, scrollTop, this.pt20, (this.pt20 + this.paddingTop), this.pts);
    if (sg === 1 && this.sgs) {
      this.sgs = false;
      console.log('sg=', sg);
      this.sg++;
      await this.getBridgedb(null, this.sg * 15, 45);
      this.pts.push(this.pt20);
      this.paddingTop = this.pts.reduce((prev, cur) => prev + cur, 0);
      this.setPadding(data, 1);
      // console.log(scrollTop, this.paddingTop, sg, this.pt20);
    }
    if (sgd === 0 && this.sgs) {
      this.sgsd = false;
      console.log('sgd=', sgd);
      this.sg--;
      await this.getBridgedb(null, this.sg * 15, 45);
      this.pts.pop();
      this.paddingTop = this.pts.reduce((prev, cur) => prev + cur, 0);
      this.setPadding(data, 2);
      // console.log(scrollTop, this.paddingTop, sg, this.pt20);
    }

    if (sgd === 1) {
      this.sgsd = true;
    }
    if (sg === 0) {
      this.sgs = true;
    }
    if (this.pt20 === 0) {
      this.setPadding(data, 0);
    }

  }
  async setPadding(target, state) {
    const children = target.children;
    this.pt20 = 0;
    for (let index = 1; index <= 15; index++) {
      this.pt20 += children[index].offsetHeight;
    }
    console.log(this.pt20);
  }
  async getBridgedb(id = null, p, y) {
    // tslint:disable-next-line:max-line-length
    // this.bridge.menu = await this.db.getTaskBridgeMenuData((o1) => o1.project === this.project.select.id && o1.component === this.component.select, false, p, y);
    this.bridge.menu = await this.db.getTaskBridgeMenuData(
      (o1) => {
        if (o1.project !== this.project.select.id || o1.component !== this.component.select) {
          return false;
        }
        if (this.filter.ok) {
          if (!this.filter.tension.startDate) {
            return true;
          } else if ( o1.startDate >= this.filter.tension.startDate && o1.startDate <= this.filter.tension.entDate) {
            return true;
          }
        }
        if (this.filter.pouring.startDate
          && (
            (getTime(o1.otherInfo[0].value) < this.filter.pouring.startDate
            || getTime(o1.otherInfo[0].value) > this.filter.pouring.entDate)
          )) {
          return false;
        }
        if (!this.filter.no && !this.filter.ok) {
          return true;
        }
        if (this.filter.no && !o1.startDate) {
          return true;
        }

        return false;
      },
      false, p, y);
    if (id) {
      this.onBridge(id);
    }
    this.cdr.markForCheck();
    console.log(this.bridge, id);
  }
  onFilter() {
    console.log(this.filter);
    this.getBridgedb(null, 0, 45);
    this.paddingTop = 0;
    this.getBridge();
  }
  onFilterDate(e, key) {
    this.filter[key].startDate = getTime(e[0]);
    this.filter[key].entDate = getTime(e[1]);
    this.filter[key].date = e;
    console.log(e, this.filter);
    this.getBridge();
  }
}
