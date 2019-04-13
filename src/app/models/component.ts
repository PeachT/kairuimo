export interface Comp {
  id?: number;
  /** 构建名称 */
  name: string;
  /** 梁数据 */
  hole: Array<Hole>;
}

/** 项目索引 */
export const compIndex = '++id,name';

export interface Hole {
  /** 名字 */
  name: string;
  /** 孔明细 */
  holes: [];
  /** 图片 */
  ImgBase64: any;
}
