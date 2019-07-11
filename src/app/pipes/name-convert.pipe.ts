import { Pipe, PipeTransform } from '@angular/core';
import { nameConvert } from '../Function/device.date.processing';

@Pipe({ name: 'nameConvert' })
export class NameConvertPipe implements PipeTransform {
  transform(name: string): string {
    return nameConvert(name);
  }
}
