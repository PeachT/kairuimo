import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { DB, DbService, tableName } from 'src/app/services/db.service';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { AppService } from 'src/app/services/app.service';
import { User } from 'src/app/models/user.models';
import { Router } from '@angular/router';
import { GroupItem, TensionTask } from 'src/app/models/task.models';
import { Observable } from 'rxjs';
import { Jack } from 'src/app/models/jack';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D } from 'src/app/models/IPCChannel';
import { ManualComponent } from '../manual/manual.component';
import { Project } from 'src/app/models/project';
import { ProjectComponent as appProjectComponent } from 'src/app/shared/project/project.component';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.less']
})
export class ProjectComponent implements OnInit {
  @ViewChild('prjDom')
  prjDom: appProjectComponent;
  db: DB;
  data: Project;

  menu = {
    datas: [],
    select: null,
  };

  constructor(
    private fb: FormBuilder,
    private odb: DbService,
    private message: NzMessageService,
    public appS: AppService,
    private router: Router,
    private modalService: NzModalService,
    public PLCS: PLCService,
  ) {
    this.db = this.odb.db;
  }

  ngOnInit() {
    this.getMneu();
  }

  getMneu(): Promise<void> {
    // tslint:disable-next-line:no-unused-expression
    return new Promise((resolve, reject) => {
      this.db.project.toArray().then((d) => {
        console.log(d);
        this.menu.datas = d.map(item => {
          return { name: item.projectName, id: item.id };
        });
        resolve();
      }).catch(() => {
        this.message.error('获取菜单数据错误!!');
        reject();
      });
    });
  }
  onMneu(id, copy = null) {
    console.log('选项目', id);
    console.log(this.menu);
    if (!id || this.ifEdit()) { return; }
    if (id !== null) {
      this.menu.select = id;
      this.db.project.filter(a => a.id === id).first().then((p: Project) => {
        console.log(p);
        this.data = p;
        this.prjDom.reset(this.data);
      }).catch(() => {
      });
    } else {
      this.menu.select = null;
      if (copy) {
        this.data = copy;
      } else {
        this.data = {
          projectName: null,
          otherInfo: [],
          supervisions: [
            {
              name: null,
              phone: null,
              unit: null,
              ImgBase64: null,
            }
          ],
        };
      }
      this.appS.edit = true;
      this.prjDom.reset(this.data);
    }
    console.log(this.menu);
  }

  /** 保存数据 */
  save() {
    this.prjDom.save((data) => {
      console.log(data);
       // 添加
      if (!data.id) {
        delete data.id;
        this.odb.add(tableName.project, data, (p: Project) => p.projectName === data.projectName).subscribe((r) => {
          if (r !== null) {
            this.message.success('添加成功🙂');
            this.appS.edit = false;
            this.menu.select = null;
            this.getMneu().then(() => {
              this.onMneu(data.id);
            }, (err) => {
              this.message.error('添加失败😔');
              console.log(err);
            });
          }
        });
      } else {
        this.odb.update(tableName.project, data, (p: Project) => p.projectName === data.projectName && data.id !== p.id).subscribe((r) => {
          if (r !== null) {
            this.message.success('修改成功🙂');
            this.appS.edit = false;
          } else {
            this.message.error(`修改失败😔`);
          }
        }, (err) => {
          this.message.error(`修改错误！😔${err}`);
        });
      }
    });
  }
  /** 取消编辑 */
  cancelEdit() {
    const m = this.modalService.warning({
      nzTitle: '确定取消编辑吗？',
      nzContent: '放弃本次数据编辑，数据不会更改！',
      nzCancelText: '继续编辑',
      nzOnOk: () => {
        this.appS.edit = false;
        this.data = null;
        // menu.selectComponent
        // menu.selectBridge
        this.prjDom.data = null;
        this.prjDom.createForm();
        if (this.menu.select) {
          this.onMneu(this.menu.select);
        }
        // m.close();
      },
      nzOnCancel: () => { console.log('取消'); }
    });
  }
  /** 添加 */
  add() {
    this.onMneu(null);
  }
  /** 修改 */
  modification() {
    this.appS.edit = true;
  }

  /** 复制 */
  copy() {
    console.log('复制');
    const copy = Object.assign(JSON.parse(JSON.stringify(this.data)), { projectName: null });
    delete copy.id;
    this.onMneu(null, copy);
  }

  /** 判断编辑状态 */
  ifEdit(): boolean {
    if (this.appS.edit) {
      this.message.warning('请完成编辑！');
      return true;
    }
    return false;
  }
}
