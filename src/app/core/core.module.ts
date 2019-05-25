import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
  ],
  providers: [
  ]
})
export class CoreModule {
    // @Optional 首次加载判断
  // @SkipSelf 到父级中查询，避免无限循环
  constructor(
    @Optional()
    @SkipSelf()
    parent: CoreModule,
  ) {
    if (parent) {
      throw new Error('模块已经存在，不需要再次加载！');
    }
  }
}
