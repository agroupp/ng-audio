import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MediaState, MediaStateTelemetry, createInitialState } from '../entities';
import { createAudioContext } from './audio-context';

@Injectable({
  providedIn: 'root'
})
export class AudioService implements OnDestroy {
  private readonly destroy$ = new Subject();
  private readonly mediaElement = this.document.createElement('audio') as HTMLAudioElement;
  private readonly audioContext = createAudioContext();
  private readonly analyser = this.audioContext?.createAnalyser();
  private readonly mediaSource = this.audioContext?.createMediaElementSource(this.mediaElement);
  private loadingStart = 0;
  private animationFrameId?: number;

  private state = createInitialState();
  private stateSubject = new BehaviorSubject<MediaState>(this.state);

  /**
   * Observable of media state.
   */
  get state$(): Observable<MediaState> {
    return this.stateSubject.asObservable();
  }

  private readonly errorSubject = new Subject<MediaError | null>();

  /**
   * Observable of `mediaElement` errors.
   * https://developer.mozilla.org/en-US/docs/Web/API/MediaError
   *
   */
  get error$(): Observable<MediaError | null> {
    return this.errorSubject.asObservable();
  }

  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable of `loading` state.
   */
  get isLoading$(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.mediaElement.crossOrigin = 'true';
    fromEvent<MediaError | null>(this.mediaElement, 'error')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.errorSubject.next(this.mediaElement.error)
      });

    fromEvent(this.mediaElement, 'loadstart')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadingStart = Date.now();
          this.isLoadingSubject.next(true);
          this.state = { ...this.state, isReadyToPlay: false };
          this.emitState();
        }
      });

    fromEvent(this.mediaElement, 'canplay')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const loadingTime = Date.now() - this.loadingStart;
          this.loadingStart = 0;
          this.isLoadingSubject.next(false);
          this.state = { ...this.state, isReadyToPlay: true, loadingTime };
          this.updateTelemetry();
        }
      });

    fromEvent(this.mediaElement, 'play')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.state = { ...this.state, isPlayback: true, isEngaged: true };
          this.emitState();
        }
      });

    fromEvent(this.mediaElement, 'pause')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.state = { ...this.state, isPlayback: false, isPlaying: false };
          this.emitState();
        }
      });

    fromEvent(this.mediaElement, 'playing')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.state = { ...this.state, isPlaying: true };
          this.emitState();
        }
      });
  }

  setSource(source: string): void {
    this.mediaSource?.disconnect();
    this.state = createInitialState();
    this.emitState();
    this.mediaElement.src = source;
    if (this.audioContext && this.mediaSource && this.analyser) {
      this.mediaSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      this.analyser.fftSize = 2048;
    }
  }

  /**
   * Starts playback.
   */
  play(): void {
    this.mediaElement
      .play()
      .then(() => (this.animationFrameId = requestAnimationFrame(() => this.interval())))
      .catch(() =>
        this.errorSubject.next({
          code: 10,
          message: 'Not allowed to start playing'
        } as MediaError)
      );
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

  moveToTime(time: number): void {
    if (time < 0 || time > this.state.telemetry.duration) {
      return;
    }
    this.mediaElement.currentTime = time;
  }

  moveToPosition(position: number): void {
    if (position < 0 || position > 1) {
      return;
    }
    this.moveToTime(this.state.telemetry.duration * position);
  }

  calculateTotalPlayedTime(): number {
    if (this.mediaElement.played.length === 0) {
      return 0;
    }
    let result = 0;
    for (let i = 0; i < this.mediaElement.played.length; i++) {
      result += this.mediaElement.played.end(i) - this.mediaElement.played.start(i);
    }
    return result;
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
      timeLeft: duration > 0 ? duration - currentTime : 0
    };
    if (this.analyser) {
      const byteTimeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
      const floatTimeDomainData = new Float32Array(this.analyser.fftSize);
      const byteFrequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteTimeDomainData(byteTimeDomainData);
      this.analyser.getFloatTimeDomainData(floatTimeDomainData);
      this.analyser.getByteFrequencyData(byteFrequencyData);
      mainTelemetry.byteTimeDomainData = byteTimeDomainData;
      mainTelemetry.floatTimeDomainData = floatTimeDomainData;
      mainTelemetry.byteFrequencyData = byteFrequencyData;
    }
    this.state = { ...this.state, telemetry: mainTelemetry };
    this.emitState();
  }

  private emitState(): void {
    this.stateSubject.next(this.state);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }
}
