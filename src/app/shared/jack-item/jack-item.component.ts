import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { DB, DbService } from 'src/app/services/db.service';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { User } from 'src/app/models/user.models';
import { Router } from '@angular/router';
import { GroupItem, TensionTask } from 'src/app/models/task.models';
import { Observable } from 'rxjs';
import { Jack } from 'src/app/models/jack';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D } from 'src/app/models/IPCChannel';
import { ReviseItemComponent } from 'src/app/shared/revise-item/revise-item.component';



@Component({
  selector: 'app-jack-item',
  templateUrl: './jack-item.component.html',
  styleUrls: ['./jack-item.component.less']
})
export class JackItemComponent implements OnInit {
  @ViewChild('reviseDom')
    reviseDom: ReviseItemComponent;
  @Input()
  formGroup: FormGroup;
  @Input()
  name: string;
  @Input()
  reviseBtnShow = true;

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
  ) { }

  ngOnInit() {
  }

  onRevise() {
    this.revise.state = true;
  }
  cancel() {
    this.revise.state = false;
  }
  handleOk() {
    console.log(this.reviseDom.setForm.value);
    // const value = this.reviseDom.setForm.value.setValue;
    // // const address = this.revise.name.indexOf('A') > -1 ? 500 : 520;
    // let address = 500;
    // switch (this.revise.name) {
    //   // case 'zA':
    //   //   address = 500;
    //   //   break;
    //   case 'zB':
    //     address = 512;
    //     break;
    //   case 'zC':
    //     address = 524;
    //     break;
    //   case 'zD':
    //     address = 536;
    //     break;
    //   default:
    //     break;
    // }
    // const dev = this.revise.name.indexOf('z') > -1 ? 'z' : 'c';
    // console.log(value, address, dev);
    // this.PLCS.ipcSend(`${dev}F016_float`, PLC_D(address), value).then(() => {
    //   this.revise.state = false;
    //   // this.getRevise(dev);
    // });
  }
}
