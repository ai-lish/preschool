# Opus Analysis: 小詩's Evaluation Fix Recommendations

## Audio Issue Analysis

- **Root cause: TTS code is actually correct — it uses Web Speech API (`speechSynthesis`) properly.**
  - `speak()` method (line ~17-27) correctly creates `SpeechSynthesisUtterance` with `lang: 'zh-HK'`, rate 0.85
  - Every step calls `this.speak()` with appropriate text
  - The issue is **NOT broken code** but rather:
    1. **Browser autoplay policy** — `speechSynthesis.speak()` requires a prior user gesture. If the first `speak()` fires on page load or auto-navigation without a tap/click, it gets silently blocked.
    2. **zh-HK voice availability** — Many devices (especially mobile) don't have a Cantonese TTS voice installed. The API fails silently when no matching voice is found.
    3. **No error handling or fallback** — `speak()` doesn't check if speech actually started or if a voice exists for `zh-HK`.
- **Fix needed:**
  1. Add a user-gesture gate: on first interaction, call `speechSynthesis.speak(new SpeechSynthesisUtterance(''))` to unlock audio
  2. Add voice availability check: `speechSynthesis.getVoices().filter(v => v.lang.startsWith('zh'))` — if none found, show a visible warning
  3. Add `onerror` handler on utterance to detect failures
  4. Consider fallback to a cloud TTS API (e.g. Google Cloud TTS for Cantonese) or pre-recorded audio files for key phrases

## Activity Duration Analysis

- **Current:** Each activity has **5 steps**. Duration is entirely user-paced (click "繼續 →" to advance). There's no timer, no minimum dwell time per step.
- **Why it feels short:** Steps like `intro`, `groupPhoto`, and `giveGifts` are pure display with no interaction — child just reads/hears and clicks next. A 3-year-old could click through all 5 steps in under 60 seconds.
- **Fix needed:**
  1. Add **more items per interactive step** (e.g., `findRedFruits` has only 4 items — increase to 6-8)
  2. Add **delay before showing "繼續" button** on non-interactive steps (e.g., 3-5 seconds) to ensure child absorbs content
  3. Add **bonus rounds** — when child completes a step perfectly, offer "再玩多次？" with shuffled items
  4. Add **celebration animations** that take time (confetti, character dancing) before enabling the next button
  5. Hide "繼續 →" button until the step's interaction is complete (e.g., all correct items found)

## Priority Fix List

1. [ ] **P0 — Unlock audio on first user gesture**
   - In `App.init()` or the first button click handler, add: `speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(''));`
   - This is the #1 reason 小詩 heard nothing — autoplay policy

2. [ ] **P0 — Add zh-HK voice availability check**
   - After `speechSynthesis.onvoiceschanged`, check for Cantonese voices
   - If none: show banner "請安裝廣東話語音" with platform-specific instructions
   - Fallback: try `zh-TW` or `zh-CN` voice (better than silence)

3. [ ] **P1 — Add onerror handling to speak()**
   - `u.onerror = (e) => console.warn('TTS failed:', e);` + visual fallback (show text in speech bubble)
   - Currently errors are completely swallowed

4. [ ] **P1 — Gate "繼續 →" button behind interaction completion**
   - For steps with `findRed*`, `sortYellow*`, `bodyQuiz`, `pick` — disable next button until task is done
   - Currently child can skip every interaction by clicking "繼續 →" immediately

5. [ ] **P2 — Add auto-advance delay on narrative steps**
   - Steps like `intro`, `sunIntro`, `diveIntro` should hide the next button for 3-4 seconds
   - Let the TTS finish before allowing advance

6. [ ] **P2 — Richer celebration feedback**
   - `_confetti()` exists (line ~56) but is **never called** anywhere in the activity flows
   - `showSuccess()` overlay only lasts 1.5 seconds — too brief
   - Add: jumping stars, character reactions, sound effects

7. [ ] **P3 — Increase item counts for longer engagement**
   - `findRedFruits`: 4 items → 6-8
   - `bodyQuiz`: 4 rounds → 6 (cover all body parts)
   - `_shootColors`: 5 rounds is good, but add more variety

8. [ ] **P3 — Add touchscreen optimization**
   - Buttons use `onclick` which has 300ms delay on mobile — add `touch-action: manipulation` CSS
   - Canvas drawing (`_setupCanvas`) correctly handles touch events ✓
   - Button sizes should be audited for minimum 44×44px tap targets

## Code References

| File | Location | Issue |
|------|----------|-------|
| `js/activities.js` | `speak()` ~L17-27 | No voice availability check, no onerror handler, no autoplay-unlock |
| `js/activities.js` | `_confetti()` ~L56 | Confetti function exists but is **never called** from any activity flow |
| `js/activities.js` | `showSuccess()` ~L870 | Only 1500ms display time, no confetti, minimal celebration |
| `js/activities.js` | `_renderStoryStep()` ~L191 | "繼續 →" button always enabled regardless of step completion |
| `js/activities.js` | `_renderExplorationStep()` ~L305 | Same issue — next button not gated |
| `js/activities.js` | `_renderGameStep()` ~L397 | Same issue — next button not gated |
| `js/activities.js` | `_handleAgeTap()` ~L253 | Hardcoded `correct = 3` — should read from child profile |
| `js/activities.js` | All `_render*Step` methods | No delay before showing navigation, TTS gets cut off by fast clicking |

## Quick Win: Unlock Audio (Copy-Paste Fix)

```javascript
// Add to speak() method, replace current implementation:
speak(text, cb) {
    if (!text) { if (cb) cb(); return; }
    if (!('speechSynthesis' in window)) { if (cb) setTimeout(cb, 1000); return; }
    
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-HK';
    u.rate = 0.85;
    
    // Try to find a Cantonese voice explicitly
    const voices = speechSynthesis.getVoices();
    const cantoneseVoice = voices.find(v => v.lang === 'zh-HK') 
        || voices.find(v => v.lang.startsWith('zh'));
    if (cantoneseVoice) u.voice = cantoneseVoice;
    
    try {
        const settings = ProgressManager.getSettings();
        u.volume = settings.volume || 1;
    } catch(e) { u.volume = 1; }
    
    u.onend = () => { if (cb) cb(); };
    u.onerror = (e) => {
        console.warn('TTS error:', e);
        if (cb) cb();
    };
    
    speechSynthesis.speak(u);
},
```

## Summary

**小詩's evaluation is accurate.** The TTS code is structurally sound but fails silently due to browser autoplay policies and missing voice availability checks. Activities are user-paced with no completion gates, so they feel short. The `_confetti()` celebration function was built but never wired in. Fixing P0 items (audio unlock + voice check) would immediately raise the Audio Quality rating from ★★☆☆☆ to ★★★★☆.
