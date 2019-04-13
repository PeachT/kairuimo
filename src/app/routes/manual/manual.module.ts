import { NgModule } from '@angular/core';

import { ManualRoutingModule } from './manual.routing';
import { ManualComponent } from './manual.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [ManualComponent],
  imports: [
    SharedModule,
    ManualRoutingModule
  ]
})
export class ManualModule { }
