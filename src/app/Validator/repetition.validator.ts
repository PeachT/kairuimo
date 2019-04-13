import { ValidatorFn, AbstractControl } from '@angular/forms';

export function reperitionValidator(value: any): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    if (control.dirty && control.root.value) {
      console.log('reperitionValidator', control, control.root.value[value]);
      for (const item of control.root.value[value]) {
        console.log(item.name, control.value);
        if (control.value !== null && item.name === control.value) {
          return {reperition : `${control.value} 已存在!!`};
        }
      }
    }
    return null;
  };
}
