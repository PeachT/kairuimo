export interface DeviceValue {
  zA?: any;
  zB?: any;
  zC?: any;
  zD?: any;
  cA?: any;
  cB?: any;
  cC?: any;
  cD?: any;
}
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
  /** 保存PLC组 */
  saveGroup: number;
  /** 状态 */
  state: boolean;
  /** 联机|单机 */
  link: boolean;
  zA: JackItem;
  zB: JackItem;
  zC: JackItem;
  zD: JackItem;
  cA: JackItem;
  cB: JackItem;
  cC: JackItem;
  cD: JackItem;
}

export interface JackItem {
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
export const taskModeStr = {
    A1: ['zA'],
    A2: ['zA', 'cA'],
    B1: ['zB'],
    B2: ['zB', 'cB'],
    AB4: ['zA', 'cA', 'zB', 'cB'],
    AB8: ['zA', 'cA', 'zB', 'cB', 'zC', 'cC', 'zD', 'cD']
};
export const modeName = {
  A1: 'A单顶',
  A2: 'A两顶',
  B1: 'B单顶',
  B2: 'B两顶',
  AB4: '四顶',
  AB8: '八顶',
};


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
/** 分组模式字符串 */
export const numberMode = [[], ['A'], ['A', 'B'], [], ['A', 'B', 'C', 'D']];

/** 顶选择菜单 */
export function carterJaskMenu(mode: number) {
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

/**
 * 获取表格合拼数据
 *
 * @export
 * @param {string} mode 设备模式
 * @param {number} [rowSpan=2] 合并行数
 * @returns
 */
export function tableDev(mode: string, rowSpan = 2) {
  return {
    zA: mode === 'A1' ? 1 : rowSpan,
    zB: mode === 'B1' ? 1 : rowSpan,
    zC: mode === 'AB8' ? rowSpan : 0,
    zD: mode === 'AB8' ? rowSpan : 0,
    cA: 0,
    cB: 0,
    cC: 0,
    cD: 0,
  };
}

/** 泵顶组模式 */
export const deviceGroupMode = [
  [],
  ['zA', 'cA'],
  ['zA', 'zB', 'cA', 'cB'],
  [],
  ['zA', 'zB', 'zC', 'zD', 'cA', 'cB', 'cC', 'cD']
];
/** 泵顶组模式 */
export const deviceGroupModeDev = {
  z: [
    [],
    ['zA', ],
    ['zA', 'zB'],
    [],
    ['zA', 'zB', 'zC', 'zD']
  ],
  c: [
    [],
    ['cA'],
    ['cA', 'cB'],
    [],
    ['cA', 'cB', 'cC', 'cD']
  ],
};
