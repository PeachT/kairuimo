import { Component, OnInit, Input } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd';

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.less']
})
export class GroupComponent implements OnInit {
  holes: any;
  sholes = [];
  group = {
    g: [],
    garr: [],
    mode: null,
  };
  gmStr = [];
  groupDevValue = {
    A: '',
    B: '',
    C: '',
    D: '',
  };
  err = {
    msg: null,
    state: false
  };

  constructor(
    private message: NzMessageService,
  ) { }

  ngOnInit() {
    console.log(this.group, this.gmStr);
  }

  /** 保存单个分组 */
  onGroupSave() {
    let str = '';
    this.gmStr.map((name, index) => {
      if (index === 0) {
        str = this.groupDevValue[name];
      } else {
        str = `${str}/${this.groupDevValue[name]}`;
      }
      this.groupDevValue[name] = null;
    });
    this.group.g.push(str);
    this.group.g = this.group.g.sort((x, y) => x < y ? 0 : 1);
    console.log(this.group.g);
    this.err.state = false;
  }
  /** 判断空名称是否存在 */
  protected ifHoleName() {
    const g = `/${this.group.g.join('/')}/`;
    this.err.state = true;
    this.err.msg = false;

    for (const name of this.gmStr) {
      const nowValue = this.groupDevValue[name];
      if (nowValue === null) {
        // this.message.warning(`${name}组名称不能为空！！`);
        this.err.msg = `${name}组名称不能为空！！`;
        this.err.state = false;
        return;
      } else if (g.indexOf(`/${nowValue}/`) !== -1) {
        // this.message.warning(`${name}组名称已经存在！！`);
        this.err.msg = `${name}组名称已经存在！！`;
        this.err.state = false;
        return;
      }
      console.log(name, nowValue);

      for (const name2 of this.gmStr) {
        if (name !== name2 && nowValue === this.groupDevValue[name2]) {
          this.err.msg = `${name}组名称与${name2}组名称重复！！`;
          this.err.state = false;
          return;
        }
      }
    }
  }
  /** 删除tag */
  protected delTag(index) {
    this.group.g.splice(index, 1);
    console.log(this.group.g);
  }
  /** 空数据 */
  open() {
    this.sholes = this.holes.holes;
    const b = [];
    const a = this.holes.holes;
    this.group.g.map((item) => {
      b.push(...item.split('/'));
    });
    this.gmStr.map((name, index) => {
      if (this.groupDevValue[name]) {
        b.push(this.groupDevValue[name]);
      }
    });
    this.sholes = a.concat(b).filter(v => !a.includes(v) || !b.includes(v));
    console.log(this.sholes, this.holes, this.group, this.sholes);
  }
  /** 选择孔 */
  holesChange(e) {
    this.ifHoleName();
  }
}
