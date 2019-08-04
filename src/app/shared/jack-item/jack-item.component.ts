import { Component, OnInit, Input, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { DB, DbService } from 'src/app/services/db.service';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { User } from 'src/app/models/user.models';
import { Router } from '@angular/router';
import { GroupItem, TensionTask } from 'src/app/models/task.models';
import { Observable } from 'rxjs';
import { Jack, deviceGroupModeDev } from 'src/app/models/jack';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D } from 'src/app/models/IPCChannel';
import { ReviseItemComponent } from 'src/app/shared/revise-item/revise-item.component';



@Component({
  selector: 'app-jack-item',
  templateUrl: './jack-item.component.html',
  styleUrls: ['./jack-item.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JackItemComponent implements OnInit {
  @ViewChild('reviseDom', null) reviseDom: ReviseItemComponent;
  @Input() formGroup: FormGroup;
  @Input() name: string;
  @Input() reviseBtnShow = true;

  get formItem(): FormGroup {
    return this.formGroup.get(this.name) as FormGroup;
  }

  setIndex = null;
  revise = {
    state: false,
    name: null
  };
  mmStage = ['20mm', '60mm', '100mm', '140mm', '180mm', '220mm'];

  constructor(
    private fb: FormBuilder,
    private odb: DbService,
    private message: NzMessageService,
    public appS: AppService,
    private router: Router,
    private modalService: NzModalService,
    public PLCS: PLCService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    // console.log('123123123', this.formItem.get('date'));
  }

  onRevise() {
    if (this.formGroup.value.id !== this.PLCS.jack.id) {
      this.PLCS.selectJack(this.formGroup.value.id);
    }
    this.revise.state = true;
  }
  cancel() {
    this.revise.state = false;
  }
  async handleOk() {
    const value = this.reviseDom.setForm.value;
    // console.log('保存修改校正数据', value);
    const fd = this.formGroup.value;
    // this.formGroup.controls[this.name].setValue(value);
    // this.revise.state = false;
    const upper = value.upper;
    const floot = value.floot;
    const vs = [...(value.setValue), upper, floot];
    console.log('保存位移校正', value.setValue, this.name, fd);
    const address = {A: 0, B: 1, C: 2, D: 3}[this.name[1]];
    await this.PLCS.ipcSend(`${this.name[0]}F016_float`, PLC_D(2100 + fd.saveGroup * 100 + address * 20), vs).then(() => {
      console.log(this.name[0], '主机位移校正设置完成', 2100 + fd.saveGroup * 100 + address * 20);
      fd[this.name].mm = value.setValue;
      fd[this.name].upper = value.upper;
      fd[this.name].floot = value.floot;
      this.formGroup.controls[this.name].setValue(fd[this.name]);
      // 设置全局位移校正
      this.PLCS.jack[this.name].mm = value.setValue;
      this.revise.state = false;

    }).catch(() => {
      this.message.error('位移校正写入PLC错误');
    });

    // this.PLCS.ipcSend(`${this.name[0]}F016_float`, PLC_D(2100 + this.formGroup.value.saveGroup * 100 + address * 10), value)
    // .then((data) => {
    //   console.log(data);
    //   // 设置顶位移校正
    //   const fd = this.formGroup.value[this.name];
    //   fd.mm = value;
    //   this.formGroup.controls[this.name].setValue(fd);

    //   // 设置全局位移校正
    //   this.PLCS.jack.zA.mm = fd.mm;

    //   this.revise.state = false;
    // }).catch(() => {
    //   this.message.error('设置错误');
    // });
  }
}
