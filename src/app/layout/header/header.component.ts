import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AppService } from 'src/app/services/app.service';
import { ElectronService } from 'ngx-electron';
import { DbService, tableName } from 'src/app/services/db.service';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit {
  // menus = [
  //   {url: '/task', icon: 'form', name: '任务'},
  //   {url: '/manual', icon: 'deployment-unit', name: '手动'},
  //   {url: '/setting', icon: 'setting', name: '设置'},
  //   {url: '/jack', icon: 'usb', name: '千斤顶'},
  //   {url: '/project', icon: 'form', name: '项目'},
  //   {url: '/component', icon: 'deployment-unit', name: '构建'},
  //   {url: '/user', icon: 'user', name: '用户'},
  //   {url: '/auto', icon: 'box-plot', name: '自动'},
  //   {url: '/hole', icon: 'question-circlet', name: '帮助'},
  // ];
  dataProcessing = {
    state: false,
    radioValue: false,
    task: false,
    project: false,
    jack: false,
    component: false,
    taskCheckbox: null,
    taskData$: null,
    projectData$: null,
    jackData$: null,
    componentData$: null,
    taskSelect: [],
    projectSelect: [],
    componentSelect: [],
    jackSelect: [],
    taskAll: false,
    taskindeterminate: false,
  };
  powerState = false;
  constructor(
    private router: Router,
    public appS: AppService,
    private db: DbService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
  }

  goUrl(url) {
    this.router.navigate([url]);
  }
  ifUrl(url) {
    return this.appS.nowUrl.indexOf(url) > -1;
  }

  power() {
    this.appS.powerState = true;
  }

  onDataProcessing() {
    this.dataProcessing.state = true;
  }

  dataHandleCancel() {
    this.dataProcessing.state = false;
  }
  dataHandleOk() {
    this.dataProcessing.state = false;
  }

  /** 选择类型 */
  async onSelectClass(value, key) {
    console.log(value, key);
    if (value) {
      this.dataProcessing[`${key}Data$`] = await this.db.getAllAsync(key);
      console.log(this.dataProcessing[`${key}Data$`]);
      this.changeDetectorRef.markForCheck();
    }
  }
  /** 任务筛选 */
  onTaskCheckbox(value) {
    console.log(value);
    console.log(this.dataProcessing);
  }

  onTaskSelect(value, key) {
    this.dataProcessing[`${key}Select`] = value;
    console.log(this.dataProcessing[`${key}Select`].length,
     of(this.dataProcessing.taskData$).pipe(
       map(item => {
         item.subscribe().pipe(
           map(i => {
             console.log(i);
           })
         );
       })
     )
    );
  }
  select(key, value) {
    console.log('all', value);
    this.dataProcessing[`${key}indeterminate`] = false;
    this.dataProcessing[`${key}Data$`].map(item => {
      item.checked = value;
    });
  }
  itemSelect(key) {
    const data = this.dataProcessing[`${key}Data$`];
    if (data.every(item => item.checked === false)) {
      this.dataProcessing[`${key}All`] = false;
      this.dataProcessing[`${key}indeterminate`] = false;
    } else if (data.every(item => item.checked === true)) {
      this.dataProcessing[`${key}All`] = true;
      this.dataProcessing[`${key}indeterminate`] = false;
    } else {
      this.dataProcessing[`${key}indeterminate`] = true;
    }
  }

  sss(v) {
    console.log('sss', v);
    return v;
  }
}
