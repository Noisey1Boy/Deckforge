(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/data/pitch/conversation.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Conversation timeline for the pitch demo slide.
 *
 * Source: upload/dentist.wav (316 s, "Layla" — the Downtown Dentist voice agent —
 * booking Robert's appointment). The 7-segment highlight cut (silence-aligned,
 * 1.38x time-compression, pitch-preserving) lives at /audio/dentist-booking.mp3
 * (110.76 s). Turn `at` values are seconds into that cut, computed as
 *   cut = segOffset + (realStart - segStart) / 1.38
 * with segment boundaries snapped to detected silences (>= 0.4 s).
 */ __turbopack_context__.s([
    "ACTIONS",
    ()=>ACTIONS,
    "AUDIO_SRC",
    ()=>AUDIO_SRC,
    "CUT_DURATION",
    ()=>CUT_DURATION,
    "FULL_CALL_SRC",
    ()=>FULL_CALL_SRC,
    "TURNS",
    ()=>TURNS,
    "actionIndexAt",
    ()=>actionIndexAt,
    "turnIndexAt",
    ()=>turnIndexAt
]);
const TURNS = [
    {
        speaker: 'layla',
        at: 0.0,
        text: 'Hello, this is Layla from Downtown Dentist. How may I help you today?'
    },
    {
        speaker: 'robert',
        at: 2.72,
        text: 'Hi Layla! I’ve been having tooth problems — I think I have a cavity and one tooth has been aching for a couple of days. Can you guys help me with that?'
    },
    {
        speaker: 'layla',
        at: 8.65,
        text: 'Oh no, I’m so sorry — toothaches are the worst. But don’t worry, we’ve got you covered.'
    },
    {
        speaker: 'layla',
        at: 12.33,
        text: 'Let’s get you seen as soon as possible so we can figure out what’s going on. First, could I start with your full name?'
    },
    {
        speaker: 'robert',
        at: 20.44,
        text: 'Um, yes — that’s Robert John.'
    },
    {
        speaker: 'layla',
        at: 22.84,
        text: 'Thanks, Robert! Now, what’s the best email address for you?'
    },
    {
        speaker: 'robert',
        at: 26.25,
        text: 'Um, that’s robertjohn123 — at yahoo dot com.'
    },
    {
        speaker: 'layla',
        at: 35.84,
        text: 'Got it — let me read that back to make sure I’ve got it right: robertjohn123 at yahoo dot com. Is that correct?'
    },
    {
        speaker: 'robert',
        at: 44.12,
        text: 'Yes.'
    },
    {
        speaker: 'robert',
        at: 46.88,
        text: 'Um, yes — everything looks good.'
    },
    {
        speaker: 'layla',
        at: 48.38,
        text: 'Awesome, thank you so much! Give me one second to get you set up… You’re all set, Robert!'
    },
    {
        speaker: 'layla',
        at: 53.93,
        text: 'You mentioned a toothache and a possible cavity — let’s get you in for an emergency appointment. When works best? We open as early as 7:30 AM today.'
    },
    {
        speaker: 'robert',
        at: 63.19,
        text: 'Um, I’d like to come tomorrow — and one more thing: please check everything else while I’m there.'
    },
    {
        speaker: 'layla',
        at: 69.08,
        text: 'Got it.'
    },
    {
        speaker: 'layla',
        at: 70.3,
        text: 'Alright, Robert — a full checkup plus the toothache. Let me check tomorrow’s availability… I see openings at 8:00 AM, 11:30 AM, and 2:00 PM. Do any of those work for you?'
    },
    {
        speaker: 'robert',
        at: 85.78,
        text: 'Um yes — 8:00 AM sounds great.'
    },
    {
        speaker: 'layla',
        at: 87.03,
        text: 'Perfect! You’re booked with Dr. Pegel tomorrow at 8 AM — one hour. You’re all booked in, Robert: a confirmation text and email are on the way, plus a reminder before your visit. Take care!'
    }
];
const ACTIONS = [
    {
        at: 35.84,
        label: 'Read-back confirmation',
        code: 'confirm(details)'
    },
    {
        at: 48.38,
        label: 'Customer record saved',
        code: 'upsert_contact("Robert John")'
    },
    {
        at: 70.3,
        label: 'Checking calendar',
        code: 'check_availability("tomorrow")'
    },
    {
        at: 87.03,
        label: 'Booking confirmed',
        code: 'create_event("Dr. Pegel · 8:00 AM")'
    },
    {
        at: 94.5,
        label: 'Confirmation email',
        code: 'send_email(robertjohn123@yahoo.com)'
    },
    {
        at: 100.0,
        label: 'SMS reminder scheduled',
        code: 'send_sms("+011 5131 1…")'
    }
];
const AUDIO_SRC = 'audio/dentist-booking.mp3';
const FULL_CALL_SRC = 'audio/dentist-full.mp3';
const CUT_DURATION = 110.76;
function turnIndexAt(t) {
    let idx = -1;
    for(let i = 0; i < TURNS.length; i++){
        if (TURNS[i].at <= t + 0.12) idx = i;
        else break;
    }
    return idx;
}
function actionIndexAt(t) {
    let idx = -1;
    for(let i = 0; i < ACTIONS.length; i++){
        if (ACTIONS[i].at <= t) idx = i;
        else break;
    }
    return idx;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/use-pitch-audio.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePitchAudio",
    ()=>usePitchAudio
]);
/**
 * use-pitch-audio — hardened playback engine for the pitch's conversation
 * slide. Contract with the slide UI:
 *   - elementProps: spread onto a single <audio> element (ref/src/handlers)
 *   - status / t / duration / rate / error drive the controls + status chips
 *   - toggle / restart / seekTo / setRate / retry / runTranscript = actions
 * Failure modes surface loudly (never a silent dead button):
 *   autoplay-blocked → 'autoplay' chip (press play again),
 *   network / decode → actionable chip + RETRY / RUN TRANSCRIPT MODE,
 *   clock frozen 8 s while "playing" → 'stalled' chip + RETRY.
 * Transcript mode runs a simulated clock over the same TURNS timeline so the
 * demo still works when audio genuinely can't (codec, offline, CSP).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
const STALL_WATCH_MS = 8000;
function describeMediaError(a) {
    const code = a?.error?.code ?? 0;
    if (code === 2) return {
        kind: 'network',
        message: 'Network error fetching the recording.'
    };
    if (code === 3 || code === 4) return {
        kind: 'decode',
        message: 'This browser can’t decode the recording.'
    };
    if (code === 1) return {
        kind: 'unknown',
        message: 'Audio loading was aborted.'
    };
    return {
        kind: 'unknown',
        message: 'Playback failed unexpectedly.'
    };
}
function usePitchAudio(src, durationHint) {
    _s();
    const audioRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastTickRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        t: 0,
        at: 0
    });
    const simPosRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const statusRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])('idle');
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [t, setT] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [duration, setDuration] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(durationHint);
    const [rate, setRateState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const setStatusBoth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[setStatusBoth]": (s)=>{
            statusRef.current = s;
            setStatus(s);
        }
    }["usePitchAudio.useCallback[setStatusBoth]"], []);
    /* ---- mirror the element clock + watch for stalls while playing ---- */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePitchAudio.useEffect": ()=>{
            let raf = 0;
            const loop = {
                "usePitchAudio.useEffect.loop": ()=>{
                    const a = audioRef.current;
                    if (a && !a.paused && statusRef.current === 'playing') {
                        setT(a.currentTime);
                        const last = lastTickRef.current;
                        if (a.currentTime > last.t + 0.005) {
                            lastTickRef.current = {
                                t: a.currentTime,
                                at: Date.now()
                            };
                        } else if (Date.now() - last.at > STALL_WATCH_MS) {
                            setStatusBoth('error');
                            setError({
                                kind: 'stalled',
                                message: 'Playback clock frozen for 8 s — the stream stalled.'
                            });
                        }
                    }
                    raf = requestAnimationFrame(loop);
                }
            }["usePitchAudio.useEffect.loop"];
            raf = requestAnimationFrame(loop);
            return ({
                "usePitchAudio.useEffect": ()=>cancelAnimationFrame(raf)
            })["usePitchAudio.useEffect"];
        }
    }["usePitchAudio.useEffect"], [
        setStatusBoth
    ]);
    /* ---- transcript mode: simulated clock over the same timeline ---- */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePitchAudio.useEffect": ()=>{
            if (status !== 'transcript') return;
            let raf = 0;
            let last = performance.now();
            const step = {
                "usePitchAudio.useEffect.step": (now)=>{
                    simPosRef.current += (now - last) / 1000 * rate;
                    last = now;
                    if (simPosRef.current >= duration) {
                        simPosRef.current = duration;
                        setT(duration);
                        setStatusBoth('ended');
                        return;
                    }
                    setT(simPosRef.current);
                    raf = requestAnimationFrame(step);
                }
            }["usePitchAudio.useEffect.step"];
            raf = requestAnimationFrame(step);
            return ({
                "usePitchAudio.useEffect": ()=>cancelAnimationFrame(raf)
            })["usePitchAudio.useEffect"];
        }
    }["usePitchAudio.useEffect"], [
        status,
        rate,
        duration,
        setStatusBoth
    ]);
    /* ---- shared play attempt (used by toggle / restart / retry) ---- */ const attemptPlay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[attemptPlay]": ()=>{
            const a = audioRef.current;
            if (!a) return;
            setStatusBoth('loading');
            void a.play().then({
                "usePitchAudio.useCallback[attemptPlay]": ()=>setError(null)
            }["usePitchAudio.useCallback[attemptPlay]"]) // onPlay handler flips status to 'playing'
            .catch({
                "usePitchAudio.useCallback[attemptPlay]": (e)=>{
                    if (e?.name === 'NotAllowedError') {
                        setError({
                            kind: 'autoplay',
                            message: 'Browser blocked autoplay — press play once more.'
                        });
                        setStatusBoth('paused'); // user gesture already happened; next tap plays
                    } else if (e?.name === 'NotSupportedError') {
                        setError({
                            kind: 'decode',
                            message: 'Codec not supported here — run transcript mode instead.'
                        });
                        setStatusBoth('error');
                    } else {
                        setError(describeMediaError(a));
                        setStatusBoth('error');
                    }
                }
            }["usePitchAudio.useCallback[attemptPlay]"]);
        }
    }["usePitchAudio.useCallback[attemptPlay]"], [
        setStatusBoth
    ]);
    /* ---- element handlers (spread via elementProps) ---- */ const handleCanPlay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[handleCanPlay]": ()=>{
            setError(null);
            const a = audioRef.current;
            if (a && Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
            if (statusRef.current === 'loading') setStatusBoth('paused');
        }
    }["usePitchAudio.useCallback[handleCanPlay]"], [
        setStatusBoth
    ]);
    const handleLoadedMetadata = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[handleLoadedMetadata]": ()=>{
            const a = audioRef.current;
            if (a && Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
        }
    }["usePitchAudio.useCallback[handleLoadedMetadata]"], []);
    const handlePlay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[handlePlay]": ()=>{
            lastTickRef.current = {
                t: audioRef.current?.currentTime ?? 0,
                at: Date.now()
            };
            setError(null);
            setStatusBoth('playing');
        }
    }["usePitchAudio.useCallback[handlePlay]"], [
        setStatusBoth
    ]);
    const handlePause = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[handlePause]": ()=>{
            if (statusRef.current === 'playing') setStatusBoth('paused');
        }
    }["usePitchAudio.useCallback[handlePause]"], [
        setStatusBoth
    ]);
    const handleEnded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[handleEnded]": ()=>setStatusBoth('ended')
    }["usePitchAudio.useCallback[handleEnded]"], [
        setStatusBoth
    ]);
    const handleError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[handleError]": ()=>{
            setError(describeMediaError(audioRef.current));
            setStatusBoth('error');
        }
    }["usePitchAudio.useCallback[handleError]"], [
        setStatusBoth
    ]);
    /* ---- actions ---- */ const toggle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[toggle]": ()=>{
            const a = audioRef.current;
            if (statusRef.current === 'transcript') {
                // pause the simulated clock — next toggle tries real audio again
                setStatusBoth('paused');
                if (a) {
                    try {
                        a.currentTime = simPosRef.current;
                    } catch  {}
                }
                return;
            }
            if (!a) return;
            if (statusRef.current === 'playing') {
                a.pause();
                return;
            }
            if (statusRef.current === 'ended') {
                simPosRef.current = 0;
                try {
                    a.currentTime = 0;
                } catch  {}
            }
            attemptPlay();
        }
    }["usePitchAudio.useCallback[toggle]"], [
        attemptPlay,
        setStatusBoth
    ]);
    const restart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[restart]": ()=>{
            simPosRef.current = 0;
            setT(0);
            const a = audioRef.current;
            if (a) {
                try {
                    a.currentTime = 0;
                } catch  {}
            }
            attemptPlay();
        }
    }["usePitchAudio.useCallback[restart]"], [
        attemptPlay
    ]);
    const seekTo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[seekTo]": (sec)=>{
            const clamped = Math.max(0, Math.min(duration - 0.25, sec));
            if (statusRef.current === 'transcript') {
                simPosRef.current = clamped;
                setT(clamped);
                return;
            }
            const a = audioRef.current;
            if (!a) return;
            try {
                a.currentTime = clamped;
                setT(clamped);
            } catch  {}
        }
    }["usePitchAudio.useCallback[seekTo]"], [
        duration
    ]);
    /** pitch-preserving rate switch (Safari/Chrome/Firefox prefixes) */ const setRate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[setRate]": (r)=>{
            const a = audioRef.current;
            if (a) {
                a.playbackRate = r;
                const flagged = a;
                try {
                    flagged.preservesPitch = true;
                    flagged.mozPreservesPitch = true;
                    flagged.webkitPreservesPitch = true;
                } catch  {}
            }
            setRateState(r);
        }
    }["usePitchAudio.useCallback[setRate]"], []);
    const retry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[retry]": ()=>{
            setError(null);
            const a = audioRef.current;
            if (a) {
                try {
                    a.load();
                } catch  {}
            }
            attemptPlay();
        }
    }["usePitchAudio.useCallback[retry]"], [
        attemptPlay
    ]);
    const runTranscript = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "usePitchAudio.useCallback[runTranscript]": ()=>{
            audioRef.current?.pause();
            const a = audioRef.current;
            simPosRef.current = a && a.currentTime > 0 ? a.currentTime : simPosRef.current;
            setError(null);
            setStatusBoth('transcript');
        }
    }["usePitchAudio.useCallback[runTranscript]"], [
        setStatusBoth
    ]);
    const elementProps = {
        ref: audioRef,
        src,
        preload: 'auto',
        onCanPlay: handleCanPlay,
        onLoadedMetadata: handleLoadedMetadata,
        onPlay: handlePlay,
        onPause: handlePause,
        onEnded: handleEnded,
        onError: handleError
    };
    return {
        elementProps,
        status,
        t,
        duration,
        rate,
        error,
        toggle,
        restart,
        seekTo,
        setRate,
        retry,
        runTranscript
    };
}
_s(usePitchAudio, "H9Sa5cF/7G3jdD0W6psRqGoazLY=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/pitch/ConversationSlide.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ConversationSlide",
    ()=>ConversationSlide
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * THE CENTERPIECE SLIDE — a human (Robert) and the robot agent (Layla)
 * "having a conversation": the real recorded call plays, speech bubbles
 * appear in sync (timeline computed from the ASR transcript + silence-aligned
 * cut math), avatars animate while their side talks, and tool moments pop
 * as action chips. Playback goes through the hardened use-pitch-audio hook
 * (fail-loud status chips, seekable slider, pitch-preserving 1.5×).
 * PlayStation palette via the .ps-scope token remap.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-check.js [app-client] (ecmascript) <export default as CalendarCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarSearch$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-search.js [app-client] (ecmascript) <export default as CalendarSearch>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check-check.js [app-client] (ecmascript) <export default as CheckCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gauge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gauge$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gauge.js [app-client] (ecmascript) <export default as Gauge>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mail.js [app-client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square.js [app-client] (ecmascript) <export default as MessageSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pause$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pause$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pause.js [app-client] (ecmascript) <export default as Pause>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/play.js [app-client] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserPlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-plus.js [app-client] (ecmascript) <export default as UserPlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/pitch/conversation.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$pitch$2d$audio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-pitch-audio.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
const ACTION_ICONS = [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__["CheckCheck"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserPlus$3e$__["UserPlus"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarSearch$3e$__["CalendarSearch"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarCheck$3e$__["CalendarCheck"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"]
];
/* ---------------------------------- avatars ---------------------------------- */ /**
 * Photo avatars (user-supplied): Robert = big.jpg, Layla = OIP-….jpg.
 * Equal circular area + 2px ink border; while that side SPEAKS the ring
 * fills with PS Blue (#0070d1) and a soft blue halo appears. Labels sit on
 * cream chips so they stay readable over the blue speaking halo.
 */ function Avatar({ src, name, caption, talking, active, position = 'center', side = 'left' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        animate: talking ? {
            y: [
                0,
                -3,
                0
            ]
        } : {
            y: 0
        },
        transition: talking ? {
            repeat: Infinity,
            duration: 0.5,
            ease: 'easeInOut'
        } : {},
        className: "relative flex flex-col items-center",
        "aria-label": `${name} — ${caption}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('grid h-16 w-16 place-items-center rounded-full p-[3px] transition-all duration-300 sm:h-20 sm:w-20', active ? 'bg-[color:var(--stg-yellow)] shadow-[0_0_0_4px_rgba(0,112,209,0.25),0_0_18px_rgba(0,112,209,0.45)]' : 'bg-[color:var(--stg-ink)]/10'),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: src,
                    alt: "",
                    className: "h-full w-full select-none rounded-full border-2 border-[color:var(--stg-ink)] bg-white object-cover",
                    style: {
                        objectPosition: position
                    },
                    draggable: false
                }, void 0, false, {
                    fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                    lineNumber: 53,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('stg-label absolute -bottom-6 z-10 whitespace-nowrap rounded bg-[color:var(--stg-cream)] px-1.5 py-px text-[8px] transition-colors', side === 'right' ? 'right-0' : 'left-0', active ? 'text-[color:var(--stg-yellow-deep)]' : 'text-[color:var(--stg-ink)]/60'),
                children: [
                    name,
                    " · ",
                    caption
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                lineNumber: 61,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_c = Avatar;
function RobotAvatar({ talking, active }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Avatar, {
        src: "avatars/ai-layla.jpg",
        name: "LAYLA",
        caption: "AI",
        talking: talking,
        active: active,
        position: "center top",
        side: "right"
    }, void 0, false, {
        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
        lineNumber: 75,
        columnNumber: 10
    }, this);
}
_c1 = RobotAvatar;
function HumanAvatar({ talking, active }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Avatar, {
        src: "avatars/human-robert.jpg",
        name: "ROBERT",
        caption: "CALLER",
        talking: talking,
        active: active,
        position: "center 28%"
    }, void 0, false, {
        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
        lineNumber: 79,
        columnNumber: 10
    }, this);
}
_c2 = HumanAvatar;
/* ------------------------- status chip (loading/error) ------------------------ */ function StatusChip({ tone, children, onRetry, onTranscript }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        role: "status",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('stg-label inline-flex items-center gap-2 rounded border-2 px-2 py-1 text-[8px]', tone === 'loading' && 'border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)]/60', tone === 'transcript' && 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--ps-link-dark)]', tone === 'error' && 'border-[color:var(--ps-warn)] bg-white text-[color:var(--ps-warn)]'),
        children: [
            children,
            onRetry && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onRetry,
                className: "stg-label rounded border border-current px-1.5 py-px text-[8px] transition-colors hover:bg-[color:var(--stg-ink)] hover:text-white",
                children: "RETRY"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                lineNumber: 104,
                columnNumber: 9
            }, this),
            onTranscript && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onTranscript,
                className: "stg-label rounded border border-current px-1.5 py-px text-[8px] transition-colors hover:bg-[color:var(--stg-ink)] hover:text-white",
                children: "RUN TRANSCRIPT MODE"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                lineNumber: 109,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
        lineNumber: 93,
        columnNumber: 5
    }, this);
}
_c3 = StatusChip;
function ConversationSlide() {
    _s();
    const listRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const trackRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const draggingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const audio = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$pitch$2d$audio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePitchAudio"])('audio/dentist-booking.mp3', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CUT_DURATION"]);
    const { status, t, duration, rate, error } = audio;
    const playing = status === 'playing';
    const ended = status === 'ended';
    const idx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["turnIndexAt"])(t);
    const actIdx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["actionIndexAt"])(t);
    const activeSpeaker = idx < 0 ? null : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TURNS"][idx].speaker;
    const visible = idx < 0 ? [] : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TURNS"].slice(Math.max(0, idx - 4), idx + 1);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ConversationSlide.useEffect": ()=>{
            listRef.current?.scrollTo({
                top: listRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }["ConversationSlide.useEffect"], [
        idx
    ]);
    const pct = Math.min(100, t / (duration || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CUT_DURATION"]) * 100);
    /* ---- seekable progress track (pointer + keyboard) ---- */ const seekFromPointer = (clientX)=>{
        const el = trackRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        audio.seekTo(frac * (duration || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CUT_DURATION"]));
    };
    const fast = rate > 1.05;
    const toggleRate = ()=>audio.setRate(fast ? 1 : 1.5);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full flex-col px-4 py-3 sm:px-8",
        "data-testid": "conversation-slide",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("audio", {
                ...audio.elementProps
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                lineNumber: 154,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-x-3 gap-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "stg-label flex items-center gap-2 text-[10px] text-[color:var(--stg-ink)]/60",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-block h-2 w-2 animate-pulse bg-[color:var(--stg-yellow)]",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                lineNumber: 159,
                                columnNumber: 11
                            }, this),
                            "LIVE RECORDING · DOWNTOWN DENTIST"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 158,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "stg-label text-[10px] text-[color:var(--stg-ink)]/40",
                        children: "1:50 highlight of the 5:16 real call — not a script"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 162,
                        columnNumber: 9
                    }, this),
                    status === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusChip, {
                        tone: "loading",
                        children: "LOADING…"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 163,
                        columnNumber: 34
                    }, this),
                    status === 'transcript' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusChip, {
                        tone: "transcript",
                        children: "TRANSCRIPT MODE"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 164,
                        columnNumber: 37
                    }, this),
                    status === 'error' && error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusChip, {
                        tone: "error",
                        onRetry: audio.retry,
                        onTranscript: audio.runTranscript,
                        children: [
                            error.kind.toUpperCase(),
                            " · ",
                            error.message
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 166,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                lineNumber: 157,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_260px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex min-h-0 flex-col rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] p-3 sm:p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-start justify-between gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col items-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HumanAvatar, {
                                            talking: playing && activeSpeaker === 'robert',
                                            active: activeSpeaker === 'robert'
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                            lineNumber: 177,
                                            columnNumber: 57
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                        lineNumber: 177,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-1 flex-col items-center pt-1",
                                        "aria-hidden": true,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex h-8 items-end gap-1",
                                                children: Array.from({
                                                    length: 9
                                                }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-1 rounded-full', playing ? 'bg-[color:var(--stg-ink)]' : 'bg-[color:var(--stg-ink)]/20'),
                                                        style: playing ? {
                                                            height: `${6 + i * 7919 % 22}px`,
                                                            animation: `stg-wave 0.9s ease-in-out ${i % 5 * 0.12}s infinite alternate`
                                                        } : {
                                                            height: '6px'
                                                        }
                                                    }, i, false, {
                                                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                                        lineNumber: 181,
                                                        columnNumber: 19
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                                lineNumber: 179,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "stg-label mt-1 text-[8px] text-[color:var(--stg-ink)]/45",
                                                children: "+1 (513) 555-0117 · PHONE"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                                lineNumber: 185,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                        lineNumber: 178,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col items-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RobotAvatar, {
                                            talking: playing && activeSpeaker === 'layla',
                                            active: activeSpeaker === 'layla'
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                            lineNumber: 187,
                                            columnNumber: 57
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                        lineNumber: 187,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                lineNumber: 176,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: listRef,
                                className: "stg-scroll mt-4 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1",
                                "aria-live": "polite",
                                children: [
                                    idx < 0 && !playing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "stg-label py-8 text-center text-[11px] text-[color:var(--stg-ink)]/45",
                                        children: "Press play — watch Layla book a real appointment, live."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                        lineNumber: 193,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                        initial: false,
                                        children: visible.map((turn, vi)=>{
                                            const mine = turn.speaker === 'layla';
                                            const isCurrent = idx - Math.max(0, idx - 4) === vi;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                initial: {
                                                    opacity: 0,
                                                    y: 14,
                                                    scale: 0.96
                                                },
                                                animate: {
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1
                                                },
                                                transition: {
                                                    duration: 0.25,
                                                    ease: [
                                                        0.16,
                                                        1,
                                                        0.3,
                                                        1
                                                    ]
                                                },
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex', mine ? 'justify-end' : 'justify-start'),
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('max-w-[85%] rounded-2xl border-2 px-3.5 py-2.5 text-[12px] leading-snug sm:text-[13px]', mine ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]' : 'border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)]', isCurrent && (mine ? 'shadow-[4px_4px_0_0_var(--stg-yellow)]' : 'shadow-[4px_4px_0_0_var(--stg-ink)]')),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('stg-label mr-2 text-[8px]', mine ? 'text-[color:var(--ps-link-dark)]' : 'text-[color:var(--stg-ink)]/50'),
                                                            children: mine ? 'LAYLA' : 'ROBERT'
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                                            lineNumber: 214,
                                                            columnNumber: 23
                                                        }, this),
                                                        turn.text
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                                    lineNumber: 207,
                                                    columnNumber: 21
                                                }, this)
                                            }, `${turn.at}-${turn.speaker}`, false, {
                                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                                lineNumber: 200,
                                                columnNumber: 19
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                        lineNumber: 195,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                lineNumber: 191,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 175,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden min-h-0 flex-col rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-3 lg:flex",
                        "aria-label": "Agent tool calls",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "stg-label text-[9px] text-[color:var(--stg-ink)]/55",
                                children: "AGENT TRACE · TOOL CALLS"
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                lineNumber: 228,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "stg-scroll mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1",
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ACTIONS"].map((a, i)=>{
                                    const fired = i <= actIdx;
                                    const Icon = ACTION_ICONS[i] ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__["CheckCheck"];
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                        animate: fired ? {
                                            scale: [
                                                1.04,
                                                1
                                            ]
                                        } : {},
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-lg border-2 p-2.5 transition-all duration-300', fired ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)]' : 'border-dashed border-[color:var(--stg-ink)]/20 opacity-45'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-4 w-4 shrink-0', fired ? 'text-[color:var(--stg-ink)]' : 'text-[color:var(--stg-ink)]/40'),
                                                        "aria-hidden": true
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                                        lineNumber: 239,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "stg-label text-[9px] text-[color:var(--stg-ink)]/70",
                                                        children: a.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                                        lineNumber: 240,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                                lineNumber: 238,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mt-1 block truncate font-mono text-[10px]', fired ? 'text-[color:var(--stg-ink)]' : 'text-[color:var(--stg-ink)]/40'),
                                                children: fired ? a.code : '— — —'
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                                lineNumber: 242,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, a.code, true, {
                                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                        lineNumber: 234,
                                        columnNumber: 17
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                lineNumber: 229,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                children: ended && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        opacity: 0,
                                        y: 10
                                    },
                                    animate: {
                                        opacity: 1,
                                        y: 0
                                    },
                                    className: "mt-2 rounded-lg border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] p-2.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "stg-label text-[9px] text-white/80",
                                            children: "OUTCOME"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                            lineNumber: 250,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-0.5 text-[11px] font-semibold leading-tight text-white",
                                            children: "✅ Appointment booked — Dr. Pegel · tomorrow 8:00 AM · email + SMS sent"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                            lineNumber: 251,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                    lineNumber: 249,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                lineNumber: 247,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 227,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                lineNumber: 173,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 flex items-center gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: audio.toggle,
                        "aria-label": playing ? 'Pause the call' : 'Play the call',
                        className: "stg-label inline-flex h-11 min-w-[112px] items-center justify-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-4 text-[10px] text-white shadow-[4px_4px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0",
                        children: [
                            playing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pause$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pause$3e$__["Pause"], {
                                className: "h-4 w-4",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                lineNumber: 265,
                                columnNumber: 22
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                className: "h-4 w-4",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                lineNumber: 265,
                                columnNumber: 66
                            }, this),
                            playing ? 'PAUSE' : ended ? 'REPLAY' : t > 0 ? 'RESUME' : 'PLAY THE CALL'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 260,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: audio.restart,
                        "aria-label": "Restart the call",
                        className: "grid h-11 w-11 place-items-center border-2 border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)] transition-colors hover:border-[color:var(--stg-ink)]",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                            className: "h-4 w-4",
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                            lineNumber: 269,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 268,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: toggleRate,
                        "aria-pressed": fast,
                        "aria-label": "Toggle 1.5x speed",
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('stg-label inline-flex h-11 items-center gap-1.5 border-2 px-3 text-[10px] transition-colors', fast ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--ps-link-dark)]' : 'border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)]/70 hover:border-[color:var(--stg-ink)]'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gauge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gauge$3e$__["Gauge"], {
                                className: "h-4 w-4",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                lineNumber: 277,
                                columnNumber: 11
                            }, this),
                            " 1.5×"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0 flex-1",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            ref: trackRef,
                            role: "slider",
                            tabIndex: 0,
                            "aria-label": "Seek within the call",
                            "aria-valuemin": 0,
                            "aria-valuemax": Math.round(duration || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CUT_DURATION"]),
                            "aria-valuenow": Math.round(t),
                            "aria-valuetext": `${fmt(t)} of ${fmt(duration || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CUT_DURATION"])}`,
                            onPointerDown: (e)=>{
                                draggingRef.current = true;
                                e.currentTarget.setPointerCapture(e.pointerId);
                                seekFromPointer(e.clientX);
                            },
                            onPointerMove: (e)=>{
                                if (draggingRef.current) seekFromPointer(e.clientX);
                            },
                            onPointerUp: (e)=>{
                                draggingRef.current = false;
                                e.currentTarget.releasePointerCapture(e.pointerId);
                            },
                            onKeyDown: (e)=>{
                                const step = e.shiftKey ? 15 : 5;
                                if (e.key === 'ArrowRight') {
                                    e.preventDefault();
                                    audio.seekTo(t + step);
                                } else if (e.key === 'ArrowLeft') {
                                    e.preventDefault();
                                    audio.seekTo(t - step);
                                } else if (e.key === 'Home') {
                                    e.preventDefault();
                                    audio.seekTo(0);
                                } else if (e.key === 'End') {
                                    e.preventDefault();
                                    audio.seekTo((duration || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CUT_DURATION"]) - 1);
                                }
                            },
                            className: "h-2.5 cursor-pointer touch-none overflow-hidden rounded-full border-2 border-[color:var(--stg-ink)]/25 bg-white",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-full bg-[color:var(--stg-ink)] transition-[width] duration-150",
                                style: {
                                    width: `${pct}%`
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                                lineNumber: 301,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                            lineNumber: 280,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 279,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stg-label w-16 text-right text-[10px] tabular-nums text-[color:var(--stg-ink)]/60",
                        children: [
                            fmt(t),
                            " / ",
                            fmt(duration || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CUT_DURATION"])
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                        lineNumber: 304,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                lineNumber: 259,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                children: ended && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    className: "stg-label mt-2 text-center text-[9px] text-[color:var(--stg-ink)]/70 lg:hidden",
                    children: "✅ BOOKED — DR. PEGEL · 8:00 AM · EMAIL + SMS SENT"
                }, void 0, false, {
                    fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                    lineNumber: 312,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
                lineNumber: 310,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/ConversationSlide.tsx",
        lineNumber: 153,
        columnNumber: 5
    }, this);
}
_s(ConversationSlide, "AJIHAuPYHO87h7oBo76wIhtM3oY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$pitch$2d$audio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePitchAudio"]
    ];
});
_c4 = ConversationSlide;
function fmt(s) {
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${String(ss).padStart(2, '0')}`;
}
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "Avatar");
__turbopack_context__.k.register(_c1, "RobotAvatar");
__turbopack_context__.k.register(_c2, "HumanAvatar");
__turbopack_context__.k.register(_c3, "StatusChip");
__turbopack_context__.k.register(_c4, "ConversationSlide");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/pitch/DemoApp.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DemoApp",
    ()=>DemoApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * INTERACTIVE DEMO — the app we're proposing, as a clickable mock.
 * "Call Layla" → ringing → the real recorded call plays with a live
 * transcript + agent tool trace → booking summary + dashboard, plus a
 * simulated tool playground (check_availability / create_event / send_email).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-check.js [app-client] (ecmascript) <export default as CalendarCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarSearch$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-search.js [app-client] (ecmascript) <export default as CalendarSearch>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check-check.js [app-client] (ecmascript) <export default as CheckCheck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/globe.js [app-client] (ecmascript) <export default as Globe>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mail.js [app-client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square.js [app-client] (ecmascript) <export default as MessageSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/phone.js [app-client] (ecmascript) <export default as Phone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2d$call$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PhoneCall$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/phone-call.js [app-client] (ecmascript) <export default as PhoneCall>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PhoneOff$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/phone-off.js [app-client] (ecmascript) <export default as PhoneOff>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/send.js [app-client] (ecmascript) <export default as Send>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$terminal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TerminalSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square-terminal.js [app-client] (ecmascript) <export default as TerminalSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserPlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user-plus.js [app-client] (ecmascript) <export default as UserPlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/pitch/conversation.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
const ACTION_ICONS = [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__["CheckCheck"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserPlus$3e$__["UserPlus"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarSearch$3e$__["CalendarSearch"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarCheck$3e$__["CalendarCheck"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"]
];
const CHANNELS = [
    {
        id: 'phone',
        label: 'Phone',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"]
    },
    {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"]
    },
    {
        id: 'telegram',
        label: 'Telegram',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"]
    },
    {
        id: 'web',
        label: 'Web voice',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"]
    }
];
const TRACE_STEPS = [
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__["CheckCheck"],
        label: 'Read-back confirmation',
        code: 'confirm(details)'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__UserPlus$3e$__["UserPlus"],
        label: 'Customer record saved',
        code: 'upsert_contact("Robert John")'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarSearch$3e$__["CalendarSearch"],
        label: 'Checking calendar',
        code: 'check_availability("tomorrow")'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarCheck$3e$__["CalendarCheck"],
        label: 'Booking confirmed',
        code: 'create_event("Dr. Pegel · 8:00 AM")'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"],
        label: 'Confirmation email',
        code: 'send_email(robertjohn123@yahoo.com)'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"],
        label: 'SMS reminder scheduled',
        code: 'send_sms("+011 5131 1…")'
    }
];
function DemoApp({ compact = false }) {
    _s();
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [channel, setChannel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('phone');
    const [t, setT] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('trace');
    const audioRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const rafRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const feedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // ringing → live
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DemoApp.useEffect": ()=>{
            if (phase !== 'ringing') return;
            const id = setTimeout({
                "DemoApp.useEffect.id": ()=>{
                    setPhase('live');
                    setTab('trace');
                    void audioRef.current?.play().catch({
                        "DemoApp.useEffect.id": ()=>{}
                    }["DemoApp.useEffect.id"]);
                }
            }["DemoApp.useEffect.id"], 1500);
            return ({
                "DemoApp.useEffect": ()=>clearTimeout(id)
            })["DemoApp.useEffect"];
        }
    }["DemoApp.useEffect"], [
        phase
    ]);
    // playback clock
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DemoApp.useEffect": ()=>{
            const tick = {
                "DemoApp.useEffect.tick": ()=>{
                    const a = audioRef.current;
                    if (a && phase === 'live') setT(a.currentTime);
                    rafRef.current = requestAnimationFrame(tick);
                }
            }["DemoApp.useEffect.tick"];
            rafRef.current = requestAnimationFrame(tick);
            return ({
                "DemoApp.useEffect": ()=>cancelAnimationFrame(rafRef.current)
            })["DemoApp.useEffect"];
        }
    }["DemoApp.useEffect"], [
        phase
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DemoApp.useEffect": ()=>({
                "DemoApp.useEffect": ()=>{
                    audioRef.current?.pause();
                }
            })["DemoApp.useEffect"]
    }["DemoApp.useEffect"], []);
    const idx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["turnIndexAt"])(t);
    const actIdx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["actionIndexAt"])(t);
    const visible = idx < 0 ? [] : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TURNS"].slice(Math.max(0, idx - 5), idx + 1);
    const call = ()=>{
        setT(0);
        setPhase('ringing');
    };
    const hangup = ()=>{
        audioRef.current?.pause();
        setPhase('done');
        setTab('dashboard');
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DemoApp.useEffect": ()=>{
            if (phase !== 'live') return;
            feedRef.current?.scrollTo({
                top: feedRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }["DemoApp.useEffect"], [
        idx,
        phase
    ]);
    const ChannelIcon = (CHANNELS.find((c)=>c.id === channel) ?? CHANNELS[0]).icon;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('grid w-full gap-3', compact ? 'lg:grid-cols-[300px_1fr]' : 'lg:grid-cols-[340px_1fr]'),
        "data-testid": "demo-app",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("audio", {
                ref: audioRef,
                src: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$pitch$2f$conversation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AUDIO_SRC"],
                preload: "auto",
                onEnded: ()=>{
                    setPhase('done');
                    setTab('dashboard');
                }
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col overflow-hidden rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)] shadow-[6px_6px_0_0_var(--stg-yellow)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 border-b-2 border-white/10 px-3 py-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChannelIcon, {
                                className: "h-3.5 w-3.5 text-[color:var(--ps-link-dark)]",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "stg-label text-[9px]",
                                children: [
                                    CHANNELS.find((c)=>c.id === channel)?.label.toUpperCase(),
                                    " · DOWNTOWN DENTIST"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 101,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('stg-label ml-auto flex items-center gap-1 text-[8px]', phase === 'live' ? 'text-emerald-400' : 'text-white/40'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-1.5 w-1.5 rounded-full', phase === 'live' ? 'animate-pulse bg-emerald-400' : 'bg-white/30'),
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 103,
                                        columnNumber: 13
                                    }, this),
                                    phase === 'live' ? 'LIVE' : phase === 'ringing' ? 'RINGING' : phase === 'done' ? 'ENDED' : 'OFFLINE'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-1 border-b-2 border-white/10 px-2 py-1.5",
                        role: "tablist",
                        "aria-label": "Channels",
                        children: CHANNELS.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                role: "tab",
                                "aria-selected": channel === c.id,
                                onClick: ()=>setChannel(c.id),
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('stg-label flex items-center gap-1 rounded px-2 py-1.5 text-[8px] transition-colors', channel === c.id ? 'bg-[color:var(--stg-yellow)] text-white' : 'text-white/50 hover:text-white'),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(c.icon, {
                                        className: "h-3 w-3",
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 114,
                                        columnNumber: 15
                                    }, this),
                                    " ",
                                    c.label
                                ]
                            }, c.id, true, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 111,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 109,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative min-h-[300px] flex-1 bg-[color:var(--stg-cream)] p-3 text-[color:var(--stg-ink)] sm:min-h-[340px]",
                        children: [
                            phase === 'idle' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-full flex-col items-center justify-center gap-4 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid h-20 w-20 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-white p-1",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: "avatars/ai-layla.jpg",
                                            alt: "Layla — the AI receptionist",
                                            className: "h-full w-full rounded-full object-cover object-top",
                                            draggable: false
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                            lineNumber: 124,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 123,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "stg-display text-lg uppercase",
                                                children: "Layla"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 127,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "stg-label mt-1 text-[9px] text-[color:var(--stg-ink)]/55",
                                                children: "AI RECEPTIONIST · ANSWERS IN ~700 MS"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 128,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 126,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: call,
                                        "data-testid": "demo-call",
                                        className: "stg-label inline-flex h-12 items-center gap-2 rounded-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-6 text-[11px] text-white shadow-[4px_4px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2d$call$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PhoneCall$3e$__["PhoneCall"], {
                                                className: "h-4 w-4",
                                                "aria-hidden": true
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 132,
                                                columnNumber: 17
                                            }, this),
                                            " CALL LAYLA"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 130,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "stg-label text-[8px] text-[color:var(--stg-ink)]/40",
                                        children: "SIMULATED UI · REAL RECORDED VOICE"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 134,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 122,
                                columnNumber: 13
                            }, this),
                            phase === 'ringing' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-full flex-col items-center justify-center gap-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative grid h-20 w-20 place-items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "absolute inset-0 animate-ping rounded-full border-2 border-[color:var(--stg-ink)]/40",
                                                "aria-hidden": true
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 141,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "absolute inset-0 animate-ping rounded-full border-2 border-[color:var(--stg-ink)]/25 [animation-delay:0.4s]",
                                                "aria-hidden": true
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 142,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "grid h-16 w-16 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-white",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2d$call$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PhoneCall$3e$__["PhoneCall"], {
                                                    className: "h-7 w-7 animate-bounce",
                                                    "aria-hidden": true
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                    lineNumber: 144,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 143,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 140,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "stg-label text-[10px] text-[color:var(--stg-ink)]/60",
                                        children: "CONNECTING TO LAYLA…"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 147,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 139,
                                columnNumber: 13
                            }, this),
                            phase === 'live' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-full min-h-0 flex-col",
                                "data-testid": "demo-live",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        ref: feedRef,
                                        className: "stg-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1",
                                        "aria-live": "polite",
                                        children: visible.map((turn, vi)=>{
                                            const mine = turn.speaker === 'layla';
                                            const isCurrent = idx - Math.max(0, idx - 5) === vi;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                                initial: {
                                                    opacity: 0,
                                                    y: 10
                                                },
                                                animate: {
                                                    opacity: 1,
                                                    y: 0
                                                },
                                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex', mine ? 'justify-start' : 'justify-end'),
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('max-w-[88%] rounded-xl border-2 px-2.5 py-1.5 text-[11px] leading-snug', mine ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]' : 'border-[color:var(--stg-ink)]/25 bg-white', isCurrent && (mine ? 'shadow-[3px_3px_0_0_var(--stg-yellow)]' : 'shadow-[3px_3px_0_0_var(--stg-ink)]')),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('stg-label mr-2 text-[8px]', mine ? 'text-[color:var(--ps-link-dark)]' : 'text-[color:var(--stg-ink)]/50'),
                                                            children: mine ? 'LAYLA' : 'YOU'
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                            lineNumber: 163,
                                                            columnNumber: 25
                                                        }, this),
                                                        turn.text
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                    lineNumber: 160,
                                                    columnNumber: 23
                                                }, this)
                                            }, `${turn.at}-${turn.speaker}`, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 158,
                                                columnNumber: 21
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 153,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 flex items-center gap-2 border-t-2 border-[color:var(--stg-ink)]/10 pt-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex h-6 flex-1 items-end gap-0.5",
                                                "aria-hidden": true,
                                                children: Array.from({
                                                    length: 28
                                                }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "w-1 flex-1 rounded-full bg-[color:var(--stg-ink)]/70",
                                                        style: {
                                                            height: `${20 + i * 4523 % 80}%`,
                                                            animation: `stg-wave 0.7s ease-in-out ${i % 7 * 0.09}s infinite alternate`
                                                        }
                                                    }, i, false, {
                                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                        lineNumber: 173,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 171,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: hangup,
                                                "aria-label": "End the call",
                                                className: "grid h-9 w-9 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-red-500 text-white shadow-[3px_3px_0_0_var(--stg-ink)]",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PhoneOff$3e$__["PhoneOff"], {
                                                    className: "h-4 w-4",
                                                    "aria-hidden": true
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                    lineNumber: 179,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 177,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 170,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 152,
                                columnNumber: 13
                            }, this),
                            phase === 'done' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-full flex-col items-center justify-center gap-3 text-center",
                                "data-testid": "demo-done",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                        initial: {
                                            scale: 0.6,
                                            opacity: 0
                                        },
                                        animate: {
                                            scale: 1,
                                            opacity: 1
                                        },
                                        transition: {
                                            type: 'spring',
                                            stiffness: 260,
                                            damping: 18
                                        },
                                        className: "grid h-16 w-16 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-emerald-500 text-white shadow-[4px_4px_0_0_var(--stg-ink)]",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarCheck$3e$__["CalendarCheck"], {
                                            className: "h-8 w-8",
                                            "aria-hidden": true
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                            lineNumber: 189,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 187,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-xl border-2 border-[color:var(--stg-ink)] bg-white px-4 py-3 shadow-[4px_4px_0_0_var(--stg-yellow)]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "stg-label text-[8px] text-[color:var(--stg-ink)]/55",
                                                children: "APPOINTMENT BOOKED"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 192,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "stg-display mt-1 text-base uppercase leading-tight",
                                                children: "Dr. Pegel · Tomorrow 8:00 AM"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 193,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 text-[11px] text-[color:var(--stg-ink)]/70",
                                                children: " robertjohn123@yahoo.com · full checkup + toothache · 1 hour"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 194,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 191,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: call,
                                        className: "stg-label inline-flex h-10 items-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-4 text-[10px] text-white shadow-[3px_3px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                                className: "h-3.5 w-3.5",
                                                "aria-hidden": true
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                lineNumber: 197,
                                                columnNumber: 17
                                            }, this),
                                            " RUN THE CALL AGAIN"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 196,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 186,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 120,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                lineNumber: 98,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex min-h-0 flex-col rounded-xl border-2 border-[color:var(--stg-ink)] bg-white",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-1 border-b-2 border-[color:var(--stg-ink)]/10 p-2",
                        role: "tablist",
                        "aria-label": "Demo panels",
                        children: [
                            [
                                [
                                    'trace',
                                    'AGENT TRACE',
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2d$terminal$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TerminalSquare$3e$__["TerminalSquare"]
                                ],
                                [
                                    'tools',
                                    'TOOL PLAYGROUND',
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"]
                                ],
                                [
                                    'dashboard',
                                    'DASHBOARD',
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"]
                                ]
                            ].map(([id, label, Icon])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    role: "tab",
                                    "aria-selected": tab === id,
                                    onClick: ()=>setTab(id),
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('stg-label inline-flex items-center gap-1.5 border-2 px-2.5 py-2 text-[9px] transition-colors', tab === id ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--ps-link-dark)]' : 'border-transparent text-[color:var(--stg-ink)]/55 hover:text-[color:var(--stg-ink)]'),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                            className: "h-3.5 w-3.5",
                                            "aria-hidden": true
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                            lineNumber: 211,
                                            columnNumber: 15
                                        }, this),
                                        " ",
                                        label
                                    ]
                                }, id, true, {
                                    fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                    lineNumber: 208,
                                    columnNumber: 13
                                }, this)),
                            phase !== 'idle' && tab === 'trace' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    audioRef.current?.pause();
                                    setPhase('idle');
                                    setT(0);
                                },
                                className: "stg-label ml-auto text-[9px] text-[color:var(--stg-ink)]/50 hover:text-[color:var(--stg-ink)]",
                                children: "RESET"
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 215,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "stg-scroll min-h-[260px] flex-1 overflow-y-auto p-3 sm:min-h-[320px]",
                        children: [
                            tab === 'trace' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                "data-testid": "demo-trace",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "stg-label text-[8px] text-[color:var(--stg-ink)]/50",
                                        children: "WHAT LAYLA DOES WHILE SHE TALKS — EVERY STEP IS A REAL TOOL CALL"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 222,
                                        columnNumber: 15
                                    }, this),
                                    TRACE_STEPS.map((s, i)=>{
                                        const fired = actIdx >= i && (phase === 'live' || phase === 'done');
                                        const Icon = s.icon;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                            animate: fired ? {
                                                x: [
                                                    6,
                                                    0
                                                ]
                                            } : {},
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center gap-2.5 rounded-lg border-2 p-2.5 transition-all duration-300', fired ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)]' : 'border-dashed border-[color:var(--stg-ink)]/15 opacity-40'),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-4 w-4 shrink-0', fired ? 'text-[color:var(--stg-ink)]' : 'text-[color:var(--stg-ink)]/30'),
                                                    "aria-hidden": true
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                    lineNumber: 229,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "stg-label text-[9px]",
                                                            children: s.label
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                            lineNumber: 231,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                            className: "block truncate font-mono text-[10px] text-[color:var(--stg-ink)]/70",
                                                            children: fired ? s.code : 'waiting…'
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                            lineNumber: 232,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                    lineNumber: 230,
                                                    columnNumber: 21
                                                }, this),
                                                fired && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCheck$3e$__["CheckCheck"], {
                                                    className: "ml-auto h-4 w-4 shrink-0 text-emerald-600",
                                                    "aria-hidden": true
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                                    lineNumber: 234,
                                                    columnNumber: 31
                                                }, this)
                                            ]
                                        }, s.code, true, {
                                            fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                            lineNumber: 227,
                                            columnNumber: 19
                                        }, this);
                                    }),
                                    phase === 'idle' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "stg-label pt-2 text-center text-[9px] text-[color:var(--stg-ink)]/40",
                                        children: "Press “CALL LAYLA” — the trace lights up in sync with the real audio."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 238,
                                        columnNumber: 36
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 221,
                                columnNumber: 13
                            }, this),
                            tab === 'tools' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToolPlayground, {}, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 242,
                                columnNumber: 31
                            }, this),
                            tab === 'dashboard' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MiniDashboard, {}, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 244,
                                columnNumber: 35
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 219,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                lineNumber: 205,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/DemoApp.tsx",
        lineNumber: 94,
        columnNumber: 5
    }, this);
}
_s(DemoApp, "gbKjEMBNW4tYADczb34BY2yt8S4=");
_c = DemoApp;
/* ------------------------------- tool playground ------------------------------ */ const SLOT_LINES = '{ ok: true, date: "tomorrow", slots: ["08:00","11:30","14:00"] }';
const EVENT_LINES = '{ ok: true, event: "Dr. Pegel — Robert John", when: "tomorrow 08:00–09:00", invite: "sent → robertjohn123@yahoo.com" }';
const MAIL_LINES = '{ ok: true, to: "robertjohn123@yahoo.com", subject: "Your appointment at Downtown Dentist", attached: "calendar-invite.ics" }';
function ToolPlayground() {
    _s1();
    const [out, setOut] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [slots, setSlots] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([
        '08:00',
        '11:30',
        '14:00'
    ]);
    const run = (name, body, after)=>{
        setOut((o)=>[
                ...o.slice(-2),
                {
                    name,
                    body
                }
            ]);
        after?.();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        "data-testid": "demo-tools",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label text-[8px] text-[color:var(--stg-ink)]/50",
                children: "THE TOOLS EVERY CLIENT GETS — CLICK ONE, SEE THE (SIMULATED) RESPONSE THE AGENT ACTS ON"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                lineNumber: 268,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>run('check_availability()', SLOT_LINES),
                        className: "stg-label inline-flex h-10 items-center gap-1.5 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] px-3 text-[9px] shadow-[3px_3px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarSearch$3e$__["CalendarSearch"], {
                                className: "h-3.5 w-3.5",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 272,
                                columnNumber: 11
                            }, this),
                            " check_availability"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 270,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>run('create_event()', EVENT_LINES, ()=>setSlots([
                                    '11:30',
                                    '14:00'
                                ])),
                        className: "stg-label inline-flex h-10 items-center gap-1.5 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] px-3 text-[9px] shadow-[3px_3px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarCheck$3e$__["CalendarCheck"], {
                                className: "h-3.5 w-3.5",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 276,
                                columnNumber: 11
                            }, this),
                            " create_event"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 274,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>run('send_email()', MAIL_LINES),
                        className: "stg-label inline-flex h-10 items-center gap-1.5 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] px-3 text-[9px] shadow-[3px_3px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                className: "h-3.5 w-3.5",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 280,
                                columnNumber: 11
                            }, this),
                            " send_email"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 278,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                lineNumber: 269,
                columnNumber: 7
            }, this),
            slots.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border-2 border-[color:var(--stg-ink)]/15 p-2.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "stg-label text-[8px] text-[color:var(--stg-ink)]/50",
                        children: "TOMORROW — LIVE SLOTS"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 286,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1.5 flex flex-wrap gap-1.5",
                        children: [
                            slots.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "rounded border border-[color:var(--stg-ink)]/30 px-2 py-1 font-mono text-[10px]",
                                    children: s
                                }, s, false, {
                                    fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                    lineNumber: 289,
                                    columnNumber: 15
                                }, this)),
                            slots.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "stg-label text-[9px] text-emerald-700",
                                children: "fully booked by the agent 🎉"
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 291,
                                columnNumber: 36
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 287,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                lineNumber: 285,
                columnNumber: 9
            }, this),
            out.map((o, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                    initial: {
                        opacity: 0,
                        y: 8
                    },
                    animate: {
                        opacity: 1,
                        y: 0
                    },
                    className: "overflow-hidden rounded-lg border-2 border-[color:var(--stg-ink)]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "stg-label border-b-2 border-[color:var(--stg-ink)]/10 bg-[color:var(--stg-cream-2)] px-2.5 py-1.5 text-[8px]",
                            children: [
                                "→ ",
                                o.name
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/pitch/DemoApp.tsx",
                            lineNumber: 298,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                            className: "overflow-x-auto whitespace-pre-wrap p-2.5 font-mono text-[10px] leading-relaxed text-[color:var(--stg-ink)]/85",
                            children: o.body
                        }, void 0, false, {
                            fileName: "[project]/src/components/pitch/DemoApp.tsx",
                            lineNumber: 299,
                            columnNumber: 11
                        }, this)
                    ]
                }, `${o.name}-${i}`, true, {
                    fileName: "[project]/src/components/pitch/DemoApp.tsx",
                    lineNumber: 297,
                    columnNumber: 9
                }, this)),
            out.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label py-4 text-center text-[9px] text-[color:var(--stg-ink)]/40",
                children: "No calls yet — try one above."
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                lineNumber: 302,
                columnNumber: 28
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/DemoApp.tsx",
        lineNumber: 267,
        columnNumber: 5
    }, this);
}
_s1(ToolPlayground, "poaA/fjejfkcHChwLOJpTTZi05I=");
_c1 = ToolPlayground;
/* -------------------------------- dashboard tab ------------------------------- */ function MiniDashboard() {
    const stats = [
        {
            label: 'ANSWER RATE',
            value: '100%',
            note: '24/7 — no hold music'
        },
        {
            label: 'BOOKINGS TODAY',
            value: '1',
            note: 'Robert · 8:00 AM'
        },
        {
            label: 'AVG RESPONSE',
            value: '~700 ms',
            note: 'streaming STT→LLM→TTS'
        },
        {
            label: 'COST / CALL',
            value: '$0.19',
            note: 'self-hosted — illustrative'
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        "data-testid": "demo-dashboard",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label text-[8px] text-[color:var(--stg-ink)]/50",
                children: "EVERY CLIENT GETS THIS VIEW — CALLS, TRANSCRIPTS, OUTCOMES, COSTS. (DEMO DATA IS ILLUSTRATIVE)"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                lineNumber: 318,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 gap-2",
                children: stats.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "stg-label text-[8px] text-[color:var(--stg-ink)]/55",
                                children: s.label
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 322,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "stg-display mt-1 text-xl uppercase text-[color:var(--stg-ink)]",
                                children: s.value
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 323,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-0.5 text-[10px] text-[color:var(--stg-ink)]/60",
                                children: s.note
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 324,
                                columnNumber: 13
                            }, this)
                        ]
                    }, s.label, true, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 321,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                lineNumber: 319,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border-2 border-[color:var(--stg-ink)] p-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "stg-label text-[8px] text-[color:var(--stg-ink)]/55",
                        children: "LATEST TRANSCRIPT — FLAGGED ENTITIES"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 329,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-2 flex flex-wrap gap-1.5",
                        children: [
                            [
                                'NAME',
                                'Robert John'
                            ],
                            [
                                'EMAIL',
                                'robertjohn123@yahoo.com'
                            ],
                            [
                                'PHONE',
                                '011 5131 1…'
                            ],
                            [
                                'INTENT',
                                'emergency + full checkup'
                            ],
                            [
                                'SLOT',
                                'tomorrow 08:00'
                            ],
                            [
                                'STATUS',
                                'booked ✅'
                            ]
                        ].map(([k, v])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-flex items-center gap-1.5 rounded-full border border-[color:var(--stg-ink)]/25 bg-white px-2.5 py-1 text-[10px]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "stg-label text-[7px] text-[color:var(--stg-ink)]/50",
                                        children: k
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                        lineNumber: 333,
                                        columnNumber: 15
                                    }, this),
                                    " ",
                                    v
                                ]
                            }, k, true, {
                                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                                lineNumber: 332,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/DemoApp.tsx",
                        lineNumber: 330,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/DemoApp.tsx",
                lineNumber: 328,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/DemoApp.tsx",
        lineNumber: 317,
        columnNumber: 5
    }, this);
}
_c2 = MiniDashboard;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "DemoApp");
__turbopack_context__.k.register(_c1, "ToolPlayground");
__turbopack_context__.k.register(_c2, "MiniDashboard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/pitch/PitchDeck.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PitchDeck",
    ()=>PitchDeck
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
/**
 * THE 4-MINUTE IDEA PITCH — a full-screen, keyboard-driven deck, structured
 * after the user's reference deck (upload/Voice-Agent-Pitch (1).html):
 *   IDEA → why it's needed → what the agent can do → LIVE DEMO chapter →
 *   recorded call → interactive app → the technical part (how it works,
 *   open source, timeline, business) → the ask.
 * Same billposter chrome (fonts, poster shadows, framer-motion animations),
 * recolored through the .ps-scope PlayStation palette. Arrow keys / space to
 * navigate, F = fullscreen, a 4:00 pacing timer runs top-right.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-client] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bot$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bot.js [app-client] (ecmascript) <export default as Bot>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$check$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarCheck2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-check-2.js [app-client] (ecmascript) <export default as CalendarCheck2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarPlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-plus.js [app-client] (ecmascript) <export default as CalendarPlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/database.js [app-client] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-spreadsheet.js [app-client] (ecmascript) <export default as FileSpreadsheet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$handshake$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Handshake$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/handshake.js [app-client] (ecmascript) <export default as Handshake>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$headset$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Headset$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/headset.js [app-client] (ecmascript) <export default as Headset>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$inbox$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Inbox$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/inbox.js [app-client] (ecmascript) <export default as Inbox>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layers.js [app-client] (ecmascript) <export default as Layers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mail.js [app-client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/maximize.js [app-client] (ecmascript) <export default as Maximize>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquareText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square-text.js [app-client] (ecmascript) <export default as MessageSquareText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mic$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mic.js [app-client] (ecmascript) <export default as Mic>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2d$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MonitorPlay$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/monitor-play.js [app-client] (ecmascript) <export default as MonitorPlay>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$notebook$2d$pen$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__NotebookPen$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/notebook-pen.js [app-client] (ecmascript) <export default as NotebookPen>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/phone.js [app-client] (ecmascript) <export default as Phone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/play.js [app-client] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$puzzle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Puzzle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/puzzle.js [app-client] (ecmascript) <export default as Puzzle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$radio$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Radio$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/radio.js [app-client] (ecmascript) <export default as Radio>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rocket$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Rocket$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rocket.js [app-client] (ecmascript) <export default as Rocket>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/send.js [app-client] (ecmascript) <export default as Send>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sheet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sheet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sheet.js [app-client] (ecmascript) <export default as Sheet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Store$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/store.js [app-client] (ecmascript) <export default as Store>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$timer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Timer$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/timer.js [app-client] (ecmascript) <export default as Timer>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wallet.js [app-client] (ecmascript) <export default as Wallet>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wrench.js [app-client] (ecmascript) <export default as Wrench>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$workflow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Workflow$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/workflow.js [app-client] (ecmascript) <export default as Workflow>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$pitch$2f$ConversationSlide$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/pitch/ConversationSlide.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$pitch$2f$DemoApp$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/pitch/DemoApp.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
const TARGET_SECONDS = 240; // 4:00 pitch budget
const SLIDE_COUNT = 12;
/* ============================== slide 1 · title ============================== */ function TitleSlide({ onNext }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex h-full flex-col items-center justify-center overflow-hidden px-6 pb-14 text-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "stg-display mt-2 text-[11vw] uppercase leading-[0.92] text-[color:var(--stg-ink)] sm:text-6xl md:text-7xl lg:text-[86px]",
                children: [
                    'AI Powered',
                    'Voice Agent'
                ].map((line, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].span, {
                        className: "block",
                        initial: {
                            opacity: 0,
                            y: 26
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.15 + i * 0.14,
                            duration: 0.5,
                            ease: [
                                0.16,
                                1,
                                0.3,
                                1
                            ]
                        },
                        children: i === 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-[color:var(--stg-yellow-deep)]",
                            children: line
                        }, void 0, false, {
                            fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                            lineNumber: 45,
                            columnNumber: 24
                        }, this) : line
                    }, line, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 44,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                initial: {
                    opacity: 0
                },
                animate: {
                    opacity: 1
                },
                transition: {
                    delay: 0.55
                },
                className: "mt-5 max-w-xl text-sm leading-relaxed text-[color:var(--stg-ink)]/75 sm:text-base",
                children: "Your AI employee that answers every call, books every appointment and never sleeps."
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    y: 12
                },
                animate: {
                    opacity: 1,
                    y: 0
                },
                transition: {
                    delay: 0.75
                },
                className: "mt-7 flex flex-wrap items-center justify-center gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onNext,
                        className: "stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-6 text-[11px] text-white shadow-[5px_5px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                className: "h-4 w-4",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 54,
                                columnNumber: 11
                            }, this),
                            " START THE PITCH"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/demo",
                        className: "stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)]/40 bg-white px-6 text-[11px] text-[color:var(--stg-ink)] transition-colors hover:border-[color:var(--stg-ink)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bot$3e$__["Bot"], {
                                className: "h-4 w-4",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this),
                            " OPEN THE LIVE DEMO"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0
                },
                animate: {
                    opacity: 1
                },
                transition: {
                    delay: 1
                },
                className: "mt-6 flex flex-wrap items-center justify-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stg-label rounded-full border border-[color:var(--stg-ink)]/30 bg-white px-3 py-1.5 text-[8px] text-[color:var(--stg-ink)]/60",
                        children: "LIVE DEMO INSIDE — A REAL RECORDED CALL"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stg-label rounded-full border border-[color:var(--stg-ink)]/30 bg-white px-3 py-1.5 text-[8px] text-[color:var(--stg-ink)]/60",
                        children: "NAVIGATE: ← → · FULLSCREEN: F"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "pointer-events-none absolute right-[8%] top-[14%] hidden md:block",
                animate: {
                    y: [
                        0,
                        -10,
                        0
                    ],
                    rotate: [
                        0,
                        2,
                        0
                    ]
                },
                transition: {
                    repeat: Infinity,
                    duration: 4.5,
                    ease: 'easeInOut'
                },
                "aria-hidden": true,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid h-20 w-20 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-white p-1 shadow-[6px_6px_0_0_var(--stg-yellow)]",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: "avatars/ai-layla.jpg",
                        alt: "",
                        className: "h-full w-full rounded-full object-cover object-top"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 67,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                    lineNumber: 66,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                className: "stg-label absolute bottom-4 text-[9px] text-[color:var(--stg-ink)]/40",
                initial: {
                    opacity: 0
                },
                animate: {
                    opacity: 1
                },
                transition: {
                    delay: 1.2
                },
                children: "← → TO NAVIGATE · F FOR FULLSCREEN"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
_c = TitleSlide;
/* ============================= slide 2 · problem ============================= */ const PAINS = [
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"],
        title: 'The 6 PM black hole',
        body: 'Calls after hours hit voicemail. The customer doesn’t leave a message — they dial the next clinic on the list.'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$handshake$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Handshake$3e$__["Handshake"],
        title: 'The reception bottleneck',
        body: 'One person, five channels: phone, walk-ins, email, WhatsApp, Telegram. Routine questions eat the whole day.'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$puzzle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Puzzle$3e$__["Puzzle"],
        title: 'Generic bots, locked data',
        body: 'Today’s voice-bot platforms are per-minute, one-size-fits-all, and trap call data with no dashboard to see what is happening.'
    }
];
function ProblemSlide() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full flex-col justify-center px-6 py-8 sm:px-12 lg:px-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label text-[10px] text-[color:var(--stg-ink)]/55",
                children: "01 · THE PROBLEM"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "stg-display mt-2 max-w-3xl text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl",
                children: [
                    "Every missed call is a ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[color:var(--stg-yellow-deep)]",
                        children: "customer walking away."
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 90,
                        columnNumber: 32
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-8 grid gap-4 md:grid-cols-3",
                children: PAINS.map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 24
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.15 + i * 0.16,
                            duration: 0.4
                        },
                        className: "rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-5 shadow-[6px_6px_0_0_var(--stg-ink)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-white",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(p.icon, {
                                    className: "h-5 w-5",
                                    "aria-hidden": true
                                }, void 0, false, {
                                    fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                    lineNumber: 96,
                                    columnNumber: 143
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 96,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "stg-display mt-3 text-lg uppercase leading-tight",
                                children: p.title
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 97,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-[13px] leading-relaxed text-[color:var(--stg-ink)]/75",
                                children: p.body
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 98,
                                columnNumber: 13
                            }, this)
                        ]
                    }, p.title, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 94,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                initial: {
                    opacity: 0
                },
                animate: {
                    opacity: 1
                },
                transition: {
                    delay: 0.8
                },
                className: "stg-label mt-7 text-[10px] text-[color:var(--stg-ink)]/60",
                children: "★ STAFF CANNOT SCALE TO 24/7. SOFTWARE CAN."
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 87,
        columnNumber: 5
    }, this);
}
_c1 = ProblemSlide;
/* ============================ slide 3 · the solution ========================= */ const SOLUTION_CARDS = [
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mic$3e$__["Mic"],
        title: 'Talks & listens',
        body: 'Natural voice calls on phone and web, responding in under 800 ms so it feels human.'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__["Wrench"],
        title: 'Acts, not just answers',
        body: 'Checks availability, books calendar events with invites, sends emails, updates Google Sheets.'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$inbox$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Inbox$3e$__["Inbox"],
        title: 'Everywhere customers are',
        body: 'Phone, web voice, WhatsApp, Telegram and social inboxes — one brain across all of them.'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"],
        title: 'Your data, your dashboard',
        body: 'Calls, transcripts, bookings, outcomes and costs in one live view.'
    }
];
function SolutionSlide() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full flex-col justify-center px-6 py-8 sm:px-12 lg:px-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label text-[10px] text-[color:var(--stg-ink)]/55",
                children: "02 · THE SOLUTION"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 121,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "stg-display mt-2 max-w-4xl text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl",
                children: [
                    "One AI employee. Every channel. ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[color:var(--stg-yellow-deep)]",
                        children: "Your rules."
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 123,
                        columnNumber: 41
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 122,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                initial: {
                    opacity: 0
                },
                animate: {
                    opacity: 1
                },
                transition: {
                    delay: 0.3
                },
                className: "mt-3 max-w-2xl text-[13px] leading-relaxed text-[color:var(--stg-ink)]/70 sm:text-sm",
                children: "A configurable platform that deploys a voice + chat agent per business — built on open source, hosted for you, visible in one dashboard."
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 125,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4",
                children: SOLUTION_CARDS.map((c, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 22
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.15 + i * 0.13,
                            duration: 0.4
                        },
                        className: "rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-4 shadow-[5px_5px_0_0_var(--stg-ink)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-white",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(c.icon, {
                                    className: "h-5 w-5",
                                    "aria-hidden": true
                                }, void 0, false, {
                                    fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                    lineNumber: 133,
                                    columnNumber: 143
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 133,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "stg-display mt-3 text-base uppercase leading-tight",
                                children: c.title
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--stg-ink)]/75",
                                children: c.body
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 135,
                                columnNumber: 13
                            }, this)
                        ]
                    }, c.title, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 131,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 129,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    y: 14
                },
                animate: {
                    opacity: 1,
                    y: 0
                },
                transition: {
                    delay: 0.85
                },
                className: "mt-7 flex flex-wrap gap-2.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stg-label rounded-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] px-3.5 py-2 text-[9px] text-white",
                        children: "ONE CORE CODEBASE"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 140,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stg-label rounded-full border-2 border-[color:var(--stg-ink)]/40 bg-white px-3.5 py-2 text-[9px] text-[color:var(--stg-ink)]",
                        children: "PER-CLIENT PROMPT"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 141,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stg-label rounded-full border-2 border-[color:var(--stg-ink)]/40 bg-white px-3.5 py-2 text-[9px] text-[color:var(--stg-ink)]",
                        children: "PER-CLIENT VOICE"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 142,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stg-label rounded-full border-2 border-[color:var(--stg-ink)]/40 bg-white px-3.5 py-2 text-[9px] text-[color:var(--stg-ink)]",
                        children: "PER-CLIENT TOOLS"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 143,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 139,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 120,
        columnNumber: 5
    }, this);
}
_c2 = SolutionSlide;
/* ========================= slide 4 · one agent, many hats ==================== */ const USECASES = [
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$headset$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Headset$3e$__["Headset"],
        title: 'Receptionist',
        body: 'Answers every call on ring 1, greets by name, never puts anyone on hold.',
        tools: 'calendar · email · FAQ'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$check$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarCheck2$3e$__["CalendarCheck2"],
        title: 'Appointment scheduler',
        body: 'Offers real openings, books with the right doctor, sends invites + reminders, reschedules on request.',
        tools: 'create_event · reminders'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rocket$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Rocket$3e$__["Rocket"],
        title: 'Sales rep',
        body: 'Qualifies inbound leads, answers product questions, books demos, logs everything to the sheet.',
        tools: 'CRM · sheets · demo-booking'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquareText$3e$__["MessageSquareText"],
        title: 'Customer care',
        body: 'Handles order status and common issues on WhatsApp and web chat — escalates the tricky 5% to humans.',
        tools: 'Chatwoot inbox · webhooks'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$notebook$2d$pen$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__NotebookPen$3e$__["NotebookPen"],
        title: 'FAQ support',
        body: 'Prices, hours, insurance, directions — grounded answers in the business’s own documents.',
        tools: 'knowledge base · FAQ'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$spreadsheet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileSpreadsheet$3e$__["FileSpreadsheet"],
        title: 'Info collector',
        body: 'Captures names, contacts and requirements conversationally, then writes clean rows to Google Sheets.',
        tools: 'update_sheet_row( )'
    }
];
function UseCasesSlide() {
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [auto, setAuto] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UseCasesSlide.useEffect": ()=>{
            if (!auto) return;
            const id = setInterval({
                "UseCasesSlide.useEffect.id": ()=>setOpen({
                        "UseCasesSlide.useEffect.id": (o)=>(o + 1) % USECASES.length
                    }["UseCasesSlide.useEffect.id"])
            }["UseCasesSlide.useEffect.id"], 3200);
            return ({
                "UseCasesSlide.useEffect": ()=>clearInterval(id)
            })["UseCasesSlide.useEffect"];
        }
    }["UseCasesSlide.useEffect"], [
        auto
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label text-[10px] text-[color:var(--stg-ink)]/55",
                children: [
                    "03 · ONE AGENT, MANY HATS ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "ml-2 hidden text-[color:var(--stg-ink)]/40 sm:inline",
                        children: "(CLICK A CARD)"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 170,
                        columnNumber: 101
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 170,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl",
                children: [
                    "Hire it for any ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[color:var(--stg-yellow-deep)]",
                        children: "front-desk job."
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 172,
                        columnNumber: 25
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 171,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3",
                onClick: ()=>setAuto(false),
                children: USECASES.map((u, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].button, {
                        onClick: ()=>setOpen(i),
                        "aria-pressed": open === i,
                        initial: {
                            opacity: 0,
                            y: 16
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.08 + i * 0.07
                        },
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border-2 p-3 text-left transition-all duration-200 sm:p-4', open === i ? 'border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)] shadow-[5px_5px_0_0_var(--stg-yellow)]' : 'border-[color:var(--stg-ink)]/30 bg-white text-[color:var(--stg-ink)] hover:border-[color:var(--stg-ink)]'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(u.icon, {
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-5 w-5', open === i && 'text-[color:var(--ps-link-dark)]'),
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 180,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "stg-display mt-1.5 text-sm uppercase leading-tight sm:text-base",
                                children: u.title
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 181,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                children: open === i && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        opacity: 0,
                                        height: 0
                                    },
                                    animate: {
                                        opacity: 1,
                                        height: 'auto'
                                    },
                                    exit: {
                                        opacity: 0,
                                        height: 0
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-1.5 text-[11px] leading-snug text-[color:var(--stg-cream)]/85",
                                            children: u.body
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                            lineNumber: 185,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "stg-label mt-1.5 text-[7px] text-[color:var(--ps-link-dark)]",
                                            children: u.tools.toUpperCase()
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                            lineNumber: 186,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                    lineNumber: 184,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 182,
                                columnNumber: 13
                            }, this)
                        ]
                    }, u.title, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 176,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 174,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                initial: {
                    opacity: 0
                },
                animate: {
                    opacity: 1
                },
                transition: {
                    delay: 0.8
                },
                className: "stg-label mt-5 text-[9px] text-[color:var(--stg-ink)]/55",
                children: "SAME PLATFORM, DIFFERENT PROMPT + TOOLS PER BUSINESS — DENTIST, SALON, CLINIC, PLUMBER, AGENCY."
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 193,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 169,
        columnNumber: 5
    }, this);
}
_s(UseCasesSlide, "e6oQlboCcoDYgpJ56XKUNHXJxfQ=");
_c3 = UseCasesSlide;
/* ========================= slide 5 · chapter — live demo ===================== */ function ChapterSlide() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center",
        "data-testid": "chapter-slide",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-[color:var(--stg-yellow)]",
                "aria-hidden": true
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 206,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                        initial: {
                            opacity: 0,
                            y: 14
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.05
                        },
                        className: "stg-label text-[11px] tracking-[0.3em] text-white/80",
                        children: "CHAPTER 02 · LIVE DEMO"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].h2, {
                        initial: {
                            opacity: 0,
                            y: 26
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.18,
                            duration: 0.5,
                            ease: [
                                0.16,
                                1,
                                0.3,
                                1
                            ]
                        },
                        className: "stg-display mt-4 text-6xl uppercase leading-[0.92] text-white sm:text-8xl",
                        children: [
                            "See it. ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[color:var(--stg-ink)]",
                                children: "Hear it."
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 213,
                                columnNumber: 19
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 211,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                        initial: {
                            opacity: 0
                        },
                        animate: {
                            opacity: 1
                        },
                        transition: {
                            delay: 0.5
                        },
                        className: "mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base",
                        children: "A real appointment call, recorded unedited — handled end-to-end by the agent. Then the app itself, clickable."
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 215,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 12
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.7
                        },
                        className: "stg-label mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[color:var(--stg-ink)] bg-white px-5 py-2.5 text-[10px] text-[color:var(--stg-ink)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$monitor$2d$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MonitorPlay$3e$__["MonitorPlay"], {
                                className: "h-4 w-4",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 221,
                                columnNumber: 11
                            }, this),
                            " HEADPHONES RECOMMENDED — PRESS PLAY ON THE NEXT SLIDE"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 219,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 207,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 204,
        columnNumber: 5
    }, this);
}
_c4 = ChapterSlide;
/* ========================= slide 8 · how it works (tech) ===================== */ function PipelineSlide() {
    const channels = [
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"],
            label: 'Phone (SIP)'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$radio$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Radio$3e$__["Radio"],
            label: 'Web voice'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquareText$3e$__["MessageSquareText"],
            label: 'WhatsApp'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"],
            label: 'Telegram'
        }
    ];
    const brain = [
        'LLM + tool calling',
        'Conversation memory',
        'Your business prompt',
        'Responds in <800 ms'
    ];
    const tools = [
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarPlus$3e$__["CalendarPlus"],
            label: 'Google Calendar'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"],
            label: 'Gmail'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sheet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sheet$3e$__["Sheet"],
            label: 'Google Sheets'
        },
        {
            icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"],
            label: 'CRM · Webhooks'
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-16",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label text-[10px] text-[color:var(--stg-ink)]/55",
                children: "04 · UNDER THE HOOD"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 242,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl",
                children: [
                    "Three layers. ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[color:var(--stg-yellow-deep)]",
                        children: "Swap any part, keep the rest."
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 244,
                        columnNumber: 23
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 243,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 18
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.12
                        },
                        className: "rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-3.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "stg-label flex items-center gap-1.5 text-[8px] text-[color:var(--stg-ink)]/55",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mic$3e$__["Mic"], {
                                        className: "h-3 w-3",
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 251,
                                        columnNumber: 104
                                    }, this),
                                    " CHANNELS"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 251,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 space-y-1.5",
                                children: channels.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 rounded-lg border border-[color:var(--stg-ink)]/20 bg-[color:var(--stg-cream-2)] px-2.5 py-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(c.icon, {
                                                className: "h-3.5 w-3.5 text-[color:var(--stg-ink)]/70",
                                                "aria-hidden": true
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                                lineNumber: 255,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[12px] font-medium",
                                                children: c.label
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                                lineNumber: 255,
                                                columnNumber: 94
                                            }, this)
                                        ]
                                    }, c.label, true, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 254,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 252,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 249,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ArrowCol, {
                        delay: 0.3
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 260,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 18
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.4
                        },
                        className: "rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] p-3.5 text-[color:var(--stg-cream)] shadow-[5px_5px_0_0_var(--stg-yellow)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "stg-label flex items-center gap-1.5 text-[8px] text-white/60",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$workflow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Workflow$3e$__["Workflow"], {
                                        className: "h-3 w-3",
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 264,
                                        columnNumber: 87
                                    }, this),
                                    " AGENT BRAIN"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 264,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 space-y-1.5",
                                children: brain.map((b, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-lg px-2.5 py-1.5 text-[12px] font-medium', i === 3 ? 'bg-[color:var(--stg-yellow)] text-white' : 'border border-white/15 bg-white/5'),
                                        children: b
                                    }, b, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 267,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 265,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 262,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ArrowCol, {
                        delay: 0.55
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 273,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 18
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.62
                        },
                        className: "rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-3.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "stg-label flex items-center gap-1.5 text-[8px] text-[color:var(--stg-ink)]/55",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wrench$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wrench$3e$__["Wrench"], {
                                        className: "h-3 w-3",
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 277,
                                        columnNumber: 104
                                    }, this),
                                    " TOOLS"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 277,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 space-y-1.5",
                                children: tools.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 rounded-lg border border-[color:var(--stg-ink)]/20 bg-[color:var(--stg-cream-2)] px-2.5 py-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(c.icon, {
                                                className: "h-3.5 w-3.5 text-[color:var(--stg-ink)]/70",
                                                "aria-hidden": true
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                                lineNumber: 281,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[12px] font-medium",
                                                children: c.label
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                                lineNumber: 281,
                                                columnNumber: 94
                                            }, this)
                                        ]
                                    }, c.label, true, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 280,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 278,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 275,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 247,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(VoiceLoopStrip, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 289,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 241,
        columnNumber: 5
    }, this);
}
_c5 = PipelineSlide;
function ArrowCol({ delay }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0
        },
        animate: {
            opacity: 1
        },
        transition: {
            delay
        },
        className: "hidden items-center justify-center lg:flex",
        "aria-hidden": true,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative h-0.5 w-8 overflow-hidden bg-[color:var(--stg-ink)]/15",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "stg-flow-dot absolute top-0 h-full w-2 bg-[color:var(--stg-yellow-deep)]"
                }, void 0, false, {
                    fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                    lineNumber: 298,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 297,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "stg-label ml-1 text-[8px] text-[color:var(--stg-ink)]/40",
                children: "→"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 300,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 296,
        columnNumber: 5
    }, this);
}
_c6 = ArrowCol;
/* ------------------------- the voice loop (slide 8 band) ---------------------- */ const VOICE_LOOP = [
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mic$3e$__["Mic"],
        label: 'Caller speaks',
        tone: 'light'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__["Layers"],
        label: 'STT · faster-whisper',
        tone: 'blue'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$workflow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Workflow$3e$__["Workflow"],
        label: 'LLM brain + tools',
        tone: 'ink'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$radio$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Radio$3e$__["Radio"],
        label: 'TTS · CosyVoice',
        tone: 'blue'
    },
    {
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"],
        label: 'Caller hears',
        tone: 'light'
    }
];
function LoopArrow({ delay }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0
        },
        animate: {
            opacity: 1
        },
        transition: {
            delay
        },
        className: "hidden items-center justify-center sm:flex",
        "aria-hidden": true,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative h-0.5 w-5 overflow-hidden bg-[color:var(--stg-ink)]/15",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "stg-flow-dot absolute top-0 h-full w-1.5 bg-[color:var(--stg-yellow-deep)]"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 319,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/pitch/PitchDeck.tsx",
            lineNumber: 318,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 317,
        columnNumber: 5
    }, this);
}
_c7 = LoopArrow;
/**
 * Every turn of every call, end to end: caller speaks → STT (faster-whisper)
 * → LLM brain + tools → TTS (CosyVoice) → caller hears. Self-hosted STT/TTS,
 * swappable — the point the reference deck's technical slide needed to land.
 */ function VoiceLoopStrip() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            y: 14
        },
        animate: {
            opacity: 1,
            y: 0
        },
        transition: {
            delay: 0.85
        },
        className: "mt-4 rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] p-3",
        "data-testid": "voice-loop",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-baseline justify-between gap-x-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "stg-label text-[8px] text-[color:var(--stg-ink)]/55",
                        children: "EVERY TURN OF EVERY CALL — THE VOICE LOOP"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 335,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "stg-label text-[8px] font-semibold text-[color:var(--stg-yellow-deep)]",
                        children: "SELF-HOSTED STT / TTS · SWAPPABLE"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 336,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 334,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2.5 flex items-center justify-between gap-1.5",
                children: VOICE_LOOP.map((step, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            i > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LoopArrow, {
                                delay: 0.95 + i * 0.08
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 341,
                                columnNumber: 23
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                initial: {
                                    opacity: 0,
                                    y: 10
                                },
                                animate: {
                                    opacity: 1,
                                    y: 0
                                },
                                transition: {
                                    delay: 0.9 + i * 0.08
                                },
                                className: "flex min-w-0 flex-col items-center gap-1.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('grid h-10 w-10 place-items-center rounded-lg border-2 border-[color:var(--stg-ink)] sm:h-11 sm:w-11', step.tone === 'blue' && 'bg-[color:var(--stg-yellow)] text-white', step.tone === 'ink' && 'bg-[color:var(--stg-ink)] text-[color:var(--stg-cream)]', step.tone === 'light' && 'bg-white text-[color:var(--stg-ink)]'),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(step.icon, {
                                            className: "h-5 w-5",
                                            "aria-hidden": true
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                            lineNumber: 350,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 344,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "stg-label max-w-[72px] text-center text-[7.5px] leading-tight text-[color:var(--stg-ink)]/70 sm:max-w-none",
                                        children: step.label
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 352,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 342,
                                columnNumber: 13
                            }, this)
                        ]
                    }, step.label, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 340,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 338,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 332,
        columnNumber: 5
    }, this);
}
_c8 = VoiceLoopStrip;
/* ========================= slide 9 · built from open source ================== */ const STACK = [
    {
        layer: 'Voice runtime',
        picks: 'LiveKit Agents · Pipecat',
        note: 'WebRTC + SIP calls, interruptions, turn detection',
        license: 'Apache 2.0 / BSD'
    },
    {
        layer: 'Ears & mouth',
        picks: 'faster-whisper · CosyVoice · Fish · KittenTTS',
        note: 'self-hosted STT/TTS, swappable behind one interface',
        license: 'MIT / Apache'
    },
    {
        layer: 'Brain',
        picks: 'Any LLM via SDK tool calling',
        note: 'OpenAI, Anthropic, Gemini — no lock-in',
        license: 'API'
    },
    {
        layer: 'Tools & glue',
        picks: 'n8n · Activepieces · Composio',
        note: 'Calendar, Gmail, Sheets with OAuth handled',
        license: 'MIT / fair-code'
    },
    {
        layer: 'Omnichannel inbox',
        picks: 'Chatwoot (+ official WhatsApp API)',
        note: 'no unofficial gateways — bans are real',
        license: 'MIT'
    },
    {
        layer: 'Data & dashboard',
        picks: 'Postgres + Metabase / Grafana',
        note: 'calls, transcripts, outcomes, costs',
        license: 'MIT / AGPL'
    }
];
function StackSlide() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label text-[10px] text-[color:var(--stg-ink)]/55",
                children: "05 · BUILT FROM OPEN SOURCE — 5 LAYERS, ALL SWAPPABLE"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 375,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl",
                children: [
                    "Every layer is free to run. ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[color:var(--stg-yellow-deep)]",
                        children: "We sell the glue."
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 377,
                        columnNumber: 37
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 376,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-5 space-y-1.5",
                children: STACK.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            x: -20
                        },
                        animate: {
                            opacity: 1,
                            x: 0
                        },
                        transition: {
                            delay: 0.1 + i * 0.08
                        },
                        className: "grid grid-cols-[92px_1fr] items-center gap-3 rounded-lg border-2 border-[color:var(--stg-ink)]/30 bg-white p-2.5 sm:grid-cols-[130px_1fr_1fr_88px]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "stg-label text-[8px] text-[color:var(--stg-ink)]/60",
                                children: s.layer.toUpperCase()
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 383,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[12.5px] font-semibold leading-tight text-[color:var(--stg-ink)]",
                                children: s.picks
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 384,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hidden text-[11px] leading-snug text-[color:var(--stg-ink)]/60 sm:block",
                                children: s.note
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 385,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hidden justify-self-end rounded-full border border-[color:var(--stg-ink)]/30 px-2 py-0.5 text-[8px] font-semibold text-[color:var(--stg-ink)]/70 sm:block",
                                children: s.license
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 386,
                                columnNumber: 13
                            }, this)
                        ]
                    }, s.layer, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 381,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 379,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 374,
        columnNumber: 5
    }, this);
}
_c9 = StackSlide;
/* ========================= slide 10 · build plan & timeline ================== */ const MILESTONES = [
    {
        label: 'Working prototype',
        span: 'W1–2',
        w: 14,
        note: 'one agent · self-hosted TTS · 1–2 tools'
    },
    {
        label: 'Client-ready MVP',
        span: 'W4–8',
        w: 30,
        note: 'phone number · calendar/email/sheets · dashboard'
    },
    {
        label: 'Reusable platform',
        span: 'M3–5',
        w: 52,
        note: 'tenant configs · templates · logging · alerts'
    },
    {
        label: 'New client after',
        span: 'M5+',
        w: 12,
        note: 'days to 2 weeks per onboard'
    }
];
const BUILD_ORDER = [
    'Define tools as functions',
    'Prove on Telegram (text)',
    'Add voice, same brain',
    'WhatsApp as thin adapter',
    'Postgres + dashboard',
    'Pilot with 1–2 businesses'
];
function TimelineSlide() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label text-[10px] text-[color:var(--stg-ink)]/55",
                children: "06 · BUILD PLAN & TIMELINE"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 408,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl",
                children: [
                    "One developer. AI-assisted. ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[color:var(--stg-yellow-deep)]",
                        children: "A realistic clock."
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 410,
                        columnNumber: 37
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 409,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 space-y-3",
                children: MILESTONES.map((m, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap items-baseline justify-between gap-x-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[13px] font-semibold text-[color:var(--stg-ink)] sm:text-sm",
                                        children: m.label
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 416,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "stg-label text-[9px] text-[color:var(--stg-yellow-deep)]",
                                        children: m.span
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 417,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 415,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 h-6 overflow-hidden rounded-md border-2 border-[color:var(--stg-ink)]/25 bg-white",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        width: 0
                                    },
                                    animate: {
                                        width: `${m.w}%`
                                    },
                                    transition: {
                                        delay: 0.15 + i * 0.16,
                                        duration: 0.55,
                                        ease: [
                                            0.16,
                                            1,
                                            0.3,
                                            1
                                        ]
                                    },
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex h-full items-center px-2', i === 2 ? 'bg-[color:var(--stg-ink)]' : 'bg-[color:var(--stg-yellow)]'),
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('stg-label whitespace-nowrap text-[7px]', i === 2 ? 'text-white/80' : 'text-white'),
                                        children: m.note.toUpperCase()
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 422,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                    lineNumber: 420,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 419,
                                columnNumber: 13
                            }, this)
                        ]
                    }, m.label, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 414,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 412,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    y: 12
                },
                animate: {
                    opacity: 1,
                    y: 0
                },
                transition: {
                    delay: 0.9
                },
                className: "mt-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "stg-label text-[8px] text-[color:var(--stg-ink)]/55",
                        children: "THE BUILD ORDER"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 429,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1.5 flex flex-wrap gap-1.5",
                        children: BUILD_ORDER.map((b, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "stg-label inline-flex items-center gap-1.5 rounded-full border border-[color:var(--stg-ink)]/35 bg-white px-2.5 py-1.5 text-[8px] text-[color:var(--stg-ink)]/80",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "grid h-4 w-4 place-items-center rounded-full bg-[color:var(--stg-yellow)] text-[7px] font-bold text-white",
                                        children: i + 1
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 433,
                                        columnNumber: 15
                                    }, this),
                                    b.toUpperCase()
                                ]
                            }, b, true, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 432,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 430,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 428,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                initial: {
                    opacity: 0
                },
                animate: {
                    opacity: 1
                },
                transition: {
                    delay: 1.1
                },
                className: "stg-label mt-4 text-[8px] text-[color:var(--stg-ink)]/50",
                children: "GUARDRAILS: <800 MS LATENCY BUDGET · CONFIRM-BEFORE-WRITE · PER-CLIENT OAUTH · RECORDING CONSENT"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 439,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 407,
        columnNumber: 5
    }, this);
}
_c10 = TimelineSlide;
/* ========================= slide 11 · business & impact ====================== */ function BusinessSlide() {
    const money = [
        'Build fee per client + monthly hosting & maintenance (recurring)',
        'Self-hosted voice → per-minute cost collapses vs hosted platforms',
        'One codebase → every new client is cheaper to onboard than the last'
    ];
    const clients = [
        'Fewer missed calls — every call answered 24/7',
        'Faster responses and automated booking + follow-up',
        'Lower staffing cost for routine inquiries'
    ];
    const measure = [
        'answer rate',
        'booking conversion',
        'avg response time',
        'cost per call',
        'staff hours saved'
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full flex-col justify-center px-6 py-6 sm:px-12 lg:px-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label text-[10px] text-[color:var(--stg-ink)]/55",
                children: "07 · WHY THIS IS A BUSINESS"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 462,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "stg-display mt-2 text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-4xl",
                children: [
                    "Custom-software pricing. ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[color:var(--stg-yellow-deep)]",
                        children: "Open-source costs."
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 464,
                        columnNumber: 34
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 463,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-7 grid gap-4 md:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 20
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.15
                        },
                        className: "rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-4 shadow-[5px_5px_0_0_var(--stg-ink)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "stg-label flex items-center gap-2 text-[9px] text-[color:var(--stg-ink)]/60",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wallet$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wallet$3e$__["Wallet"], {
                                        className: "h-3.5 w-3.5",
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 468,
                                        columnNumber: 102
                                    }, this),
                                    " HOW WE MAKE MONEY"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 468,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "mt-2.5 space-y-2",
                                children: money.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "flex gap-2 text-[12px] leading-snug text-[color:var(--stg-ink)]/85",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--stg-yellow)]",
                                                "aria-hidden": true
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                                lineNumber: 470,
                                                columnNumber: 122
                                            }, this),
                                            m
                                        ]
                                    }, m, true, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 470,
                                        columnNumber: 31
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 469,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 467,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 20
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.3
                        },
                        className: "rounded-xl border-2 border-[color:var(--stg-ink)] bg-white p-4 shadow-[5px_5px_0_0_var(--stg-ink)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "stg-label flex items-center gap-2 text-[9px] text-[color:var(--stg-ink)]/60",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$store$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Store$3e$__["Store"], {
                                        className: "h-3.5 w-3.5",
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 474,
                                        columnNumber: 102
                                    }, this),
                                    " WHAT CLIENTS GET"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 474,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "mt-2.5 space-y-2",
                                children: clients.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "flex gap-2 text-[12px] leading-snug text-[color:var(--stg-ink)]/85",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--stg-yellow)]",
                                                "aria-hidden": true
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                                lineNumber: 476,
                                                columnNumber: 124
                                            }, this),
                                            m
                                        ]
                                    }, m, true, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 476,
                                        columnNumber: 33
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 475,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 473,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 20
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.45
                        },
                        className: "rounded-xl border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] p-4 text-[color:var(--stg-cream)] shadow-[5px_5px_0_0_var(--stg-yellow)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "stg-label flex items-center gap-2 text-[9px] text-white/60",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$timer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Timer$3e$__["Timer"], {
                                        className: "h-3.5 w-3.5",
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 480,
                                        columnNumber: 85
                                    }, this),
                                    " WHAT WE MEASURE & REPORT"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 480,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3 flex flex-wrap gap-1.5",
                                children: measure.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "stg-label rounded-full border border-white/20 bg-white/5 px-2.5 py-1.5 text-[8px] text-white/85",
                                        children: m.toUpperCase()
                                    }, m, false, {
                                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                        lineNumber: 483,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 481,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-3 text-[11px] leading-snug text-white/70",
                                children: "Every client sees the numbers — that’s the retention engine."
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 486,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 479,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 466,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 461,
        columnNumber: 5
    }, this);
}
_c11 = BusinessSlide;
/* ============================== slide 12 · close ============================= */ function CloseSlide() {
    const chips = [
        'Works 24/7',
        'Books while you sleep',
        'Your data, your dashboard',
        'Open-source core'
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full flex-col items-center justify-center px-6 text-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    scale: 0.6,
                    opacity: 0
                },
                animate: {
                    scale: 1,
                    opacity: 1
                },
                transition: {
                    type: 'spring',
                    stiffness: 220,
                    damping: 16
                },
                className: "grid h-16 w-16 place-items-center rounded-full border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-white shadow-[5px_5px_0_0_var(--stg-ink)]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"], {
                    className: "h-8 w-8",
                    "aria-hidden": true
                }, void 0, false, {
                    fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                    lineNumber: 501,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 499,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "stg-display mt-5 max-w-3xl text-3xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl",
                children: [
                    "Never miss ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[color:var(--stg-yellow-deep)]",
                        children: "another call."
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 504,
                        columnNumber: 20
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 503,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 flex max-w-2xl flex-wrap justify-center gap-2",
                children: chips.map((c, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].span, {
                        initial: {
                            opacity: 0,
                            y: 10
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            delay: 0.3 + i * 0.1
                        },
                        className: "rounded-full border-2 border-[color:var(--stg-ink)] bg-white px-3.5 py-2 text-[11px] font-medium",
                        children: c
                    }, c, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 508,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 506,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].p, {
                initial: {
                    opacity: 0
                },
                animate: {
                    opacity: 1
                },
                transition: {
                    delay: 0.7
                },
                className: "stg-label mt-6 text-[10px] text-[color:var(--stg-ink)]/70",
                children: "★ LET’S PILOT IT WITH ONE BUSINESS THIS MONTH."
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 512,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    y: 12
                },
                animate: {
                    opacity: 1,
                    y: 0
                },
                transition: {
                    delay: 0.9
                },
                className: "mt-7 flex flex-wrap justify-center gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/demo",
                        className: "stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] px-6 text-[11px] text-white shadow-[5px_5px_0_0_var(--stg-ink)] transition-transform hover:-translate-y-0.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                className: "h-4 w-4",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 517,
                                columnNumber: 11
                            }, this),
                            " REPLAY THE LIVE DEMO"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 516,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/create",
                        className: "stg-label inline-flex h-12 items-center gap-2 border-2 border-[color:var(--stg-ink)]/40 bg-white px-6 text-[11px] text-[color:var(--stg-ink)] transition-colors hover:border-[color:var(--stg-ink)]",
                        children: "BUILD A DECK LIKE THIS →"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 519,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 515,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stg-label mt-8 text-[8px] text-[color:var(--stg-ink)]/40",
                children: "≈ 4:00 — THANK YOU · PITCH RUNTIME ≈ 4 MIN"
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 523,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 498,
        columnNumber: 5
    }, this);
}
_c12 = CloseSlide;
/* ============================== slide 7 · demo =============================== */ function DemoSlide() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full flex-col px-4 py-4 sm:px-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-baseline justify-between gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "stg-label text-[10px] text-[color:var(--stg-ink)]/55",
                        children: [
                            "★ TRY THE PRODUCT ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-2 text-[color:var(--stg-ink)]/40",
                                children: "(INTERACTIVE — CLICK “CALL LAYLA”)"
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 534,
                                columnNumber: 95
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 534,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/demo",
                        className: "stg-label text-[9px] text-[color:var(--stg-yellow-deep)] underline-offset-2 hover:underline",
                        children: "OPEN FULLSCREEN →"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 535,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 533,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 min-h-0 flex-1",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$pitch$2f$DemoApp$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DemoApp"], {
                    compact: true
                }, void 0, false, {
                    fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                    lineNumber: 537,
                    columnNumber: 44
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 537,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 532,
        columnNumber: 5
    }, this);
}
_c13 = DemoSlide;
/* ================================= deck shell ================================ */ const variants = {
    enter: (dir)=>({
            opacity: 0,
            x: dir >= 0 ? 60 : -60
        }),
    center: {
        opacity: 1,
        x: 0
    },
    exit: (dir)=>({
            opacity: 0,
            x: dir >= 0 ? -60 : 60
        })
};
function buildSlides(go) {
    return [
        {
            id: 'title',
            label: 'COVER — AI POWERED VOICE AGENT',
            budget: 10,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TitleSlide, {
                onNext: ()=>go(1)
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 552,
                columnNumber: 79
            }, this)
        },
        {
            id: 'problem',
            label: 'THE PROBLEM',
            budget: 20,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProblemSlide, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 553,
                columnNumber: 62
            }, this)
        },
        {
            id: 'solution',
            label: 'THE SOLUTION',
            budget: 25,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SolutionSlide, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 554,
                columnNumber: 64
            }, this)
        },
        {
            id: 'hats',
            label: 'ONE AGENT, MANY HATS',
            budget: 20,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(UseCasesSlide, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 555,
                columnNumber: 68
            }, this)
        },
        {
            id: 'chapter',
            label: 'CHAPTER — LIVE DEMO',
            budget: 5,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChapterSlide, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 556,
                columnNumber: 69
            }, this)
        },
        {
            id: 'live',
            label: '★ DEMO: THE RECORDED CALL',
            budget: 115,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$pitch$2f$ConversationSlide$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ConversationSlide"], {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 557,
                columnNumber: 74
            }, this)
        },
        {
            id: 'demo',
            label: '★ DEMO: TRY THE APP',
            budget: 25,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DemoSlide, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 558,
                columnNumber: 67
            }, this)
        },
        {
            id: 'how',
            label: 'HOW IT WORKS',
            budget: 25,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PipelineSlide, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 559,
                columnNumber: 59
            }, this)
        },
        {
            id: 'stack',
            label: 'BUILT FROM OPEN SOURCE',
            budget: 20,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StackSlide, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 560,
                columnNumber: 71
            }, this)
        },
        {
            id: 'time',
            label: 'BUILD PLAN & TIMELINE',
            budget: 20,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TimelineSlide, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 561,
                columnNumber: 69
            }, this)
        },
        {
            id: 'business',
            label: 'BUSINESS & IMPACT',
            budget: 15,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BusinessSlide, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 562,
                columnNumber: 69
            }, this)
        },
        {
            id: 'close',
            label: 'CLOSING — THE ASK',
            budget: 10,
            node: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CloseSlide, {}, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 563,
                columnNumber: 66
            }, this)
        }
    ];
}
function PitchDeck() {
    _s1();
    const [index, setIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [dir, setDir] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [elapsed, setElapsed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [started, setStarted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const stageRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const reduceMotion = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"])();
    const go = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "PitchDeck.useCallback[go]": (next)=>{
            setIndex({
                "PitchDeck.useCallback[go]": (cur)=>{
                    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, next));
                    if (clamped !== cur) setDir(clamped > cur ? 1 : -1);
                    setStarted(true);
                    return clamped;
                }
            }["PitchDeck.useCallback[go]"]);
        }
    }["PitchDeck.useCallback[go]"], []);
    const slides = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PitchDeck.useMemo[slides]": ()=>buildSlides(go)
    }["PitchDeck.useMemo[slides]"], [
        go
    ]);
    // keyboard
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PitchDeck.useEffect": ()=>{
            const onKey = {
                "PitchDeck.useEffect.onKey": (e)=>{
                    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
                        e.preventDefault();
                        go(index + 1);
                    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                        e.preventDefault();
                        go(index - 1);
                    } else if (e.key === 'Home') go(0);
                    else if (e.key === 'End') go(slides.length - 1);
                    else if (e.key.toLowerCase() === 'f') {
                        try {
                            if (document.fullscreenElement) void document.exitFullscreen();
                            else void stageRef.current?.requestFullscreen();
                        } catch  {}
                    }
                }
            }["PitchDeck.useEffect.onKey"];
            window.addEventListener('keydown', onKey);
            return ({
                "PitchDeck.useEffect": ()=>window.removeEventListener('keydown', onKey)
            })["PitchDeck.useEffect"];
        }
    }["PitchDeck.useEffect"], [
        go,
        index,
        slides.length
    ]);
    // pacing timer
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PitchDeck.useEffect": ()=>{
            if (!started) return;
            const id = setInterval({
                "PitchDeck.useEffect.id": ()=>setElapsed({
                        "PitchDeck.useEffect.id": (s)=>s + 1
                    }["PitchDeck.useEffect.id"])
            }["PitchDeck.useEffect.id"], 1000);
            return ({
                "PitchDeck.useEffect": ()=>clearInterval(id)
            })["PitchDeck.useEffect"];
        }
    }["PitchDeck.useEffect"], [
        started
    ]);
    const over = elapsed > TARGET_SECONDS;
    const mm = Math.floor(elapsed / 60);
    const ss = String(elapsed % 60).padStart(2, '0');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: stageRef,
        className: "ps-scope fixed inset-0 flex flex-col bg-[color:var(--stg-cream)] text-[color:var(--stg-ink)]",
        "data-testid": "pitch-deck",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex h-12 shrink-0 items-center gap-3 border-b-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] px-4 text-[color:var(--stg-cream)] sm:px-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "stg-label text-[9px] text-white/60 transition-colors hover:text-white",
                        "aria-label": "Back to DeckForge home",
                        children: "← DECKFORGE"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 619,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stg-label hidden text-[9px] text-[color:var(--ps-link-dark)] sm:block",
                        children: "IDEA PITCH · AI POWERED VOICE AGENT"
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 620,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('stg-label ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] tabular-nums', over ? 'border-[color:var(--ps-warn)] text-[color:var(--ps-warn)]' : 'border-white/25 text-white/70'),
                        "data-testid": "pitch-timer",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                className: "h-3 w-3",
                                "aria-hidden": true
                            }, void 0, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 622,
                                columnNumber: 11
                            }, this),
                            " ",
                            mm,
                            ":",
                            ss,
                            " / 4:00 ",
                            over ? '· OVER' : ''
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 621,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
                            try {
                                if (document.fullscreenElement) void document.exitFullscreen();
                                else void stageRef.current?.requestFullscreen();
                            } catch  {}
                        },
                        "aria-label": "Toggle fullscreen",
                        className: "grid h-8 w-8 place-items-center text-white/60 transition-colors hover:text-white",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize$3e$__["Maximize"], {
                            className: "h-4 w-4",
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                            lineNumber: 626,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 624,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 618,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "relative min-h-0 flex-1 overflow-hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                    mode: "wait",
                    custom: dir,
                    initial: false,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].section, {
                        custom: dir,
                        variants: reduceMotion ? {
                            enter: {
                                opacity: 0
                            },
                            center: {
                                opacity: 1
                            },
                            exit: {
                                opacity: 0
                            }
                        } : variants,
                        initial: "enter",
                        animate: "center",
                        exit: "exit",
                        transition: {
                            duration: reduceMotion ? 0.12 : 0.34,
                            ease: [
                                0.16,
                                1,
                                0.3,
                                1
                            ]
                        },
                        className: "absolute inset-0 flex flex-col",
                        "data-testid": `pitch-slide-${slides[index].id}`,
                        children: slides[index].node
                    }, slides[index].id, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 633,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                    lineNumber: 632,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 631,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "flex h-14 shrink-0 items-center gap-3 border-t-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-cream-2)] px-4 sm:px-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>go(index - 1),
                        disabled: index === 0,
                        "aria-label": "Previous slide",
                        className: "grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-white transition-all hover:bg-[color:var(--stg-yellow)] hover:text-white disabled:opacity-30",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                            className: "h-4 w-4",
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                            lineNumber: 651,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 649,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-1 flex-wrap items-center gap-1.5",
                        role: "tablist",
                        "aria-label": "Slides",
                        children: slides.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                role: "tab",
                                "aria-selected": i === index,
                                "aria-label": `Slide ${i + 1}: ${s.label}`,
                                onClick: ()=>go(i),
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-2.5 rounded-full transition-all', i === index ? 'w-7 bg-[color:var(--stg-ink)]' : 'w-2.5 bg-[color:var(--stg-ink)]/25 hover:bg-[color:var(--stg-ink)]/50')
                            }, s.id, false, {
                                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                                lineNumber: 655,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 653,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stg-label hidden text-[9px] text-[color:var(--stg-ink)]/60 md:block",
                        children: [
                            slides[index].label,
                            " · ~",
                            slides[index].budget >= 60 ? `${Math.floor(slides[index].budget / 60)}:${String(slides[index].budget % 60).padStart(2, '0')}` : `${slides[index].budget}s`
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 659,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "stg-label text-[9px] tabular-nums text-[color:var(--stg-ink)]/70",
                        children: [
                            String(index + 1).padStart(2, '0'),
                            " / ",
                            slides.length
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 660,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>go(index + 1),
                        disabled: index === slides.length - 1,
                        "aria-label": "Next slide",
                        className: "grid h-10 w-10 place-items-center border-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-yellow)] text-white transition-all hover:-translate-y-0.5 disabled:opacity-30",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                            className: "h-4 w-4",
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                            lineNumber: 663,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                        lineNumber: 661,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/pitch/PitchDeck.tsx",
                lineNumber: 648,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/pitch/PitchDeck.tsx",
        lineNumber: 616,
        columnNumber: 5
    }, this);
}
_s1(PitchDeck, "yQWcSLPhGnSeok/ayE6r0EPNN0w=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$reduced$2d$motion$2f$use$2d$reduced$2d$motion$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducedMotion"]
    ];
});
_c14 = PitchDeck;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11, _c12, _c13, _c14;
__turbopack_context__.k.register(_c, "TitleSlide");
__turbopack_context__.k.register(_c1, "ProblemSlide");
__turbopack_context__.k.register(_c2, "SolutionSlide");
__turbopack_context__.k.register(_c3, "UseCasesSlide");
__turbopack_context__.k.register(_c4, "ChapterSlide");
__turbopack_context__.k.register(_c5, "PipelineSlide");
__turbopack_context__.k.register(_c6, "ArrowCol");
__turbopack_context__.k.register(_c7, "LoopArrow");
__turbopack_context__.k.register(_c8, "VoiceLoopStrip");
__turbopack_context__.k.register(_c9, "StackSlide");
__turbopack_context__.k.register(_c10, "TimelineSlide");
__turbopack_context__.k.register(_c11, "BusinessSlide");
__turbopack_context__.k.register(_c12, "CloseSlide");
__turbopack_context__.k.register(_c13, "DemoSlide");
__turbopack_context__.k.register(_c14, "PitchDeck");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_95f57e61._.js.map