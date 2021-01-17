import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickDirective } from './click.directive';

@NgModule({
  declarations: [ClickDirective],
  imports: [CommonModule],
  exports: [ClickDirective]
})
export class ClickModule {}
