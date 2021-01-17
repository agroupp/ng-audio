import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClickModule } from '@ng-audio/visualization';
import { PlayerPageComponent } from './player-page.component';

@NgModule({
  declarations: [PlayerPageComponent],
  imports: [CommonModule, ClickModule, RouterModule.forChild([{ path: '', component: PlayerPageComponent }])]
})
export class PlayerModule {}
