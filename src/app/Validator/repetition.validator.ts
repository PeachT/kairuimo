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

/**
 * 数组判断某个key重复
 *
 * @export
 * @param {number} index 下标
 * @param {string} arrKey 数组key
 * @param {string} [key='name'] 比较key
 * @returns {ValidatorFn}
 */
export function arrayValidator(index: number, arrKey: string, key: string): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const rootvalue = control.root.value;
    if (control.dirty && rootvalue) {
      const values = rootvalue[arrKey];
      values.splice(index, 1);
      for (const item of values) {
        if (!control.value || item[key] === control.value) {
          return { reperition: `${control.value} 已存在!!` };
        }
      }
    }
    return null;
  };
}
