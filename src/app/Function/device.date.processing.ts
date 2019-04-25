/** 设备数据换算处理 */
/** 压力系数 */
const mpaCoefficient = (4000 / 60);
/** 位移系数 */
const mmCoefficient = (4000 / 60);
/** 保留小数位数 */
function fixedNumber() {
  return 2;
}

/**
 * plc值转压力
 *
 * @export
 * @param {number} plcData plc值
 * @param {Array<number>} mapCoefficient 压力校正系数
 * @returns {number} 返回校正压力值
 */
export function plcToMpa(plcData: number, mapCoefficient: Array<number>): number {
  const mpa = plcData / mpaCoefficient;
  const index = Math.round(mpa);
  return Number((mpa * mapCoefficient[index]).toFixed(fixedNumber()));
}

/**
 * plc值转位移
 *
 * @export
 * @param {number} plcData plc值
 * @param {Array<number>} mapCoefficient 位移校正系数
 * @returns {number} 返回校正位移值
 */
export function plcToMm(plcData: number, mapCoefficient: Array<number>): number {
  const mm = plcData / mmCoefficient;
  const index = Math.round(mm);
  return Number((mm * mapCoefficient[index]).toFixed(fixedNumber()));
}

/**
 * 压力转plc值
 *
 * @export
 * @param {number} mpa 压力值
 * @returns {number} 返回plc值
 */
export function mpaToPlc(mpa: number): number {
  return Math.round(mpa * mpaCoefficient);
}

/**
 * 位移转plc值
 *
 * @export
 * @param {number} mm 位移值
 * @returns {number} 返回plc值
 */
export function mmToPlc(mm: number): number {
  return Math.round(mm * mmCoefficient);
}
