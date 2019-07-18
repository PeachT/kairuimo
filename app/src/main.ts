import { app, BrowserWindow, ipcMain, dialog } from 'electron';
const ejsexcel = require('../static/ejsexcel');
// const ejsexcel = require('../node_modules/ejsexcel/index');
const fs = require('fs');
const path = require('path');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
import { bf } from './bufferToNumber';
import ModbusRTU from 'modbus-serial';
import { ModbusTCP } from './modbus';
// const path = require('path');
// const url = require('url');

// 注意这个autoUpdater不是electron中的autoUpdater
// const { autoUpdater } = require('electron-updater');
import { autoUpdater } from 'electron-updater';



// 运行环境判断
const args = process.argv.slice(1);
const dev = args.some((val) => val === '--dev');

/** 启动Modbus */
let ztcp: ModbusTCP;
let ctcp: ModbusTCP;

// tslint:disable-next-line:no-string-literal
global['heartbeatRate'] = 1000;

console.log(dev);
// 设置调试环境和运行环境 的渲染进程路径
const winURL = dev ? 'http://localhost:4200' :
  `file://${__dirname}/dist/index.html`;

let win: BrowserWindow;


function createWindow() {
  win = new BrowserWindow(
    {
      width: 1920, height: 1080,
      webPreferences: {
        nodeIntegration: true,
        backgroundThrottling: false
      }
    }
  );

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
  if (dev) {
    win.webContents.openDevTools();
  }

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
}

/**
 * *采集频率
 */
ipcMain.on('heartbeatRate', (e, delay) => {
  // tslint:disable-next-line:no-string-literal
  global['heartbeatRate'] = delay || 1000;
  // tslint:disable-next-line:no-string-literal
  console.log('global.heartbeatRate', global['heartbeatRate']);
});
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
/** 获取模板 */
ipcMain.on('get-template', async (event, data) => {
  moundUSB('*.kvmt', 'get-template-back');
  // event.sender.send('get-template-back', moundUSB('*.kvmt', 'get-template-back'));
});

// 开始导出
ipcMain.on('derivedExcel', async (event, data) => {
  // console.log('123456789', path);
  // 获得Excel模板的buffer对象
  // derived = {
  //   templatePath: null,
  //   outPath: null,
  // };
  const outPath = data.outPath;
  if (!fs.existsSync(outPath)) {
    fs.mkdirSync(outPath);
    // tslint:disable-next-line: no-use-before-declare
    // exec(`sudo mkdir ${outPath}`, { async: true }, (code, stdout, stderr) => {});
  }

  const filePath = data.templatePath;
  const savePath = `${outPath}/${data.data.data.name}张拉记录.xlsx`;
  try {
    console.log(filePath, savePath, outPath, data.outPath);
    const exlBuf = await readFileAsync(filePath);
    // 用数据源(对象)data渲染Excel模板
    const exlBuf2 = await ejsexcel.renderExcel(exlBuf, data.data);
    await writeFileAsync(savePath, exlBuf2);
    event.sender.send(data.channel, { success: true, filePath, savePath });
  } catch (error) {
    event.sender.send(data.channel, { success: false, filePath, savePath, error });
  }
});

// 选择模板与导出路径
ipcMain.on('selectTemplate', (event, data) => {
  let outPath = '';
  let templatePath = '';
  if (data) {
    try {
      outPath = dialog.showOpenDialog(win, { properties: ['openDirectory'] })[0];
      templatePath = dialog.showOpenDialog(win, {
        properties: ['openFile'], filters: [
          { name: 'template', extensions: ['xlsx'] },
        ]
      })[0];
      console.log(outPath, templatePath);
    } catch (error) {
    }
  } else {
    try {
    } catch (error) {
    }
  }
  event.sender.send(data.channel, { msg: `获取成功`, outPath, templatePath, data });
});


/** 键盘控制 */
const exec = require('child_process').exec;
/**
 * *键盘
 */
// let pid = null;
ipcMain.on('showKeyboard', (event, data) => {
  console.log('showKeyboard', data);
  const ps = exec(`
   gsettings set org.onboard.window.landscape x ${data.x} &
   gsettings set org.onboard.window.landscape y ${data.y} &
   gsettings set org.onboard.window.landscape width ${data.w} &
   gsettings set org.onboard.window.landscape height ${data.h} &
   gsettings set org.onboard layout ${data.type} &
   onboard &`,
    { async: true }, (code, stdout, stderr) => {
      console.log('Exit code:', code);
      console.log('Program output:', stdout);
      console.log('Program stderr:', stderr);
      ps.kill();
    });
});

