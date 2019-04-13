import { NgModule } from '@angular/core';

import { LoginRoutingModule } from './login.routing';
import { LoginComponent } from './login.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [LoginComponent],
  imports: [
    SharedModule,
    LoginRoutingModule
  ]
})
export class LoginModule { }
