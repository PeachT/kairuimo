import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DateFormat } from 'src/app/Function/DateFormat';

@Component({
  selector: 'app-time-sec',
  templateUrl: './time-sec.component.html',
  styleUrls: ['./time-sec.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeSecComponent implements OnInit {
  time = (DateFormat(new Date(), 'MM-dd hh:mm:ss'));
  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    setInterval(() => {
      this.time = (DateFormat(new Date(), 'MM-dd hh:mm:ss'));
      localStorage.setItem('lastTime', `${new Date().getTime()}`);
      this.cdr.markForCheck();
    }, 1000);
  }

}
