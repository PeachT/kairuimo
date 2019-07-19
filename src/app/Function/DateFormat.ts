import { GroupItem } from '../models/task.models';

/**
 * 时间格式化
 *
 * @param {Date} date 格式化的时间
 * @param {string} fmt 格式化格式
 * @returns 格式化时间
 */
export function DateFormat(date: Date, fmt: string): string { // author: meizz
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小 时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds() // 毫秒
  };
  // tslint:disable-next-line:curly
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  // tslint:disable-next-line:forin
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
  }
  return fmt;
}

export function getTensionDate(groups: Array<GroupItem>): Array<number> {
  const ds = [];
  groups.map(g => {
    if (g.record) {
      ds.push(g.record.time[1]);
    }
  });
  const max = Math.max.apply(null, ds);
  const min = Math.min.apply(null, ds);
  return [min, max];
}
