import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { User, userIndex } from '../models/user.models';
import { TensionTask, TaskIndex } from '../models/task.models';
import { Jack, JackIndex } from '../models/jack';
import { Project, projectIndex } from '../models/project';
import { Observable, from, empty } from 'rxjs';
import { filter, map, every } from 'rxjs/operators';
import { ValidationErrors } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd';
import { Comp, compIndex } from '../models/component';
import { Menu } from '../models/menu';

@Injectable({ providedIn: 'root' })
export class DbService {
  public db: DB;
  constructor(
    private message: NzMessageService,
  ) {
    // tslint:disable-next-line: no-use-before-declare
    this.db = new DB();
    // this.db.open();
    console.log(this.db);
  }

  /** 判断数据是否重复 */
  // tslint:disable-next-line:max-line-length
  public async repetitionAsync<T>(tName: string, filterFunction: (o1: T) => boolean) {
    const count = await this.db[tName].filter(filterFunction).count();
    return count;
  }

  public async addAsync<T>(tName: string, data: T, filterFunction: (o1: T) => boolean) {
    if (await this.repetitionAsync(tName, filterFunction) > 0) {
      return {success: false, msg: '已存在'};
    }
    try {
      const r = await this.db[tName].add(data);
      console.log('保存结果', r);
      return {success: true, id: r};
    } catch (error) {
      console.log('错误', error);
      return {success: false, msg: error};
    }
  }

  public async updateAsync(tName: string, data: Project | TensionTask | Comp | User, filterFunction: (obj: any) => boolean) {
    if (await this.repetitionAsync(tName, filterFunction) > 0) {
      return {success: false, msg: '已存在'};
    }
    try {
      const r = await this.db[tName].update(data.id, data);
      console.log('保存结果', r);
      return {success: true, id: data.id};
    } catch (error) {
      console.log('错误', error);
      return {success: false, msg: error};
    }
  }
  /** 判断数据是否重复 */
  // tslint:disable-next-line:max-line-length
  public repetition(tName: string, filterFunction: (obj: Project | TensionTask | Comp | User) => boolean): Observable<boolean> {
    return from(this.db[tName].filter(filterFunction).count()).pipe(
      map(item => {
          return item > 0;
        }),
    );
  }
  /**
   * 添加一条新数据
   *
   * @param {string} tName 表名称
   * @param {Project | TensionTask} data 数据
   * @param {{ (obj: any): boolean;}} filterFunction 判断重复
   * @returns {(Observable<number | null>)} 成功返回id 失败错误返回null'
   * @memberof DbService
   */
  public add(tName: string, data: Project | TensionTask | Comp | User,
             filterFunction: (obj: any) => boolean): Observable<number | null> {
    return this.repetition(tName, filterFunction).pipe(
      map(item => {
        return item ?  Observable.create(_ => null) : from(this.db[tName].add(data));
      })
    );
  }
  public update(tName: string, data: Project | TensionTask | Comp | User,
                filterFunction: (obj: any) => boolean): Observable<number | null> {
    return this.repetition(tName, filterFunction).pipe(
      map(item => {
        return item ?  Observable.create(_ => null) : from(this.db[tName].update(data.id, data));
      })
    );
  }

  public getAllAsync(name: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const r = [];
      const s = await this.db.task.each(v => {
        r.push({ label: v.name, value: v.id, checked: false });
      });
      console.log(r, s);
      resolve(r);
    });
    // const ss = await this.db[name].toArray();
    // console.log(ss);
  }
  /**
   * 获取菜单数据
   *
   * @param {string} name 数据库名称
   * @returns {Promise<any>}
   * @memberof DbService
   */
  public async getMenuData(name: string): Promise<Array<Menu>> {
    const r = [];
    const s = await this.db[name].each(v => {
      r.push({ name: v.name, id: v.id });
    });
    return r;
  }
  /**
   * *通过ID获取一点一个数据
   *
   * @template T 类型
   * @param {string} name 数据库名称
   * @param {*} id id
   * @returns {Promise<T>}
   * @memberof DbService
   */
  public async getFirstId<T>(name: string, id: any): Promise<T> {
    return await this.db[name].filter(a => a.id === id).first();
  }
}

export class DB extends Dexie {
  users!: Dexie.Table<User, number>; // id is number in this case
  task!: Dexie.Table<TensionTask, number>; // id is number in this case
  jack!: Dexie.Table<Jack, number>; // id is number in this case
  project!: Dexie.Table<Project, number>; // id is number in this case
  comp!: Dexie.Table<Comp, number>; // id is number in this case
  // projects!: Dexie.Table<Project, number>; // id is number in this case

  public constructor() {
    super('KVMDB');
    this.version(1).stores({
      users: userIndex,
      task: TaskIndex,
      jack: JackIndex,
      project: projectIndex,
      comp: compIndex,
    });
    this.open();
  }
}

export enum tableName {
  users = 'users',
  task = 'task',
  jack = 'jack',
  project = 'project',
  comp = 'comp',
}
