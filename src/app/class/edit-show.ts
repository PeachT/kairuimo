import { copyAny } from '../models/base';

export class EditShow<T> {
  private data: T;
  private reset: () => void;
  private getMenuData: (id) => void;
  private getData: () => void;

  constructor(
    data: T,
    reset: () => void,
    getMenuData: (id) => void,
    getData: () => void) {
      this.data = data;
      this.reset = reset;
      this.getMenuData = getMenuData;
      this.getData = getData;
  }

  onMneu(data) {
    console.log('一条数据', data);
    this.data = data;
    this.reset();
  }
  /**
   * * 编辑
   */
  edit(data) {
    if (!data) {
      data = copyAny(this.data);
      data.id = null;
    }
    this.data = data;
    console.log(this.data, data);
    this.reset();
  }
  /**
   * *编辑完成
   */
  editOk(id = null) {
    console.log(id);
    if (id) {
      this.getMenuData(id);
    } else {
      this.getData();
    }
  }
}
