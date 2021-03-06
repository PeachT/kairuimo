import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DefaultComponent } from './layout/default/default.component';
import { HeaderComponent } from './layout/header/header.component';

const routes: Routes = [
  {
    path: '',
    component: DefaultComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadChildren: './routes/login/login.module#LoginModule',
        data: { title: '登录' }
      },

      // {
      //   path: 'task',
      //   loadChildren: './routes/task/task.module#TaskModule',
      //   data: { title: '任务' }
      // },
      // {
      //   path: 'manual',
      //   loadChildren: './routes/manual/manual.module#ManualModule',
      //   data: { title: '手动' }
      // },
    ]
  },
  {
    path: '',
    component: HeaderComponent,
    children: [
      {
        path: 'task',
        loadChildren: './routes/task/task.module#TaskModule',
        data: { title: '任务' }
      },
      {
        path: 'manual',
        loadChildren: './routes/manual/manual.module#ManualModule',
        data: { title: '手动' }
      },
      {
        path: 'setting',
        loadChildren: './routes/setting/setting.module#SettingModule',
        data: { title: '设置' }
      },
      {
        path: 'jack',
        loadChildren: './routes/jack/jack.module#JackModule',
        data: { title: '千斤顶' }
      },
      {
        path: 'project',
        loadChildren: './routes/project/project.module#ProjectModule',
        data: { title: '项目' }
      },
      {
        path: 'component',
        loadChildren: './routes/component/component.module#ComponentModule',
        data: { title: '构建' }
      },
      {
        path: 'user',
        loadChildren: './routes/user/user.module#UserModule',
        data: { title: '构建' }
      },
      {
        path: 'auto',
        loadChildren: './routes/auto/auto.module#AutoModule',
        data: { title: '自动' }
      },
    ]
  },
  // {
  //   path: '',
  //   component: LeftComponent,
  //   children: [
  //     {
  //       path: 'task',
  //       loadChildren: './routes/task/task.module#TaskModule',
  //       data: { title: '任务' }
  //     },
  //   ]
  // }
  // {
  //   path: 'passport', component: PassportComponent,
  //   children: [
  //     {path: 'login', component: LoginComponent, data: { title: '登录' }},
  //     {path: 'register', component: RegisterComponent, data: { title: '注册' }},
  //   ]
  // }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
