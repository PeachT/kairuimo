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
}

export interface AB {
  kn: Array<number>;
  wordMm: number;
  theoryMm?: number;
}

/** 用户索引 */
export const TaskIndex = '++id,&name,component, project';
