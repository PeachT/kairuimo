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
    const index = Math.ceil(mpa / 10) - 1;
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
    const index = Math.ceil(mm / 40) - 1;
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
    const index = Math.ceil(mpa / 10);
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
    const index = Math.ceil(mm / 40);
    return Math.ceil(mm / mmArr[index] * mmCoefficient);
  }
}
