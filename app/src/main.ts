import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { bf } from './bufferToNumber';
import ModbusRTU from 'modbus-serial';
import { ModbusTCP } from './modbus';
// const path = require('path');
// const url = require('url');

// 注意这个autoUpdater不是electron中的autoUpdater
// const { autoUpdater } = require('electron-updater');
import { autoUpdater } from 'electron-updater';

const ejsexcel = require('ejsExcel');
const fs = require('fs');
const path = require('path');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);


// 运行环境判断
const args = process.argv.slice(1);
const dev = args.some((val) => val === '--dev');

/** 启动Modbus */
let ztcp: ModbusTCP;
let ctcp: ModbusTCP;

console.log(dev);
// 设置调试环境和运行环境 的渲染进程路径
const winURL = dev ? 'http://localhost:4200' :
  `file://${__dirname}/dist/index.html`;

let win: BrowserWindow;


function createWindow() {
  win = new BrowserWindow({ width: 1920, height: 1080 });

  // load the dist folder from Angular
  win.loadURL(winURL);

  // Open the DevTools optionally:
  // win.webContents.openDevTools()
  console.log('start...');
  // 启动Modbus
  createModbus();
  // IPC 监听
  IPCOn('z', ztcp);
  IPCOn('c', ctcp);
  win.webContents.openDevTools();
  // if(dev) {
  // }

  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('__static');
  if (win === null) {
    createWindow();
  }

});


function createModbus() {
  console.log('start... Modbus');
  ztcp = new ModbusTCP({ ip: '192.168.1.15', port: 502, address: 1 }, win);
  // ztcp.connection();
  ctcp = new ModbusTCP({ ip: '192.168.1.25', port: 502, address: 1 }, win);
  // ctcp.connection();
}

/** ipc监听 */
function IPCOn(d: string = 'z', tcp: ModbusTCP) {
  ipcMain.on(`${d}F03`, (e, arg) => {
    tcp.F03(arg.address, arg.value, arg.channel);
  });
  ipcMain.on(`${d}F05`, (e, arg) => {
    tcp.F05(arg.address, arg.value, arg.channel);
  });
  ipcMain.on(`${d}F15`, (e, arg) => {
    tcp.F15(arg.address, arg.value, arg.channel);
  });
  ipcMain.on(`${d}F06`, (e, arg) => {
    tcp.F06(arg.address, arg.value, arg.channel);
  });
  ipcMain.on(`${d}F016`, (e, arg) => {
    tcp.F016(arg.address, arg.value, arg.channel);
  });
  ipcMain.on(`${d}F016_float`, (e, arg) => {
    tcp.F016_float(arg.address, arg.value, arg.channel);
  });
  // 从站
  // ipcMain.on('cF03', (e, arg) => {
  //   ctcp.F03(arg.address, arg.length, arg.channel);
  // });
  // ipcMain.on('cF05', (e, arg) => {
  //   ctcp.F05(arg.address, arg.state, arg.channel);
  // });
  // ipcMain.on('cF15', (e, arg) => {
  //   ctcp.F15(arg.address, arg.array, arg.channel);
  // });
  // ipcMain.on('cF06', (e, arg) => {
  //   ctcp.F06(arg.address, arg.value, arg.channel);
  // });
  // ipcMain.on('cF016', (e, arg) => {
  //   ctcp.F016(arg.address, arg.array, arg.channel);
  // });
  // ipcMain.on('cF016_float', (e, arg) => {
  //   ctcp.F016_float(arg.address, arg.array, arg.channel);
  // });
}

// 主进程监听渲染进程传来的信息
ipcMain.on('update', (e, arg) => {
  console.log('update');
  updateHandle();
});

// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
function updateHandle() {
  const message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本，正在下载……',
    updateNotAva: '现在使用的就是最新版本，不用更新',
  };
  const os = require('os');
  // http://localhost:5500/up/ 更新文件所在服务器地址
  autoUpdater.setFeedURL('http://localhost:5500/up/');
  autoUpdater.on('error', (error) => {
    sendUpdateMessage(message.error);
  });
  autoUpdater.on('checking-for-update', () => {
    sendUpdateMessage(message.checking);
  });
  autoUpdater.on('update-available', (info) => {
    sendUpdateMessage(message.updateAva);
  });
  autoUpdater.on('update-not-available', (info) => {
    sendUpdateMessage(message.updateNotAva);
  });

  // 更新下载进度事件
  autoUpdater.on('download-progress', (progressObj) => {
    win.webContents.send('downloadProgress', progressObj);
  });
  // 下载完成事件
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) => {
    ipcMain.on('isUpdateNow', (e, arg) => {
      // 关闭程序安装新的软件
      autoUpdater.quitAndInstall();
    });
    win.webContents.send('isUpdateNow');
  });

  // 执行自动更新检查
  autoUpdater.checkForUpdates();
}

// 通过main进程发送事件给renderer进程，提示更新信息
// win = new BrowserWindow()
function sendUpdateMessage(text) {
  win.webContents.send('message', text);
}

/**
 * 发送数据到UI
 *
 * @private
 * @param {string} channel 发送名称
 * @param {*} message 发送数据
 * @memberof ModbusTCP
 */
function IPCSend(channel: string, message: any) {
  win.webContents.send(channel, message);
}

///////////////////////////////////////////////////////////// 导出表格
// 开始导出
ipcMain.on('derivedExcel', async (event, data) => {
  // console.log('123456789', path);
  // 获得Excel模板的buffer对象
  // derived = {
  //   templatePath: null,
  //   outPath: null,
  // };
  const filePath = data.templatePath;
  const savePath = `${data.outPath}/out.xlsx`;
  try {
    console.log(filePath, savePath, data.data);
    const exlBuf = await readFileAsync(filePath);
    // 数据源
    // const data = [
    //   {name: 'N1', kh: 'A1'},
    //   {name: 'N1', kh: 'A2'},
    //   {name: 'N2', kh: 'B1'},
    //   {name: 'N2', kh: 'B2'},
    // ]

    // 用数据源(对象)data渲染Excel模板
    const exlBuf2 = await ejsexcel.renderExcel(exlBuf, data.data);
    await writeFileAsync(savePath, exlBuf2);
    event.sender.send(data.channel, {success: true, filePath, savePath});
  } catch (error) {
    event.sender.send(data.channel, {success: false, filePath, savePath, error});
  }
});

// 选择模板与导出路径
ipcMain.on('selectTemplate', (event, data) => {
  let outPath = '';
  let templatePath = '';
  if (data) {
    try {
      outPath = dialog.showOpenDialog(win, {properties: ['openDirectory']})[0];
      templatePath = dialog.showOpenDialog(win, {properties: ['openFile']})[0];
      console.log(outPath, templatePath);
    } catch (error) {
    }
  } else {
    try {
    } catch (error) {
    }
  }
  event.sender.send(data.channel, {msg: `获取成功`, outPath, templatePath, data});
});