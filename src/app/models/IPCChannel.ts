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

