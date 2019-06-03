import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AppService } from 'src/app/services/app.service';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit {
  // menus = [
  //   {url: '/task', icon: 'form', name: '任务'},
  //   {url: '/manual', icon: 'deployment-unit', name: '手动'},
  //   {url: '/setting', icon: 'setting', name: '设置'},
  //   {url: '/jack', icon: 'usb', name: '千斤顶'},
  //   {url: '/project', icon: 'form', name: '项目'},
  //   {url: '/component', icon: 'deployment-unit', name: '构建'},
  //   {url: '/user', icon: 'user', name: '用户'},
  //   {url: '/auto', icon: 'box-plot', name: '自动'},
  //   {url: '/hole', icon: 'question-circlet', name: '帮助'},
  // ];
  powerState = false;
  constructor(
    private router: Router,
    public appS: AppService,
    ) { }

  ngOnInit() {
  }

  goUrl(url) {
    this.router.navigate([url]);
  }
  ifUrl(url) {
    return this.appS.nowUrl.indexOf(url) > -1 ;
  }

  power() {
    this.appS.powerState = true;
  }
}
