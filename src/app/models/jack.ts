export interface Jack {
  id?: any;
  name: string;
  /** 设备模式
   * 4一泵四顶
   * 2一泵两顶
   * 1一泵一顶
   */
  jackMode: number;
  /** 方程类型 */
  equation: number;
  /** 千斤顶型号 */
  jackModel: string;
  /** 油泵型号 */
  pumpModel: string;
  zA: Dev;
  zB: Dev;
  zC: Dev;
  zD: Dev;
  cA: Dev;
  cB: Dev;
  cC: Dev;
  cD: Dev;
}

export interface Dev {
  /** 千斤顶编号 */
  jackNumber: string;
  /** 油泵编号 */
  pumpNumber: string;
  /** 位移上限 */
  upper: number;
  /** 位移下限 */
  floot: number;
  /** 标定系数a */
  a: number;
  /** 标定系数b */
  b: number;
  /** 标定日期 */
  date: any;
  /** 位移校正系数 */
  mm: Array<number>;
}

/** 用户索引 */
export const JackIndex = '++id,&name';

/** 张拉模式字符串 */
export function taskModeStr(mode: string) {
  switch (mode) {
    case 'A1':
      return ['zA'];
    case 'A2':
      return ['zA', 'cA'];
    case 'B1':
      return ['zB'];
    case 'B2':
      return ['zB', 'cB'];
    case 'AB4':
      return ['zA', 'cA', 'zB', 'cB'];
    case 'AB8':
      return ['zA', 'cA', 'zB', 'cB', 'zC', 'cC', 'zD', 'cD']
    default:
      break;
  }
}

/** 分组模式字符串 */
export function groupModeStr(mode: string) {
  console.log(mode);
  switch (mode) {
    case 'A1':
    case 'A2':
      return ['A'];
    case 'B1':
    case 'B2':
      return ['B'];
    case 'AB4':
      return ['A', 'B'];
    case 'AB8':
      return ['A', 'B', 'C', 'D'];
    default:
      break;
  }
}

/** 顶选择菜单 */
export function carterJaskMenu(mode: number) {
  // const c = [
  //   {
  //     value: 0,
  //     label: 'A单顶',
  //     isLeaf: true
  //   },
  //   {
  //     value: 1,
  //     label: 'A两顶',
  //     isLeaf: true
  //   },
  // ];
  // if (mode > 1) {
  //   c.push(...[
  //     {
  //       value: 2,
  //       label: 'B单顶',
  //       isLeaf: true
  //     },
  //     {
  //       value: 3,
  //       label: 'B两顶',
  //       isLeaf: true
  //     },
  //     {
  //       value: 4,
  //       label: '四顶',
  //       isLeaf: true
  //     },
  //   ]);
  // }
  // if (mode > 2) {
  //   c.push(...[
  //     {
  //       value: 5,
  //       label: '八顶',
  //       isLeaf: true
  //     }
  //   ]);
  // }
  const c: any = [
    {
      value: 'A1',
      label: 'A单顶',
      isLeaf: true
    },
    {
      value: 'A2',
      label: 'A两顶',
      isLeaf: true
    },
  ];
  if (mode > 1) {
    c.push(...[
      {
        value: 'B1',
        label: 'B单顶',
        isLeaf: true
      },
      {
        value: 'B2',
        label: 'B两顶',
        isLeaf: true
      },
      {
        value: 'AB4',
        label: '四顶',
        isLeaf: true
      },
    ]);
  }
  if (mode > 2) {
    c.push(...[
      {
        value: 'AB8',
        label: '八顶',
        isLeaf: true
      }
    ]);
  }
  return c;
}

/** 获取表格合拼数据 */
export function tableDev(mode: string) {
  let zA = 0;
  let zB = 0;
  if (mode === 'AB4' || mode === 'AB8') {
    zA = 2;
    zB = 2;
  }
  if (mode === 'A2') {
    zA = 2;
  }
  if (mode === 'B2') {
    zA = 2;
  }
  return {
    zA: mode === 'A1' ? 1 : zA,
    zB: mode === 'B1' ? 1 : zB,
    zC: mode === 'AB8' ? 2 : 0,
    zD: mode === 'AB8' ? 2 : 0,
    cA: 0,
    cB: 0,
    cC: 0,
    cD: 0,
  };
}
