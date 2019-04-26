export interface MpaRevise {
  zA: Array<number>;
  zB: Array<number>;
  zC: Array<number>;
  zD: Array<number>;
  cA: Array<number>;
  cB: Array<number>;
  cC: Array<number>;
  cD: Array<number>;
}

export interface AutoDate {
  /** 压力差Mpa */
  pressureDifference: number;
  /** 超伸长量% */
  superElongation: number;
  /** 张拉平衡mm */
  tensionBalance: number;
  /** 回顶位移mm */
  backMm: number;
  /** 卸荷延时s */
  unloadingDelay: number;
}
