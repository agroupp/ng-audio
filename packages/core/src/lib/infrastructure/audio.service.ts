import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MediaState, MediaStateTelemetry, createInitialState } from '../entities';

@Injectable({
  providedIn: 'root'
})
export class AudioService implements OnDestroy {
  private readonly destroy$ = new Subject();
  private readonly stop$ = new Subject<void>();
  private readonly mediaElement = document.createElement('audio') as HTMLAudioElement;
  private loadingStart = 0;
  private animationFrameId?: number;

  private state = createInitialState();
  private stateSubject = new BehaviorSubject<MediaState>(this.state);

  /**
   * Observable of media state.
   */
  get state$(): Observable<MediaState> { return this.stateSubject.asObservable(); }

  private readonly errorSubject = new Subject<MediaError | null>();

  /**
   * Observable of `mediaElement` errors.
   * https://developer.mozilla.org/en-US/docs/Web/API/MediaError
   *
   */
  get error$(): Observable<MediaError | null> { return this.errorSubject.asObservable(); }

  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable of `loading` state.
   */
  get isLoading$(): Observable<boolean> { return this.isLoadingSubject.asObservable(); }


  constructor() {
    fromEvent<MediaError | null>(this.mediaElement, 'error').pipe(
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: () => this.errorSubject.next(this.mediaElement.error)
    });

    fromEvent(this.mediaElement, 'loadstart').pipe(
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: () => {
        this.loadingStart = Date.now();
        this.isLoadingSubject.next(true);
        this.state = {...this.state, isReadyToPlay: false};
        this.emitState();
      }
    });

    fromEvent(this.mediaElement, 'canplay').pipe(
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: () => {
        const loadingTime = Date.now() - this.loadingStart;
        this.loadingStart = 0;
        this.isLoadingSubject.next(false);
        this.state = {...this.state, isReadyToPlay: true, loadingTime};
        this.updateTelemetry();
      }
    });

    fromEvent(this.mediaElement, 'play').pipe(
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: () => {
        this.state = {...this.state, isPlayback: true, isEngaged: true};
        this.emitState();
      }
    });

    fromEvent(this.mediaElement, 'pause').pipe(
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: () => {
        this.state = {...this.state, isPlayback: false, isPlaying: false};
        this.emitState();
      }
    });

    fromEvent(this.mediaElement, 'playing').pipe(
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: () => {
        // this.startTicker();
        this.state = {...this.state, isPlaying: true};
        this.emitState();
      }
    });
  }

  setSource(source: string): void {
    this.state = createInitialState();
    this.emitState();
    this.mediaElement.src = source;
  }

  /**
   * Starts playback.
   */
  play(): void {
    this.mediaElement.play()
    .then(() => this.animationFrameId = requestAnimationFrame(() => this.interval()))
    .catch(() => this.errorSubject.next({
      code: 10,
      message: 'Not allowed to start playing'
    } as MediaError));
  }

  /**
   * Pauses the current playback.
   */
  pause(): void {
    this.mediaElement.pause();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private interval(): void {
    this.updateTelemetry();
    this.animationFrameId = requestAnimationFrame(() => this.interval());
  }

  private updateTelemetry(): void {
    const currentTime = this.mediaElement.currentTime;
    const duration = this.mediaElement.duration;
    const mainTelemetry: MediaStateTelemetry = {
      time: currentTime,
      duration,
      position: duration > 0 ? currentTime / duration : 0,
      timeLeft: duration > 0 ? duration - currentTime : 0,
      playedTime: this.calculateTotalPlayedTime()
    };
    this.state = {...this.state, telemetry: mainTelemetry};
    this.emitState();
  }

  private calculateTotalPlayedTime(): number {
    if (this.mediaElement.played.length === 0) {
      return 0;
    }
    let result = 0;
    for (let i = 0; i < this.mediaElement.played.length; i++) {
      result += this.mediaElement.played.end(i) - this.mediaElement.played.start(i);
    }
    return result;
  }

  private emitState(): void {
    this.stateSubject.next(this.state);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }
}
