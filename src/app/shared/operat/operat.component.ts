import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DbService } from 'src/app/services/db.service';
import { Project } from 'src/app/models/project';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { FormGroup } from '@angular/forms';
import { getModelBase } from 'src/app/models/base';

@Component({
  selector: 'app-operat',
  templateUrl: './operat.component.html',
  styleUrls: ['./operat.component.less']
})
export class OperatComponent implements OnInit {
  @Input() dbName: string;
  @Input() formData: FormGroup;

  @Output() outEditOk = new EventEmitter();
  @Output() outEdit = new EventEmitter();

  @Input() addFilterFun: (o1: any, o2: any) => boolean = (o1: any, o2: any) => o1.name === o2.name;
  @Input() updateFilterFun: (o1: any, o2: any) => boolean = (o1: any, o2: any) => o1.name === o2.name && o1.id !== o2.id;



  constructor(
    private message: NzMessageService,
    private db: DbService,
    public appS: AppService,
    private modalService: NzModalService,
  ) { }

  ngOnInit() {
  }
  /** 保存数据 */
  async save() {
    if (!this.formData.valid) {
      console.log(this.formData.valid);
      this.message.error('数据填写有误！！');
      return;
    }
    const data = this.formData.value;
    console.log('保存数据', data);
    let r = null;
    const msg = !data.id ? '添加' : '修改';
    // 添加
    if (!data.id) {
      delete data.id;
      // r = await this.db.addAsync(this.dbName, data, (p: Project) => p.name === data.name);
      r = await this.db.addAsync(this.dbName, data, (o: Project) => this.addFilterFun(o, data));
    } else {
      r = await this.db.updateAsync(this.dbName, data, (o: Project) => this.updateFilterFun(o, data));
    }

    console.log(r);
    if (r.success) {
      this.message.success(`${msg}成功🙂`);
      this.appS.edit = false;
      this.outEditOk.emit(r.id);
    } else {
      this.message.error(`${msg}失败😔`);
      console.log(`${msg}失败😔`, r.msg);
    }

  }
  /** 取消编辑 */
  cancelEdit() {
    const m = this.modalService.warning({
      nzTitle: '确定取消编辑吗？',
      nzContent: '放弃本次数据编辑，数据不会更改！',
      nzCancelText: '继续编辑',
      nzOnOk: () => {
        this.appS.edit = false;
        this.outEditOk.emit();
      },
      nzOnCancel: () => { console.log('取消'); }
    });
  }
  /**
   * *true:添加 | false:复制
   */
  edit(state: boolean) {
    this.appS.editId = null;
    const data = state ? getModelBase(this.dbName) : null;
    this.outEdit.emit(data);
    this.appS.edit = true;
  }

}
