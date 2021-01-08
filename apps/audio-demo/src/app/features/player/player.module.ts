import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerPageComponent } from './player-page.component';

@NgModule({
  declarations: [PlayerPageComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: PlayerPageComponent }])]
})
export class PlayerModule {}
