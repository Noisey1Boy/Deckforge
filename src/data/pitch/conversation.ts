/**
 * Conversation timeline for the pitch demo slide.
 *
 * Source: upload/dentist.wav (316 s, "Layla" — the Downtown Dentist voice agent —
 * booking Robert's appointment). The 7-segment highlight cut (silence-aligned,
 * 1.38x time-compression, pitch-preserving) lives at /audio/dentist-booking.mp3
 * (110.76 s). Turn `at` values are seconds into that cut, computed as
 *   cut = segOffset + (realStart - segStart) / 1.38
 * with segment boundaries snapped to detected silences (>= 0.4 s).
 */

export type Speaker = 'layla' | 'robert';

export interface Turn {
  speaker: Speaker;
  /** seconds into the highlight cut where this turn starts */
  at: number;
  text: string;
}

export interface ActionMoment {
  /** seconds into the highlight cut */
  at: number;
  label: string;
  code: string;
}

/** Layla = the voice agent (robot avatar), Robert = the human caller. */
export const TURNS: Turn[] = [
  { speaker: 'layla', at: 0.0, text: 'Hello, this is Layla from Downtown Dentist. How may I help you today?' },
  { speaker: 'robert', at: 2.72, text: 'Hi Layla! I’ve been having tooth problems — I think I have a cavity and one tooth has been aching for a couple of days. Can you guys help me with that?' },
  { speaker: 'layla', at: 8.65, text: 'Oh no, I’m so sorry — toothaches are the worst. But don’t worry, we’ve got you covered.' },
  { speaker: 'layla', at: 12.33, text: 'Let’s get you seen as soon as possible so we can figure out what’s going on. First, could I start with your full name?' },
  { speaker: 'robert', at: 20.44, text: 'Um, yes — that’s Robert John.' },
  { speaker: 'layla', at: 22.84, text: 'Thanks, Robert! Now, what’s the best email address for you?' },
  { speaker: 'robert', at: 26.25, text: 'Um, that’s robertjohn123 — at yahoo dot com.' },
  { speaker: 'layla', at: 35.84, text: 'Got it — let me read that back to make sure I’ve got it right: robertjohn123 at yahoo dot com. Is that correct?' },
  { speaker: 'robert', at: 44.12, text: 'Yes.' },
  { speaker: 'robert', at: 46.88, text: 'Um, yes — everything looks good.' },
  { speaker: 'layla', at: 48.38, text: 'Awesome, thank you so much! Give me one second to get you set up… You’re all set, Robert!' },
  { speaker: 'layla', at: 53.93, text: 'You mentioned a toothache and a possible cavity — let’s get you in for an emergency appointment. When works best? We open as early as 7:30 AM today.' },
  { speaker: 'robert', at: 63.19, text: 'Um, I’d like to come tomorrow — and one more thing: please check everything else while I’m there.' },
  { speaker: 'layla', at: 69.08, text: 'Got it.' },
  { speaker: 'layla', at: 70.3, text: 'Alright, Robert — a full checkup plus the toothache. Let me check tomorrow’s availability… I see openings at 8:00 AM, 11:30 AM, and 2:00 PM. Do any of those work for you?' },
  { speaker: 'robert', at: 85.78, text: 'Um yes — 8:00 AM sounds great.' },
  { speaker: 'layla', at: 87.03, text: 'Perfect! You’re booked with Dr. Pegel tomorrow at 8 AM — one hour. You’re all booked in, Robert: a confirmation text and email are on the way, plus a reminder before your visit. Take care!' },
];

/** Tool moments the agent fires during the call — drive the "action chips". */
export const ACTIONS: ActionMoment[] = [
  { at: 35.84, label: 'Read-back confirmation', code: 'confirm(details)' },
  { at: 48.38, label: 'Customer record saved', code: 'upsert_contact("Robert John")' },
  { at: 70.3, label: 'Checking calendar', code: 'check_availability("tomorrow")' },
  { at: 87.03, label: 'Booking confirmed', code: 'create_event("Dr. Pegel · 8:00 AM")' },
  { at: 94.5, label: 'Confirmation email', code: 'send_email(robertjohn123@yahoo.com)' },
  { at: 100.0, label: 'SMS reminder scheduled', code: 'send_sms("+011 5131 1…")' },
];

export const AUDIO_SRC = '/audio/dentist-booking.mp3';
export const FULL_CALL_SRC = '/audio/dentist-full.mp3';
/** total highlight duration per ffprobe (110.76 s) */
export const CUT_DURATION = 110.76;

/** Active turn index for a playback position, or -1 before the first turn. */
export function turnIndexAt(t: number): number {
  let idx = -1;
  for (let i = 0; i < TURNS.length; i++) {
    if (TURNS[i].at <= t + 0.12) idx = i;
    else break;
  }
  return idx;
}

/** Index of the last action that has fired at playback position t. */
export function actionIndexAt(t: number): number {
  let idx = -1;
  for (let i = 0; i < ACTIONS.length; i++) {
    if (ACTIONS[i].at <= t) idx = i;
    else break;
  }
  return idx;
}
