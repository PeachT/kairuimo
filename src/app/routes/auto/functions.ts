import { GroupItem } from 'src/app/models/task.models';
import { PLCLiveData } from 'src/app/models/live';

const devName = {
  group: ['z', 'c'],
  item: ['A', 'B', 'C', 'D']
};
function createData<T>(value: T): { [propName: string]: T } {
  const r: { [propName: string]: T } = {};
  devName.group.map(g => {
    devName.item.map(gi => {
      r[`${g}${gi}`] = value;
    });
  });
  return r;
}
function groupData(data): { [propName: string]: Array<any> } {
  const r: { [propName: string]: Array<any> } = {};
  devName.group.map(g => {
    const arr = [];
    devName.item.map(gi => {
      arr.push(data[`${g}${gi}`]);
    });
    r[g] = arr;
  });
  return r;
}

/** 下载数据处理 */
export function data_processiong(data: GroupItem, dev: Array<string>, stage: number): { [propName: string]: Array<number> } {
  const cd = createData(0);
  dev.map((item) => {
    cd[item] = data[item].kn[stage];
  });
  return groupData(cd);
}

/** 张拉平衡 */
export function balance(PLC: PLCLiveData, dev: Array<string>, balanceValue: number): { [propName: string]: Array<boolean> } {
  const cd = createData(false);
  dev.map((key) => {
    dev.map((key2) => {
      if (PLC[key].showMm > PLC[key2].showMm + balanceValue) {
        cd[key] = true;
      }
    });
  });
  return groupData(cd);
}
/** 张拉保压 */
export function pressurize(PLC: PLCLiveData, dev: Array<string>): boolean {
  let state = false;
  dev.map(key => {
    state = PLC[key].state === '到达压力';
  });
  return state;
}
