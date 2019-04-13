import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefaultComponent } from './default/default.component';
import { SharedModule } from '../shared/shared.module';
import { HeaderComponent } from './header/header.component';

const COMPONENTS = [];

const EXPORTS = [
  DefaultComponent,
  HeaderComponent,
];

@NgModule({
  declarations: [
    ...EXPORTS,
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    ...EXPORTS
  ]
})
export class LayoutModule { }
