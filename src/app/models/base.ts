const base = {
  project: {
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
    name: null,
    jackMode: 2,
    equation: null,
    jackModel: null,
    pumpModel: null,
    zA: {
      jackNumber: null,
      pumpNumber: null,
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    zB: {
      jackNumber: null,
      pumpNumber: null,
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    zC: {
      jackNumber: null,
      pumpNumber: null,
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    zD: {
      jackNumber: null,
      pumpNumber: null,
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    cA: {
      jackNumber: null,
      pumpNumber: null,
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    cB: {
      jackNumber: null,
      pumpNumber: null,
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    cC: {
      jackNumber: null,
      pumpNumber: null,
      upper: 180,
      floot: 105,
      a: 1,
      b: 0,
      date: null,
      mm: [1, 1, 1, 1, 1, 1],
    },
    cD: {
      jackNumber: null,
      pumpNumber: null,
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
    name: null,
    password: null,
    jurisdiction: 0
  }
};

export function getModelBase(name: string) {
  return Object.assign(JSON.parse(JSON.stringify(base[name])));
}

export function copyAny(data: any) {
  return Object.assign(JSON.parse(JSON.stringify(data)));
}
