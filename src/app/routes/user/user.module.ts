import { NgModule } from '@angular/core';

import { UserRoutingModule } from './user.routing';
import { UserComponent } from './user.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [UserComponent],
  imports: [
    SharedModule,
    UserRoutingModule
  ]
})
export class UserModule { }
