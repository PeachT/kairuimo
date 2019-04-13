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
}
