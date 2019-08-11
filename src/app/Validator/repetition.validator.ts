import { ValidatorFn, AbstractControl } from '@angular/forms';

export function reperitionValidator(value: string, key: string = 'name'): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.dirty && control.root.value) {
      for (const item of control.root.value[value]) {
        console.log(item[key], control.value);
        if (!control.value || item[key] === control.value) {
          return { reperition: `${control.value} 已存在!!` };
        }
      }
    }
    return null;
  };
}
