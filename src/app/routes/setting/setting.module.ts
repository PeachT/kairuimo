import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingRoutingModule } from './setting.routing';
import { SettingComponent } from './setting.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [SettingComponent],
  imports: [
    SharedModule,
    SettingRoutingModule
  ]
})
export class SettingModule { }
