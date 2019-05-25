import { Pipe, PipeTransform } from '@angular/core';
import { myToFixed } from '../Function/device.date.processing';

@Pipe({ name: 'ToFixedr' })
export class ToFixedrPipe implements PipeTransform {
  transform(value: any): number {
    return Number(myToFixed(value));
  }
}
