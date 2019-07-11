export interface IBase {
  /** Id */
  id?: any;
  /** 名称 */
  name: string;
  /** 创建日期 */
  createdDate?: any;
  /** 修改日期 */
  modificationDate?: any;
  /** 创建用户 */
  user?: any;
}

const base = {
  project: {
    id: null,
    createdDate: null,
    modificationDate: null,
    user: null,
    name: null,
    otherInfo: [],
    supervisions: [
      {
        name: null,
        phone: null,
        unit: null,
        ImgBase64: null,
      }
    ],
  },
  comp: {
    id: null,
    createdDate: null,
    modificationDate: null,
    user: null,
    name: null,
    hole: [
      {
        name: null,
        ImgBase64: null,
        holes: []
      }
    ],
  },
  jack: {
    id: null,
    createdDate: null,
    modificationDate: null,
    user: null,
    name: null,
    jackMode: 2,
    equation: false,
    jackModel: null,
    pumpModel: null,
    zA: {
      jackNumber: 'zA',
      pumpNumber: 'Z',
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    zB: {
      jackNumber: 'zB',
      pumpNumber: 'Z',
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    zC: {
      jackNumber: 'zC',
      pumpNumber: 'Z',
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    zD: {
      jackNumber: 'zD',
      pumpNumber: 'Z',
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    cA: {
      jackNumber: 'cA',
      pumpNumber: 'C',
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    cB: {
      jackNumber: 'cB',
      pumpNumber: 'C',
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    cC: {
      jackNumber: 'cC',
      pumpNumber: 'C',
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    cD: {
      jackNumber: 'cD',
      pumpNumber: 'C',
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
  },
  users: {
    id: null,
    createdDate: null,
    modificationDate: null,
    user: null,
    name: null,
    password: null,
    jurisdiction: 0,
    operation: ['see']
  },
  task: {
    id: null,
    createdDate: null,
    modificationDate: null,
    user: null,
    name: null,
    project: null,
    device: null,
    component: null,
    steelStrand: null,
    otherInfo: [{key: '浇筑日期', value: null}],
    holeRadio: null,
    groups: [],
  },
};

export function getModelBase(name: string) {
  return Object.assign(JSON.parse(JSON.stringify(base[name])));
}

export function copyAny(data: any) {
  return Object.assign(JSON.parse(JSON.stringify(data)));
}
