import { IBase } from './base';

/**
 * 登录用户
 *
 * @export
 */
export interface LoginUser {
  name: string;
  jurisdiction: number;
  nameId: string;
  operation: Array<string>;
}

/**
 * 注册用户
 *
 * @export
 */
export interface User extends IBase {
  /** id */
  // id?: string;
  // /** 名称 */
  // name: string;
  /** 密码 */
  password: string;
  /** 超级管理员 */
  jurisdiction: number;
  operation?: any;
}
/** 用户索引 */
export const userIndex = '++id,&name';
