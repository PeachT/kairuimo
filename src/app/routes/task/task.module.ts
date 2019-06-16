import { NgModule } from '@angular/core';

import { TaskRoutingModule } from './task.routing';
import { TaskComponent } from './task.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { GroupComponent } from './components/group/group.component';
import { TaskDataComponent } from './components/task-data/task-data.component';
import { JackComponent } from './components/jack/jack.component';
import { ProjectComponent } from './components/project/project.component';
import { RecordComponent } from './components/record/record.component';
import { TaskMenuComponent } from './components/task-menu/task-menu.component';
import { TensionComponent } from './components/tension/tension.component';

@NgModule({
  declarations: [TaskComponent, GroupComponent, TaskDataComponent, JackComponent, ProjectComponent, RecordComponent, TaskMenuComponent, TensionComponent],
  imports: [
    SharedModule,
    TaskRoutingModule,
  ]
})
export class TaskModule { }
