// speech.js — a thin wrapper over the browser Web Speech API for speech-to-text.
// IMPORTANT: this is NOT guaranteed on-device. Several browsers (notably Chrome,
// which streams to Google's speech service) send the raw mic audio to a remote
// vendor to transcribe; only the returned transcript comes back to us. Forma
// never receives or stores the audio, but it is NOT a private/on-device path —
// the UI must disclose this at the mic and offer typing as the on-device option.
// Falls back gracefully: callers check speechSupported() and offer typing when
// it's false (notably some installed iOS PWAs).

export function speechSupported() {
  return typeof window !== 'undefined'
    && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Create a recognizer. Callbacks: onInterim(text), onFinal(text), onError(code),
// onEnd(). Returns null if unsupported. The caller manages start()/stop().
export function createRecognizer({ onInterim, onFinal, onError, onEnd } = {}) {
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) return null;
  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = true;
  rec.onresult = (e) => {
    let interim = '';
    let final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const chunk = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += chunk;
      else interim += chunk;
    }
    if (final && onFinal) onFinal(final);
    if (interim && onInterim) onInterim(interim);
  };
  rec.onerror = (e) => { if (onError) onError(e.error || 'error'); };
  rec.onend = () => { if (onEnd) onEnd(); };
  return rec;
}
