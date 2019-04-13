import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AutoComponent } from './auto.component';

const routes: Routes = [{path: '', component: AutoComponent}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AutoRoutingModule { }
