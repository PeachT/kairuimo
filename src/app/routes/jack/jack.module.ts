import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JackRoutingModule } from './jack.routing';
import { JackComponent } from './jack.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [JackComponent],
  imports: [
    SharedModule,
    JackRoutingModule
  ],
  exports: [
    JackRoutingModule
  ]
})
export class JackModule { }
