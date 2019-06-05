import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'GetPathName' })
export class GetPathNamePipe implements PipeTransform {
  transform(path: string): string {
    const i = path.lastIndexOf('/');
    return path.substring(i + 1);
  }
}
