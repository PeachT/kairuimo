import { OtherInfo } from './common';
import { IBase } from './base';
import { JackItem, Jack } from './jack';

export interface TensionTask extends IBase {
  // id?: any;
  // name: string;
  project: number;
  device: any;
  component: any;
  steelStrand: string;
  otherInfo: Array<OtherInfo>;
  holeRadio: string;
  startDate: any;
  entDate: any;
  groups: Array<GroupItem>;
  jack?: Jack;
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
  /** 二次张拉 */
  twice: boolean;
  /** 超张拉 */
  super: boolean;
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
  /** 张拉状态 0未 1张拉中断2完成 3偏差不合格 4二次张拉 */
  state: number;
  make: Array<Make>;
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
  reData: {
    map: number;
    mm: number;
  };
}

export interface Make {
  msg?: any;
  index?: number;
}
export interface AB {
  kn: Array<number>;
  wordMm: number;
  theoryMm?: number;
}

export interface TaskJack {
  zA?: JackItem;
  zB?: JackItem;
  zC?: JackItem;
  zD?: JackItem;
  cA?: JackItem;
  cB?: JackItem;
  cC?: JackItem;
  cD?: JackItem;
}

/** 用户索引 */
export const TaskIndex = '++id, name, component, project';
