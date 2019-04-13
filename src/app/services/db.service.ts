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
  public repetition(tName: string, filterFunction: { (obj: Project | TensionTask | Comp | User): boolean; projectName?: any; }): Observable<boolean> {
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
   * @param {{ (obj: any): boolean; projectName?: any; }} filterFunction 判断重复
   * @returns {(Observable<number | null>)} 成功返回id 失败错误返回null'
   * @memberof DbService
   */
  public add(tName: string, data: Project | TensionTask | Comp | User,
             filterFunction: { (obj: any): boolean; projectName?: any; }): Observable<number | null> {
    return this.repetition(tName, filterFunction).pipe(
      map(item => {
        return item ?  Observable.create(_ => null) : from(this.db[tName].add(data));
      })
    );
  }
  public update(tName: string, data: Project | TensionTask | Comp | User,
                filterFunction: { (obj: any): boolean; projectName?: any; }): Observable<number | null> {
    return this.repetition(tName, filterFunction).pipe(
      map(item => {
        return item ?  Observable.create(_ => null) : from(this.db[tName].update(data.id, data));
      })
    );
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
    });
    this.version(2).stores({
      users: userIndex,
      task: TaskIndex,
      jack: JackIndex,
      project: projectIndex,
      comp: compIndex,
    });
    this.version(3).stores({
      comp: compIndex,
    });
    // this.version(3).stores({
    //   users: userIndex,
    //   task: TaskIndex,
    //   jack: JackIndex,
    // });
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
