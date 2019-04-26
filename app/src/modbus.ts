// import ModbusRTU from 'modbus-serial';
import { app, BrowserWindow, ipcMain } from 'electron';
const ModbusRTU = require('modbus-serial');
import { bf } from './bufferToNumber';
import { Channel } from './IPCChannel';
import { cpus } from 'os';

interface ConnectionStr {
  ip: string;
  port: number;
  address: number;
}
export class ModbusTCP {
  private connectionStr: ConnectionStr;
  private connectionFunc: any;
  /** 正在链接状态 */
  private cs = false;
  private win: BrowserWindow;
  private heartbeatT: any;
  private dev: string;

  public heartbeatRate = 1000;
  public client: any = null;
  overtimeT: any;
  constructor(connectionStr: ConnectionStr, win: BrowserWindow) {
    this.connectionStr = connectionStr;
    this.dev = connectionStr.ip === '192.168.1.15' ? 'z' : 'c';
    this.win = win;
    this.connection();
  }
  /**
   * Modbus 链接
   *
   * @param {ConnectionStr} [cStr=this.connectionStr] 链接字符串信息
   * @returns
   * @memberof ModbusTCP
   */
  public connection(cStr: ConnectionStr = this.connectionStr) {
    console.log(this.dev, '-- connention--- 0000');
    // if (this.overtimeT === null && !this.cs) {
    //   this.overtime();
    // }
    if (!this.cs && this.connectionState()) {
      this.IPCSend(`${this.dev}connection`, '设备链接正常');
      return;
    }
    console.log(this.dev, '-- connention -- 11111');
    this.cs = true;
    this.IPCSend(`${this.dev}connection`, '设备正在连接.....', );

    this.client = new ModbusRTU();
    console.log(this.dev, '---------time', this.client.getTimeout());
    this.client.setTimeout(5000);
    console.log(this.dev, '---------time2', this.client.getTimeout());
    this.client.connectTCP(cStr.ip, { port: cStr.port }).then(() => {
      this.cs = false;

      this.client.setID(cStr.address);
      this.IPCSend(`${this.dev}----connection`, { state: '链接成功', client: this.client });

      this.heartbeat();
    }).catch((err) => {
      this.cs = false;

      console.log(`${this.dev}---error`, err);

      this.IPCSend(`${this.dev}---error`, { state: '链接失败', client: this.client, err });

      this.overtime();
    });
  }
  private overtime() {
    if (this.overtimeT) {
      return;
    }
    // this.client = null;
    console.log(this.dev, '89////---', this.client._port.isOpen);
    if (!this.client._port.isOpen) {
      this.client.close((o) => {
        console.log('close');
        this.IPCSend(`${this.dev}error`, { state: '关闭链接', client: this.client._port.isOpen});
      });
    } else {
      this.heartbeat();
    }
    this.overtimeT = setTimeout(() => {
      clearTimeout(this.overtimeT);
      this.overtimeT = null;
      console.log('overtime');
      this.cs = false;
      // if (!this.connectionState()) {
      //   this.connection();
      // }
      this.client.open((o) => {
        if (!this.client._port.isOpen) {
          this.overtime();
        } else {
          this.heartbeat();
        }
        console.log('open');
        this.IPCSend(`${this.dev}error`, { state: '打开链接', client: this.client._port.isOpen});
      });
    }, 10000);
  }
  /** 心跳包 */
  private heartbeat() {
    // if (this.heartbeatT) {
    //   clearInterval(this.heartbeatT);
    //   this.heartbeatT = null;
    // }
    // this.heartbeatT = setInterval(() => {
    //   if (this.ifClient()) {
    //     this.client.readHoldingRegisters(4096, 30).then((data) => {
    //       const float = bf.bufferToFloat(data.buffer);
    //       this.IPCSend(`${this.dev}heartbeat`, { float, int16: data.data });
    //     }).catch((err) => {
    //       this.IPCSend(`${this.dev}error`, err);
    //     });
    //   } else {
    //     console.log('123456789');
    //     this.IPCSend(`${this.dev}error`, {msg: '心跳链接错误'});
    //     clearInterval(this.heartbeatT);
    //     this.heartbeatT = null;
    //   }
    // }, this.heartbeatRate);
    setTimeout(() => {
      if (this.ifClient()) {
        this.client.readHoldingRegisters(4096, 20).then((data) => {
          // const float = bf.bufferToFloat(data.buffer);
          const dint16 = bf.bufferTo16int(data.buffer);
          this.IPCSend(`${this.dev}heartbeat`, { uint16: data.data, int16: dint16 });
          this.heartbeat();
        }).catch((err) => {
          console.log('129----', err);
          this.IPCSend(`${this.dev}error`, err);
          this.overtime();
        });
      } else {
        console.log('123456789');
        this.IPCSend(`${this.dev}error`, {msg: '心跳链接错误'});
        clearInterval(this.heartbeatT);
      }
    }, this.heartbeatRate);
  }
  /**
   * 发送数据到UI
   *
   * @private
   * @param {string} channel 发送名称
   * @param {*} message 发送数据
   * @param {string} channel 通知UI名称
   * @memberof ModbusTCP
   */
  private IPCSend(channel: string, message: any) {
    try {
      this.win.webContents.send(channel, message);
    } catch (error) {
    }
  }

