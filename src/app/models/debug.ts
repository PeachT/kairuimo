export interface DebugData {
  m5: KeyValue;
  m10: KeyValue;
  m15: KeyValue;
  m20: KeyValue;
  m25: KeyValue;
  m30: KeyValue;
  m35: KeyValue;
  m40: KeyValue;
  m45: KeyValue;
  m50: KeyValue;
  m55: KeyValue;
  mmSpeed: KeyValue;
}

export interface KeyValue {
  date: Date;
  time?: number;
  start?: number;
  end?: number;
  state?: number;
  name?: string;
}
