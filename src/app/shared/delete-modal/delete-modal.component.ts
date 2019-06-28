import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-delete-modal',
  templateUrl: './delete-modal.component.html',
  styleUrls: ['./delete-modal.component.less']
})
export class DeleteModalComponent implements OnInit {
  show = true;
  delOk = null;

  @Output() outDelete = new EventEmitter();
  constructor() { }

  ngOnInit() {
  }

  handleOk(): void {
    const d = this.delOk.toLowerCase();
    if (d === 'ok') {
      this.outDelete.emit(true);
      this.show = false;
    }
  }

  handleCancel(): void {
    console.log('Button cancel clicked!');
    this.outDelete.emit(false);
    this.show = false;
  }
}
