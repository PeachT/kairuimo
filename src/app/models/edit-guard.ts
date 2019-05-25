import { Injectable } from '@angular/core';
import { CanDeactivate, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd';
import { Observable } from 'rxjs';
import { AppService } from '../services/app.service';

@Injectable({ providedIn: 'root' })
export class GlobalEditGuard implements CanDeactivate<any> {
  constructor(
    private message: NzMessageService,
    private apps: AppService,
    private router: Router
  ) { }
  canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
    const editState = this.apps.edit;
    console.log(editState, this.router);
    if (editState) {
      return new Observable((observer) => {
        // this.modalService.create({
        //   nzTitle: '编辑中',
        //   nzContent: '你确定要放弃编辑吗？',
        //   nzClosable: false,
        //   nzOnOk: () => {
        //     this.apps.edit = false;
        //   }
        // });
        this.message.warning('请完成编辑！！');
        observer.next(false);
        observer.complete();
      });
    } else {
      console.log('可以跳转');
      return true;
    }
  }
}
