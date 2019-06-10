import { OtherInfo } from './common';

/**
 * 项目
 *
 * @export
 * @interface Project
 * @extends {Base}
 */
export interface Project {
  id?: number;
  /** 项目名称 */
  projectName: string;
  // /** 分布工程 */
  // divisionProject: string;
  // /** 施工单位 */
  // constructionUnit: string;
  // /** 分项工程 */
  // subProject: string;
  // /** 单位工程 */
  // unitProject: string;
  // /** 工程部位 */
  // engineeringSite: string;
  // /** 合同段 */
  // contractSection: string;
  // /** 桩号范围 */
  // stationRange: string;
  /** 监理 */
  supervisions: Array<Supervision>;
  /** 其他信息 */
  otherInfo: Array<OtherInfo>;
}

/** 项目索引 */
export const projectIndex = '++id,projectName';

export interface Supervision {
  /** 名字 */
  name: string;
  /** 联系方式 */
  phone: string;
  /** 监理公司 */
  unit: string;
  /** 头像 */
  ImgBase64: any;
}

