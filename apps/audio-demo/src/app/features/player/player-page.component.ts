import { BehaviorSubject, of } from 'rxjs';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AudioService } from '@ng-audio/core';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'grp-player-page',
  templateUrl: './player-page.component.html',
  styleUrls: ['./player-page.component.scss'],
  providers: [AudioService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerPageComponent implements OnInit {
  canPlay$ = new BehaviorSubject<boolean>(false);
  isLoading$ = this.audio.isLoading$;
  telemetry$ = this.audio.state$.pipe(switchMap(state => of(state.telemetry)));
  position$ = this.audio.state$.pipe(switchMap(state => of(state.telemetry.position)));

  private isPlaying = false;
  isPlaying$ = this.audio.state$.pipe(
    switchMap(state => of(state.isPlaying)),
    tap(isPlaying => (this.isPlaying = isPlaying))
  );

  constructor(public readonly audio: AudioService) {}

  ngOnInit(): void {
    this.audio.error$.subscribe(console.log);
    this.audio.state$.subscribe(state => {
      this.canPlay$.next(state.isReadyToPlay);
      // console.log(state)
    });
  }

  onLoadSourceClick(): void {
    this.audio.setSource(`https://storageaudiobursts.azureedge.net/audio/JWPqNqk2ayyL.mp3?nocache=${Date.now()}`);
  }

  onPlayPauseClick(): void {
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      this.audio.play();
    }
  }
}
