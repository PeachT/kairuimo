import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectRoutingModule } from './project.routing';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProjectComponent } from './project.component';

@NgModule({
  declarations: [ProjectComponent],
  imports: [
    SharedModule,
    ProjectRoutingModule
  ],
  exports: [
    ProjectRoutingModule
  ]
})
export class ProjectModule { }
