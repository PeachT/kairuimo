import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app.routing';
import { AppComponent } from './app.component';

import { NgxElectronModule } from 'ngx-electron';
import { NgZorroAntdModule, NZ_I18N, zh_CN, NZ_ICONS } from 'ng-zorro-antd';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import { LayoutModule } from './layout/layout.module';

import * as AllIcons from '@ant-design/icons-angular/icons';
import { CoreModule } from './core/core.module';

registerLocaleData(zh);


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    NgxElectronModule,
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    NgZorroAntdModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    LayoutModule
  ],
  providers: [
    { provide: NZ_I18N, useValue: zh_CN },
    { provide: NZ_ICONS, useValue: AllIcons }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
