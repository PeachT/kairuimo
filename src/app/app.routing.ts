import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DefaultComponent } from './layout/default/default.component';
import { HeaderComponent } from './layout/header/header.component';
import { GlobalEditGuard } from './models/edit-guard';

const routes: Routes = [
  {
    path: '',
    component: DefaultComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadChildren: './routes/login/login.module#LoginModule',
        // loadChildren: () => import('./routes/login/login.module').then(m => m.LoginModule),
        data: { title: '登录' }
      },
      {
        path: 'auto',
        loadChildren: './routes/auto/auto.module#AutoModule',
        // loadChildren: () => import('./routes/auto/auto.module').then(m => m.AutoModule),
        data: { title: '自动' }
      },
      {
        path: 'lock',
        loadChildren: './routes/lock/lock.module#LockModule',
        // loadChildren: () => import('./routes/auto/auto.module').then(m => m.AutoModule),
        data: { title: '锁机' }
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
        // loadChildren: () => import('./routes/task/task.module').then(m => m.TaskModule),
        data: { title: '任务' },
        canDeactivate: [GlobalEditGuard]
      },
      {
        path: 'manual',
        loadChildren: './routes/manual/manual.module#ManualModule',
        // loadChildren: () => import('./routes/manual/manual.module').then(m => m.ManualModule),
        data: { title: '手动' }
      },
      {
        path: 'setting',
        loadChildren: './routes/setting/setting.module#SettingModule',
        // loadChildren: () => import('./routes/setting/setting.module').then(m => m.SettingModule),
        data: { title: '设置' }
      },
      {
        path: 'jack',
        loadChildren: './routes/jack/jack.module#JackModule',
        // loadChildren: () => import('./routes/jack/jack.module').then(m => m.JackModule),
        data: { title: '千斤顶' },
        canDeactivate: [GlobalEditGuard]
      },
      {
        path: 'project',
        loadChildren: './routes/project/project.module#ProjectModule',
        // loadChildren: () => import('./routes/project/project.module').then(m => m.ProjectModule),
        data: { title: '项目' },
        canDeactivate: [GlobalEditGuard]
      },
      {
        path: 'component',
        loadChildren: './routes/component/component.module#ComponentModule',
        // loadChildren: () => import('./routes/component/component.module').then(m => m.ComponentModule),
        data: { title: '构建' },
        canDeactivate: [GlobalEditGuard]
      },
      {
        path: 'user',
        loadChildren: './routes/user/user.module#UserModule',
        // loadChildren: () => import('./routes/user/user.module').then(m => m.UserModule),
        data: { title: '用户' },
        canDeactivate: [GlobalEditGuard]
      },
      {
        path: 'help',
        loadChildren: './routes/help/help.module#HelpModule',
        // loadChildren: () => import('./routes/help/help.module').then(m => m.HelpModule),
        data: { title: '帮助' },
        canDeactivate: [GlobalEditGuard]
      },
      // {
      //   path: 'auto',
      //   loadChildren: './routes/auto/auto.module#AutoModule',
      //   data: { title: '自动' }
      // },
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
