import { groupBy, map } from 'rxjs/internal/operators';
import { from } from 'rxjs';

export function keyGroupBy(array: Array<any>, key: string) {
  const s = [];
  from(array).pipe(
    groupBy(t => t[key]),
    map(t => t.key)
  ).subscribe(t => s.push(t));
  return s;
}
