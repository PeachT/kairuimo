import { Directive, forwardRef, Injectable } from '@angular/core';
import { AsyncValidator, AbstractControl } from '@angular/forms';
import { DbService } from '../services/db.service';

@Injectable({ providedIn: 'root' })
export class RepetitionARV implements AsyncValidator {
  private db: DbService;
  private dbName: string;
  private filter: (o1: any, o2: any) => boolean;
  private nowKey: string;

  constructor(db: DbService, name: string,
              f: (o1: any, o2: any) => boolean = (o1: any, o2: any) => o1.name === o2.name && o1.id !== o2.id,
              nowkey: string = 'name') {
    this.db = db;
    this.dbName = name;
    this.filter = f;
    this.nowKey = nowkey;
  }

  async validate(control: AbstractControl) {
    console.log('1597899999999999999999999', control.root.value, control.value);
    const value = control.root.value;
    value[this.nowKey] = control.value;

    const count = await this.db.repetitionAsync(this.dbName, (o: any) => this.filter(o, value));
    return count > 0 ? {reperition : `${control.value} 已存在!!`} : null;
  }
}
