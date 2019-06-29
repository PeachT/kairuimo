import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DbService } from 'src/app/services/db.service';
import { NzFormatEmitEvent, NzTreeComponent } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';

@Component({
  selector: 'app-data-treating',
  templateUrl: './data-treating.component.html',
  styleUrls: ['./data-treating.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTreatingComponent implements OnInit {
  @ViewChild('taskTerr') taskTerr: NzTreeComponent;
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
  taskData = {
    project: [],
    component: [],
    bredge: []
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private db: DbService,
    public apps: AppService,
  ) { }

  ngOnInit() {
  }

  onDataProcessing() {
    this.apps.dataTreatingShow = true;
  }

  dataHandleCancel() {
    this.apps.dataTreatingShow = false;
  }
  dataHandleOk() {
    this.apps.dataTreatingShow = false;
  }
  /** 选择类型 */
  async onSelectClass(value, key) {
    console.log(value, key);
    if (key === 'task') {
      // this.dataProcessing[`${key}Data$`] = await this.db.getTaskBridgeMenuData(f => true);
      this.taskData.project = await this.db.getTaskDataTreatingProject();
      console.log(this.dataProcessing[`${key}Data$`]);
    } else {
      this.dataProcessing[`${key}Data$`] = await this.db.getAllAsync(key);
      console.log(this.dataProcessing[`${key}Data$`]);
    }
    this.cdr.markForCheck();
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

  async nzEvent(event: Required<NzFormatEmitEvent>): Promise<void> {
    console.log(event);
    // load child async
    const node = event.node;
    // console.log(node);
    if (node.level === 0) {
      const data = await this.db.getTaskDataTreatingComponent(o1 => o1.project === Number(node.key), node.key);
      node.addChildren(data);
    } else if (node.level === 1) {
      console.log(node.key);
      const data = await this.db.getTaskBridgeMenuData(
        o1 => o1.project === Number(node.key[1]) && o1.component === node.key[0],
        true
      );
      node.addChildren(data);
    }
  }
  onclick(event: Required<NzFormatEmitEvent>) {
    console.log(event.nodes);
  }

  getTrr() {
    console.log(this.taskTerr.getCheckedNodeList(), this.taskTerr.getSelectedNodeList());
  }

  async onTaskProject($event: Array<number>) {
    this.taskData.component = await this.db.getTaskComponentMenuData(o1 => $event.indexOf(o1.project) > -1);
    console.log($event, this.taskData.component);
    this.cdr.markForCheck();
  }
  async onTaskComponet($event: Array<number>) {
    this.taskData.component = await this.db.getTaskComponentMenuData(o1 => $event.indexOf(o1.project) > -1);
    console.log($event, this.taskData.component);
    this.cdr.markForCheck();
  }
}
