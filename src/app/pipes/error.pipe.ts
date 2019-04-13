import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ValidatorError' })
export class ValidatorErrorPipe implements PipeTransform {
  transform(controlsError: any): string {
    if (controlsError) {
      const e = [];
      // tslint:disable-next-line:forin
      for (const key in controlsError) {
        switch (key) {
          case 'required':
            e.push('必须输入！');
            break;
          default:
            if (controlsError[key]) {
              e.push(controlsError[key]);
            } else {
              e.push(`${key}: 未指定错误说明`);
            }
            break;
        }
      }
      return e.join(' | ');
      // console.log(this.field.key, this.form.valid, this.error);
    } else {
      return null;
    }
  }
}
