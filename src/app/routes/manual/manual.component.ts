import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { NzMessageService } from 'ng-zorro-antd';
import { DbService, DB } from 'src/app/services/db.service';
import { AppService } from 'src/app/services/app.service';
import { PLCService } from 'src/app/services/PLC.service';
import { PLC_D, PLC_M } from 'src/app/models/IPCChannel';

@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.less']
})
export class ManualComponent implements OnInit, OnDestroy {
  db: DB;
  selectedJack: any;
  selectedI: any = null;
  jacks = [];
  deviceMode = true;
  devModeStr: any = {z: ['zA', 'zB', 'zC', 'zD'], c: ['cA', 'cB', 'cC', 'cD']};
  /** 点动  强制  补压 */
  zMarginMode = [false, false, false];
  cMarginMode = [false, false, false];
  alarm = {
    state: false,
    name: null,
    datas: []
  };

  da = 0;
  setDev = {
    zA: {
      setMpa: 0,
      setMm: 0,
      setUn: 0
    },
    zB: {
      setMpa: 0,
      setMm: 0.56,
      setUn: 0
    },
    zC: {
      setMpa: 0,
      setMm: 0,
      setUn: 0
    },
    zD: {
      setMpa: 0,
      setMm: 0.56,
      setUn: 0
    },
    cA: {
      setMpa: 0,
      setMm: 10.56,
      setUn: 0
    },
    cB: {
      setMpa: 0,
      setMm: 0,
      setUn: 0
    },
    cC: {
      setMpa: 0,
      setMm: 10.56,
      setUn: 0
    },
    cD: {
      setMpa: 0,
      setMm: 0,
      setUn: 0
    }
  };
  showDev = {
    zA: true,
    zB: true,
    zC: true,
    zD: true,
    cA: true,
    cB: true,
    cC: true,
    cD: true,
  };

  // mpaMarks: any = {
  //   0: '0Mpa',
  //   20: '20Mpa',
  //   10: '10Mpa',
  //   30: '30Mpa',
  //   40: '40Mpa',
  //   50: '50Mpa',
  //   60: {
  //     style: {
  //       color: '#f50',
  //     },
  //     label: '<strong>60Mpa</strong>',
  //   }
  // };
  // mpaMarksNull: any = {
  //   0: null,
  //   10: null,
  //   20: null,
  //   30: null,
  //   40: null,
  //   50: null,
  //   60: null
  // };
  // mmMarks: any = {
  //   0: '0mm',
  //   40: '40mm',
  //   80: '80mm',
  //   120: '120mm',
  //   160: '160mm',
  //   200: {
  //     style: {
  //       color: '#f50',
  //     },
  //     label: '<strong>200mm</strong>',
  //   }
  // };
  // mmMarksNull: any = {
  //   0: null,
  //   40: null,
  //   80: null,
  //   120: null,
  //   160: null,
  //   200: null,
  // };

  it = null;
  constructor(
    private e: ElectronService,
    private odb: DbService,
    public appService: AppService,
    public PLCS: PLCService,
    private message: NzMessageService,
  ) {
    this.db = this.odb.db;
  }

  ngOnInit() {
    this.it = setInterval(() => {
      // this.da = this.da++;
      console.log('manual');
    }, 500);
    this.db.jack.toArray().then((d) => {
      this.jacks = d.map(item => {
        return { name: item.name, address: (item.id - 1) * 100, mode: item.jackMode };
      });
      if (!this.selectedJack && this.selectedI !== null) {
        this.selectedJack = this.jacks[this.selectedI];
      }
      console.log(this.jacks);
    });
    this.selectManual('z');
    this.selectManual('c');
    this.getManualData('z');
    this.getManualData('c');
  }
  ngOnDestroy() {
    console.log('退出');
    clearInterval(this.it);
    this.selectManual('z', [false, false, false, false]);
    this.selectManual('c', [false, false, false, false]);
  }
  /** 切换设备 */
  onSelectedDevice(value) {
    console.log(value);
    this.PLCS.ipcSend('zF06', PLC_D(408), value.address);
    const devModeStr = [
      {z: ['zA'], c: ['cA']},
      {},
      {z: ['zA', 'zB'], c: ['cA', 'cB']},
      {},
      {z: ['zA', 'zB', 'zC', 'zD'], c: ['cA', 'cB', 'cC', 'cD']}
    ];
    this.devModeStr = devModeStr[value.mode];
    // console.log(id === '1');
    // if (id === '1') {
    //   this.deviceMode = false;
    // } else {
    //   this.deviceMode = true;
    // }
  }

  /** 切换手动 */
  selectManual(dev: string = 'z', array = [true, false, false, false]) {
    this.PLCS.ipcSend(`${dev}F15`, PLC_M(100), array);
  }
  /** 获取手动数据 */
  getManualData(dev: string = 'z', ) {
    this.PLCS.ipcSend(`${dev}F03`, PLC_D(98), 14).then((data: any) => {
      console.log(`${dev}返回的结果`, data);
      this.setDev[`${dev}A`].setMpa = data.float[1];
      this.setDev[`${dev}A`].setMm = data.float[2];
      this.setDev[`${dev}A`].setUn = data.float[3];

      this.setDev[`${dev}B`].setMpa = data.float[4];
      this.setDev[`${dev}B`].setMm = data.float[5];
      this.setDev[`${dev}B`].setUn = data.float[6];

      this.setDev[`${dev}C`].setMpa = data.float[7];
      this.setDev[`${dev}C`].setMm = data.float[8];
      this.setDev[`${dev}C`].setUn = data.float[9];

      this.setDev[`${dev}D`].setMpa = data.float[10];
      this.setDev[`${dev}D`].setMm = data.float[11];
      this.setDev[`${dev}D`].setUn = data.float[12];
      // 获取选择顶
      this.selectedI = data.int16[1] === 0 ? data.int16[1] : Math.round(data.int16[1] / 100);
      if (this.jacks.length > 0) {
        this.selectedJack = this.jacks[this.selectedI];
      }
      console.log(this.jacks, this.selectedJack, this.selectedI);
    });
  }

  setF15(index: number, dev: string = 'z') {
    const channel = `${dev}F15`;
    const array = [false, false, false];
    array[index] = !this[`${dev}MarginMode`][index];
    console.log(array);
    this.PLCS.ipcSend(`${dev}F15`, PLC_M(101), array).then(() => {
      this[`${dev}MarginMode`] = array;
    });
  }
  /** 查看报警 */
  showAlarm(name: string) {
    this.alarm.state = true;
    this.alarm.datas = this.PLCS.PD[name].alarm;
    this.alarm.name = `${name}报警状态`;
  }

}
