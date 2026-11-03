export type ScanFeedbackTone = "success" | "warning" | "error";

type Beep = {frequency: number; duration: number; delay: number};

// Short high beep for a good scan, two mid beeps for a warning, one long low tone for an error.
const tones: Record<ScanFeedbackTone, Beep[]> = {
    success: [{frequency: 1320, duration: 0.08, delay: 0}],
    warning: [{frequency: 880, duration: 0.09, delay: 0}, {frequency: 880, duration: 0.09, delay: 0.14}],
    error: [{frequency: 220, duration: 0.42, delay: 0}],
};

const vibrationPatterns: Partial<Record<ScanFeedbackTone, number[]>> = {
    warning: [60, 60, 60],
    error: [250],
};

type AudioContextConstructor = typeof AudioContext;

let audioContext: AudioContext | null = null;

const sharedAudioContext = (): AudioContext | null => {
    if (audioContext) {
        return audioContext;
    }
    const AudioContextClass: AudioContextConstructor | undefined = window.AudioContext
        || (window as unknown as {webkitAudioContext?: AudioContextConstructor}).webkitAudioContext;
    if (!AudioContextClass) {
        return null;
    }
    audioContext = new AudioContextClass();
    return audioContext;
};

export const playScanFeedback = (tone: ScanFeedbackTone, soundEnabled: boolean) => {
    const pattern = vibrationPatterns[tone];
    if (pattern && typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
    }

    if (!soundEnabled) {
        return;
    }

    try {
        const context = sharedAudioContext();
        if (!context) {
            return;
        }
        tones[tone].forEach(({frequency, duration, delay}) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const start = context.currentTime + delay;
            oscillator.type = "square";
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.06, start);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            oscillator.connect(gain).connect(context.destination);
            oscillator.start(start);
            oscillator.stop(start + duration);
        });
    } catch {
        // Audio can be blocked until the first user gesture; the visual feedback still shows.
    }
};
