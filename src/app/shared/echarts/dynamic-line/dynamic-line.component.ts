import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, SimpleChanges } from '@angular/core';
import { DateFormat } from 'src/app/Function/DateFormat';
import { ECharts } from 'echarts';
// 引入 ECharts 主模块
const echarts = require('echarts');

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'echarts-dynamic-line',
  templateUrl: './dynamic-line.component.html',
  styleUrls: ['./dynamic-line.component.less']
})
export class DynamicLineComponent implements OnInit, OnChanges {
  @ViewChild('svg')
  svgDom: ElementRef;
  @Input()
    devs = [];
  @Input()
    data = [];
  @Input()
    width: number | string = 'auto';
  @Input()
    height: number | string = '500';
  @Input()
    index: null;
  @Input()
    name: null;
  @Input()
    show: boolean;

  color = {
    zA: '#ff4081',
    cA: '#ff5722',

    zB: '#651fff',
    cB: '#3d5afe',

    zC: '#0091ea',
    cC: '#00b8d4',

    zD: '#388e3c',
    cD: '#00c853',
  };
  series = [];
  myChart: ECharts;

  constructor() { }

  ngOnInit() {
    console.log(this.svgDom.nativeElement);
    console.log('123456789546123', this.data);
    this.init();
    this.carterSvg();
  }
  ngOnChanges(changes: SimpleChanges) {
    // console.log('数据变更', this.myChart);
    this.update();
  }
  update(state = false) {
    if (this.myChart) {
      let startValue = this.data[0].length - 20;
      let endValue = this.data[0].length - 2;
      if (state) {
        this.show = false;
        startValue = 0;
        endValue = this.data[0].length;
      } else {
      }
      this.myChart.setOption({
        dataset: {
          source: this.data
        },
        dataZoom: [
          {
            startValue,
            endValue
          },
        ]
      });
    }
  }

  init() {
    this.devs.map((name) => {
      this.series.push({ type: 'line', smooth: 0.3, symbol: 'none', seriesLayoutBy: 'row', color: [this.color[name]] });
    });
  }
  carterSvg() {
    // 基于准备好的dom，初始化echarts实例
    this.myChart = echarts.init(this.svgDom.nativeElement, null, {width: this.width, height: this.height});
    // 绘制图表
    this.myChart.setOption({

      grid: {
        x: 40, // 默认是80px
        y: 60, // 默认是60px
        x2: 40, // 默认80px
        // y2: 20 // 默认60px
      },
      title: {
        text: this.name,
      },
      legend: {
        data: this.devs,
        type: 'scroll',
        top: 25,
        itemGap: 25,
        itemWidth: 20,
        itemHeight: 20,
        textStyle: {
          fontSize: 18
        }
      },
      tooltip: {
        trigger: 'axis',
        showContent: false
      },
      dataset: {
        source: this.data
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        splitLine: {
          show: false
        },
        axisLabel: {
          formatter: (value, index) => {
            return DateFormat(new Date(value), 'hh:mm:ss');
          }
        }
      },
      yAxis: {
        boundaryGap: [0, '5%'],
        scale: true,
        splitLine: {
          show: false
        }
      },
      // 缩放
      dataZoom: [
        {
          id: 'dataZoomX',
          type: 'inside',
          xAxisIndex: [0],
          filterMode: 'weakFilter', // 设定为 'filter' 从而 X 的窗口变化会影响 Y 的范围。
          startValue: 0,
          endValue: 0
        },
      ],

      series: this.series
    });
  }

}
