import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LockComponent } from './lock.component';
import { LockRoutingModule } from './lock.routing';

@NgModule({
  declarations: [LockComponent],
  imports: [
    CommonModule,
    LockRoutingModule
  ]
})
export class LockModule { }
