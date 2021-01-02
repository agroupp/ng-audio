import { TimeRange } from './time-range';

export interface MediaStateTelemetry {
  time: number;
  duration: number;
  position: number;
  timeLeft: number;
  playedTime: number;
  byteTimeDomainData?: Uint8Array;
  floatTimeDomainData?: Float32Array;
  byteFrequencyData?: Uint8Array;
}

export interface MediaState {
  loadingTime: number;
  isPlayback: boolean;
  isPlaying: boolean;
  isReadyToPlay: boolean;
  isEngaged: boolean;
  telemetry: MediaStateTelemetry;
  shadowRange?: TimeRange;
}

export function createInitialTelemetryState(): MediaStateTelemetry {
  return {
    time: 0,
    duration: 0,
    position: 0,
    timeLeft: 0,
    playedTime: 0,
  };
}

export function createInitialState(): MediaState {
  return {
    loadingTime: -1,
    isPlayback: false,
    isPlaying: false,
    isReadyToPlay: false,
    isEngaged: false,
    telemetry: createInitialTelemetryState(),
    shadowRange: undefined,
  };
}
