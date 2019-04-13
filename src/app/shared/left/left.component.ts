import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AppService } from 'src/app/services/app.service';

@Component({
  selector: 'app-left',
  templateUrl: './left.component.html',
  styleUrls: ['./left.component.less']
})
export class LeftComponent implements OnInit {

  constructor(
    private router: Router,
    private appS: AppService,
    ) { }

  ngOnInit() {
  }

  goUrl(url) {
    this.router.navigate([url]);
  }
  ifUrl(url) {
    return this.appS.nowUrl.indexOf(url) > -1 ;
  }
}
