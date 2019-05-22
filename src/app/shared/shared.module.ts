import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// 动态表单
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { LeftComponent } from './left/left.component';
import { ManualItemComponent } from './manual-item/manual-item.component';
import { ReviseItemComponent } from './revise-item/revise-item.component';
import { DynamicLineComponent } from './echarts/dynamic-line/dynamic-line.component';
import { JackItemComponent } from './jack-item/jack-item.component';
import { ProjectComponent } from './project/project.component';
import { ValidatorErrorPipe } from '../pipes/error.pipe';


// pipe

const MODULES = [
  RouterModule,
  NgZorroAntdModule,
  FormsModule,
  ReactiveFormsModule,
  CommonModule,
];

const COMPONENTS = [
  LeftComponent,
  ManualItemComponent,
  ReviseItemComponent,
  DynamicLineComponent,
  JackItemComponent,
  ProjectComponent
];
const PIPE = [
  ValidatorErrorPipe,
];

@NgModule({
  declarations: [
    ...COMPONENTS,
    ...PIPE,
    ProjectComponent,
  ],
  imports: [
    ...MODULES,
  ],
  exports: [
    ...COMPONENTS,
    ...MODULES,
    ...PIPE,
  ],
  entryComponents: [ManualItemComponent]
})
export class SharedModule { }
