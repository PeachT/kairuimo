import { taskModeStr } from './jack';

export interface PLCLiveData {
  zA: PLCItem;
  zB: PLCItem;
  zC: PLCItem;
  zD: PLCItem;
  cA: PLCItem;
  cB: PLCItem;
  cC: PLCItem;
  cD: PLCItem;
}

export interface PLCItem {
  showMpa: number;
  showMm: number;
  state: string;
  alarm: Array<string>;
  autoState: Array<string>;
}
export function GetPLCLiveData(): PLCLiveData {
  const r: any = {};
  taskModeStr.AB8.map(key => {
    r[key] = {
      showMpa: 0,
      showMm: 0,
      state: '设备未连接',
      alarm: [],
      autoState: [],
    };
  });
  return r as PLCLiveData;
}

/** 伸长量与偏差率 */
export interface Elongation {
  zA: ElongationItem;
  zB: ElongationItem;
  zC: ElongationItem;
  zD: ElongationItem;
  cA: ElongationItem;
  cB: ElongationItem;
  cC: ElongationItem;
  cD: ElongationItem;
}

/**
 * 伸长量与偏差率
 *
 * @export
 * @interface ElongationItem
 */
export interface ElongationItem {
  /** 单顶 */
  mm: number;
  /** 两顶伸长量和 */
  sumMm: number;
  /** 偏差率 */
  percent: number;
  /** 回缩量 */
  remm?: number;
}