  /**
   * 读取多个寄存器值
   *
   * @param {number} address 首地址
   * @param {number} length 读取数据量
   * @param {string} channel 通知UI名称
   * @memberof ModbusTCP
   */
  public F03(address: number, length: number, channel: string): void {
    if (this.ifClient()) {
      this.client.readHoldingRegisters(address, length).then((data) => {
        // const float = bf.bufferToFloat(data.buffer);
        const dint16 = bf.bufferTo16int(data.buffer);
        this.IPCSend(channel, { int16: dint16, uint16: data.data });
      }).catch((err) => {
        this.IPCSend(channel, err);
      });
    }
  }
  /**
   * 设置单个线圈
   *
   * @param {number} address 装置地址
   * @param {boolean} [state=false] 设置状态
   * @returns
   * @memberof ModbusTCP
   */
  public F05(address: number, state: boolean = false, channel: string): void {
    if (this.ifClient()) {
      this.client.writeCoil(address, state).then((data) => {
        this.IPCSend(channel, data);
      }).catch((err) => {
        console.log(err, this.client);
        this.IPCSend(channel, err);
      });
    }
  }
  /**
   * 预设多个线圈
   *
   * @param {number} address 装置首地址
   * @param {Array<boolean>} array 预设数据
   * @param {string} channel 返回UI名称
   * @returns {void}
   * @memberof ModbusTCP
   */
  public F15(address: number, array: Array<boolean>, channel: string): void {
    if (this.ifClient()) {
      this.client.writeCoils(address, array).then((data) => {
        this.IPCSend(channel, data);
      }).catch((err) => {
        console.log(err, this.client);
        this.IPCSend(channel, err);
      });
    }
  }
  /**
   * 预设单个寄存器
   *
   * @param {number} address 寄存器地址
   * @param {number} [value=0] 预设值
   * @param {string} channel 通知UI名称
   * @returns
   * @memberof ModbusTCP
   */
  public F06(address: number, value: number = 0, channel: string): void {
    if (this.ifClient()) {
      this.client.writeRegister(address, value).then((data) => {
        this.IPCSend(channel, data);
      }).catch((err) => {
        console.log(err, this.client);
        this.IPCSend(channel, err);
      });
    }
  }
  /**
   * 预设浮点数多个寄存器
   *
   * @param {number} address 寄存器首地址
   * @param {Array<number>} array 预设值
   * @param {string} channel 通知UI名称
   * @returns
   * @memberof ModbusTCP
   */
  public F016_float(address: number, array: Array<number>, channel: string): void {
    if (this.ifClient()) {
      const ints = bf.floatToBuffer(array);
      this.client.writeRegisters(address, ints).then((data) => {
        console.log(data);
        this.IPCSend(channel, { success: true, data });
      }).catch((err) => {
        console.log(err);
        this.IPCSend(channel, { success: false, err });
      });
    }
  }
  /**
   * 预设多个寄存器
   *
   * @param {number} address 寄存器首地址
   * @param {Array<number>} array 预设值
   * @param {string} channel 通知UI名称
   * @returns
   * @memberof ModbusTCP
   */
  public F016(address: number, array: Array<number>, channel: string): void {
    if (this.ifClient()) {
      this.client.writeRegisters(address, array).then((data) => {
        this.IPCSend(channel, data);
      }).catch((err) => {
        console.log(err, this.client);
        this.IPCSend(channel, err);
      });
    }
  }
  /**
   * 判断Modbus链接状态
   *
   * @returns 正常返回 true 异常返回 false
   * @memberof ModbusTCP
   */
  public ifClient() {
    // console.log(this.dev, '---1111', this.connectionState());
    if (this.connectionState()) {
      return true;
    } else {
      this.overtime();
    }
  }
  private connectionState() {
    return this.client && this.client._port.isOpen;
  }
}
