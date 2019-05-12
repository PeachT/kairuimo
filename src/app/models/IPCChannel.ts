export enum Channel {
  heartbeat = 'heartbeat',
  connection = 'connection',
  error = 'error'
}

/**
 * PLC D地址
 *
 * @export
 * @param {number} address D地址
 * @returns 返回modbus地址
 */
export function PLC_D(address: number) {
  return 4096 + address;
}
/**
 * PLC M地址
 *
 * @export
 * @param {number} address M地址
 * @returns 返回modbus地址
 */
export function PLC_M(address: number) {
  return 2048 + address;
}
/**
 * PLC M地址
 *
 * @export
 * @param {number} address S地址
 * @returns 返回modbus地址
 */
export function PLC_S(address: number) {
  return 0 + address;
}
/**
 * PLC M地址
 *
 * @export
 * @param {number} address S地址
 * @returns 返回modbus地址
 */
export function PLC_Y(address: number) {
  return 1280 + address;
}

