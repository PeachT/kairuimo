export interface TensionTask {
  id?: any;
  name: string;
  project: number;
  device: string;
  component: string;
  steelStrand: string;
  holeRadio: string;
  groups: Array<GroupItem>;
}
export interface GroupItem {
  name: string;
  mode: string;
  length: number;
  tensionKn: number;
  steelStrandNumber: number;
  tensionStage: number;
  stage: Array<number>;
  time: Array<number>;
  returnMm: number;
  twice: boolean;
  zA?: AB;
  zB?: AB;
  zC?: AB;
  zD?: AB;
  cA?: AB;
  cB?: AB;
  cC?: AB;
  cD?: AB;
  record?: Record;
}
/** 记录 */
export interface Record {
  tensionStage: number;
  twice: boolean;
  time: Array<string | number>;
  zA?: Curve;
  zB?: Curve;
  zC?: Curve;
  zD?: Curve;
  cA?: Curve;
  cB?: Curve;
  cC?: Curve;
  cD?: Curve;
}
export interface Curve {
  mapData: Array<number>;
  mmData: Array<number>;
  make: Array<Make>;
  mpa: Array<number>;
  mm: Array<number>;
}

export interface Make {
  msg?: string;
    index?: number;
}
export interface AB {
  kn: Array<number>;
  wordMm: number;
  theoryMm?: number;
}

/** 用户索引 */
export const TaskIndex = '++id,&name,component, project';