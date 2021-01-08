/* eslint-disable @typescript-eslint/no-explicit-any */

export const createAudioContext = (): AudioContext | null => {
  if (
    window &&
    ('AudioContext' in window || 'webkitAudioContext' in window) &&
    (typeof window.AudioContext !== undefined || typeof (window as any).webkitAudioContext !== undefined) &&
    (window.AudioContext !== undefined || (window as any).webkitAudioContext !== undefined)
  ) {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } else {
    return null;
  }
};
