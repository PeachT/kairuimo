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
    return Number(mpa.toFixed(fixedNumber()));
  } else {
    let index = Math.ceil(mpa / 10) - 1;
    index = index > 5 ? 5 : index;
    const reviseValue = index >= 0 ? mpaArr[index] : 1;
    return Number((mpa * reviseValue).toFixed(fixedNumber()));
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
    return Number(mm.toFixed(fixedNumber()));
  } else {
    let index = Math.ceil(mm / 40) - 1;
    index = index > 5 ? 5 : index;
    const reviseValue = index >= 0 ? mmArr[index] : 1;
    // console.log(reviseValue, mm, index);
    return Number((mm * reviseValue).toFixed(fixedNumber()));
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
  taskModeStr.AB8.map(key => {
    if (taskModeStr[data.mode].indexOf(key) >= 0) {
      const mm = data.record[key].mm;
      elongation[key].mm =
        Number(mm[mm.length - 1])
        - (2 * mm[0])
        + Number(mm[1])
        - Number(data.returnMm)
        - Number(data[key].wordMm);
    }
  });
  taskModeStr[data.mode].map(key => {
    if (key.indexOf('z') > -1) {
      const k = key[1];
      const mm = elongation[`z${k}`].mm + elongation[`c${k}`].mm;
      const tmm = data[key].theoryMm;
      elongation[`z${k}`].sumMm = mm.toFixed(2);
      elongation[`z${k}`].percent = ((mm - tmm) / tmm * 100).toFixed(2);
    }
  });
  return elongation;
}
