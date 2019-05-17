/**
 * 登录用户
 *
 * @export
 */
export interface LoginUser {
  name: string;
  jurisdiction: number;
  nameId: string;
}

/**
 * 注册用户
 *
 * @export
 */
export interface User {
  /** id */
  id?: string;
  /** 名称 */
  name: string;
  /** 密码 */
  password: string;
  /** 超级管理员 */
  jurisdiction: number;
}
/** 用户索引 */
export const userIndex = '++id,&name';
