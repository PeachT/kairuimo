import { Directive, forwardRef, Injectable } from '@angular/core';
import {
  AsyncValidator,
  AbstractControl,
  NG_ASYNC_VALIDATORS,
  ValidationErrors
} from '@angular/forms';
import { catchError, map, filter } from 'rxjs/operators';
import { Observable, from } from 'rxjs';
import { DbService } from '../services/db.service';

@Injectable({ providedIn: 'root' })
export class ProjectAsyncReperitionValidator implements AsyncValidator {
  constructor(private db: DbService) {}

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    console.log('159789', control.root.value);
    return from(this.db.db.project.where({projectName: control.value}).toArray()).pipe(
      map(item => {
        console.log(item);
        const count = item.filter(p => p.id !== control.root.value.id).length;
        return count > 0 ? {reperition : `${control.value} 已存在!!`} : null;
      }),
      catchError(() => null)
    );
  }
}

// @Directive({
//   selector: '[appUniqueAlterEgo]',
//   providers: [
//     {
//       provide: NG_ASYNC_VALIDATORS,
//       useExisting: forwardRef(() => UniqueAlterEgoValidator),
//       multi: true
//     }
//   ]
// })
// export class UniqueAlterEgoValidatorDirective {
//   constructor(private validator: UniqueAlterEgoValidator) {}

//   validate(control: AbstractControl) {
//     this.validator.validate(control);
//   }
// }

