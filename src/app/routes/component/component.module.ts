import { NgModule } from '@angular/core';

import { ComponentRoutingModule } from './component.routing';
import { ComponentComponent } from './component.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [ComponentComponent],
  imports: [
    SharedModule,
    ComponentRoutingModule
  ]
})
export class ComponentModule { }
