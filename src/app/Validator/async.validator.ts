import { Directive, forwardRef, Injectable } from '@angular/core';
import { AsyncValidator, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { DbService } from '../services/db.service';
import { copyAny } from '../models/base';
import { Observable, from, observable, of } from 'rxjs';
import { map, catchError, debounceTime, switchMap, first } from 'rxjs/operators';

// @Injectable({ providedIn: 'root' })
// export class RepetitionARV implements AsyncValidator {
//   private db: DbService;
//   private dbName: string;
//   private f: (o1: any, o2: any) => boolean;
//   private nowKey: string;

//   constructor(
//     db: DbService,
//     name: string,
//     f: (o1: any, o2: any) => boolean = (o1: any, o2: any) => o1.name === o2.name && o1.id !== o2.id,
//     nowkey: string = 'name') {
//     this.db = db;
//     this.dbName = name;
//     this.f = f;
//     this.nowKey = nowkey;
//   }
//   validate(
//     control: AbstractControl
//   ): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
//     const value = copyAny(control.root.value);
//     value[this.nowKey] = control.value.toString();
//     return control.valueChanges.pipe(
//       debounceTime(400),
//       switchMap(() => this.db.repetitionAsync(this.dbName, (o: any) => this.f(o, value))),
//       map(c => {
//         console.log(c);
//         return c > 0 ? { reperition: `${control.value} 已存在!!` } : null;
//       }),
//       // 每次验证的结果是唯一的，截断流
//       first()
//     );
//   }
// }

export function nameRepetition(
  db: DbService,
  name: string,
  f: (o1: any, o2: any) => boolean = (o1: any, o2: any) => o1.name === o2.name && o1.id !== o2.id,
  nowkey: string = 'name'): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.root.value;
    console.log(value);
    value[nowkey] = control.value;
    return control.valueChanges.pipe(
      // 延时防抖
      debounceTime(400),
      switchMap(() => db.repetitionAsync(name, (o: any) => f(o, value))),
      map(c => {
        console.log(c);
        return c > 0 ? { reperition: `${control.value} 已存在!!` } : null;
      }),
      catchError(() => {
        console.log('名称验证查询结果错误');
        return null;
      }),
      // 每次验证的结果是唯一的，截断流
      first()
    );
  };
}