ipcMain.on('offKdNumber', (event, data) => {
  console.log('onKdNumber');

});
/** 重启|关机 */
ipcMain.on('power', (event, data) => {
  console.log('power');
  if (data) {
    exec(`poweroff`);
  } else {
    exec(`reboot`);
  }
});

/** 获取更新文件 */
ipcMain.on('select-file', (event, data) => {
  moundUSB('*kvm-device*.kvm', 'select-file-out');
});
/** 本地文件更新 */
ipcMain.on('local-update', (event, data) => {
  console.log('local-update');
  // const updatepath = '/media/kvm/kvm/kvm/update/update.sh';
  // const updatepath = '/home/peach/KVM/update/update.sh';
  const upps = exec(`sudo dpkg -i ${data}`, { async: true }, (code, stdout, stderr) => {
    console.log('Exit code:', code);
    console.log('Program output:', stdout);
    console.log('Program stderr:', stderr);
    event.sender.send('onUpdate', { stdout, stderr });
    upps.kill();
  });
});
/** 卸载U盘 */
ipcMain.on('usb-umount', (event, data) => {
  const upps = exec(`sudo umount /dev/sd[b-z]*`, { async: true }, (code, stdout, stderr) => {
    console.log('Exit code:', code);
    console.log('Program output:', stdout);
    console.log('Program stderr:', stderr);
    let state = false;
    if (stderr.indexOf('busy') !== -1) {
      state = true;
    }
    event.sender.send('usb-umount', state);
    upps.kill();
  });
});
/** 输入linux-shell命令 */
ipcMain.on('test', (event, data) => {
  const upps = exec(`${data.data}`, { async: true }, (code, stdout, stderr) => {
    console.log('Exit code:', code);
    console.log('Program output:', stdout);
    console.log('Program stderr:', stderr);
    event.sender.send(data.out, { stdout, stderr });
    upps.kill();
  });
});

/** 打开调试面板 */
ipcMain.on('openDevTools', () => {
  win.webContents.openDevTools();
});

/** 挂载U盘 */
function moundUSB(filterName, sendName) {
  console.log('select-file');
  let updatepath = '/media';
  // 获取用户名
  exec(`whoami`, { async: true }, (code, stdout, stderr) => {
    updatepath = `/media/${stdout.split('\n')[0]}`;
  });
  // tslint:disable-next-line: no-unused-expression
  // -o iocharset=utf8
  // mount -t vfat -o iocharset=utf8
  // sudo mount -o rw,nosuid,nodev,relatime,uid=1000,gid=1000,fmask=0022,dmask=0022,codepage=437,iocharset=iso8859-1,shortname=mixed,showexec,utf8,flush,errors=remount-ro,uhelper=udisks2 /dev/sdc1 /media/peach/
  const usb = exec(`ls /dev/ | grep "sd[b-z]"`, { async: true }, (code, stdout, stderr) => {
    usb.kill();
    console.log('usb', stdout);
    if (stdout) {
      const up = exec(`sudo mount -o rw,nosuid,nodev,relatime,uid=1000,utf8 /dev/sd[b-z]* ${updatepath}`,
                        { async: true }, (code, stdout, stderr) => {
        up.kill();
        console.log('mount code:', code);
        console.log('mount output:', stdout);
        console.log('mount stderr:', stderr);
        if (stderr.indexOf('不存在') !== -1) {
          win.webContents.send(sendName, { stdout, stderr: '加载U盘失败！' });
        } else {
          const upps = exec(`find ${updatepath} -name ${filterName}`, { async: true }, (code, stdout, stderr) => {
            stdout = stdout.split('\n').filter(t => t !== '');
            console.log('Exit code:', code);
            console.log('Program output:', stdout);
            console.log('Program stderr:', stderr);
            upps.kill();
            win.webContents.send(sendName, { stdout, stderr });
          });
        }
      });
    } else {
      win.webContents.send(sendName, { stdout, stderr: '未检测到U盘！！' });
    }
  });
}
