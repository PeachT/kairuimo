import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { JackComponent } from './jack.component';

const routes: Routes = [{path: '', component: JackComponent}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JackRoutingModule { }
