import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AutoRoutingModule } from './auto.routing';
import { AutoComponent } from './auto.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [AutoComponent],
  imports: [
    SharedModule,
    AutoRoutingModule,
  ]
})
export class AutoModule { }
