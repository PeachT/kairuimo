import { GroupItem } from '../models/task.models';
import { taskModeStr } from '../models/jack';
import { ElongationItem, Elongation } from '../models/live';

/** 设备数据换算处理 */
/** 压力系数 */
const mpaCoefficient = (4000 / 60);
/** 位移系数 */
const mmCoefficient = (4000 / 225);
/** 保留小数位数 */
function fixedNumber() {
  return 2;
}

/**
 * plc值转压力
 *
 * @export
 * @param {number} plcData plc值
 * @param {Array<number>} mpaArr 压力校正系数 =null时直接换算
 * @returns {number} 返回校正压力值
 */
export function plcToMpa(plcData: number, mpaArr: Array<number>): number {
  const mpa = plcData / mpaCoefficient;
  if (mpaArr === null) {
    return myToFixed(mpa);
  } else {
    let index = Math.ceil(mpa / 10) - 1;
    index = index > 5 ? 5 : index;
    const reviseValue = index >= 0 ? mpaArr[index] : 1;
    return myToFixed((mpa * reviseValue));
  }
}

/**
 * plc值转位移
 *
 * @export
 * @param {number} plcData plc值
 * @param {Array<number>} mmArr 位移校正系数 =null时直接换算
 * @returns {number} 返回校正位移值
 */
export function plcToMm(plcData: number, mmArr: Array<number>): number {
  const mm = plcData / mmCoefficient;
  if (mmArr === null) {
    return myToFixed(mm);
  } else {
    let index = Math.ceil(mm / 40) - 1;
    index = index > 5 ? 5 : index;
    const reviseValue = index >= 0 ? mmArr[index] : 1;
    // console.log(reviseValue, mm, index);
    return myToFixed(mm * reviseValue);
  }
}

/**
 * 压力转plc值
 *
 * @export
 * @param {number} mpa 压力值
 * @param {Array<number>} mpaArr 压力校正系数 =null时直接换算
 * @returns {number} 返回plc值
 */
export function mpaToPlc(mpa: number, mpaArr: Array<number>): number {
  if (!mpa) {
    return 0;
  }
  if (mpaArr === null) {
    return Math.ceil(mpa * mpaCoefficient);
  } else {
    let index = Math.ceil(mpa / 10);
    index = index > 5 ? 5 : index;
    return Math.ceil(mpa / mpaArr[index] * mpaCoefficient);
  }
}

/**
 * 位移转plc值
 *
 * @export
 * @param {number} mm 位移值
 * @param {Array<number>} mmArr 位移校正系数 =null时直接换算
 * @returns {number} 返回plc值
 */
export function mmToPlc(mm: number, mmArr: Array<number>): number {
  console.log(mm, mmArr);
  if (!mm) {
    return 0;
  }
  if (mmArr === null) {
    return Math.ceil(mm * mmCoefficient);
  } else {
    let index = Math.ceil(mm / 40);
    index = index > 5 ? 5 : index;
    return Math.ceil(mm / mmArr[index] * mmCoefficient);
  }
}

export function TensionMm(data: GroupItem): Elongation {
  const elongation: Elongation = {
    zA: { mm: 0, sumMm: 0, percent: 0 },
    zB: { mm: 0, sumMm: 0, percent: 0 },
    zC: { mm: 0, sumMm: 0, percent: 0 },
    zD: { mm: 0, sumMm: 0, percent: 0 },
    cA: { mm: 0, sumMm: 0, percent: 0 },
    cB: { mm: 0, sumMm: 0, percent: 0 },
    cC: { mm: 0, sumMm: 0, percent: 0 },
    cD: { mm: 0, sumMm: 0, percent: 0 },
  };
  /** 单顶位移 */
  taskModeStr[data.mode].map(key => {
    const mm = data.record[key].mm;
    // console.log('位移数据', mm, key, data.twice && data.record.twice);
    if (data.twice && data.record.twice && mm.length > 3) {
      elongation[key].mm = myToFixed(
        Number(mm[2]) - (2 * mm[0]) + Number(mm[1])
        + Number(mm[mm.length - 1]) - Number(mm[3])
        - Number(data.returnMm)
        - Number(data[key].wordMm)
      );
    } else {
      elongation[key].mm = myToFixed(
        Number(mm[mm.length - 1]) - (2 * mm[0]) + Number(mm[1])
        - Number(data.returnMm)
        - Number(data[key].wordMm)
      );
    }
  });
  taskModeStr[data.mode].map(key => {
    if (key.indexOf('z') > -1) {
      const k = key[1];
      const mm = elongation[`z${k}`].mm + elongation[`c${k}`].mm;
      const tmm = data[key].theoryMm;
      elongation[`z${k}`].sumMm = myToFixed(mm);
      elongation[`z${k}`].percent = myToFixed((mm - tmm) / tmm * 100);
    }
  });
  return elongation;
}

/**
 *  *保留小数点
 */
export function myToFixed(data): number {
  let length = Number(localStorage.getItem('FicedLength'));
  if (!length) {
    localStorage.setItem('FicedLength', '2');
    length = 2;
  }
  return Number(data.toFixed(length));
}
