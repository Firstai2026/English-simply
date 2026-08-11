const VOICE_LANG = 'en-US';
const cachedVoices = {};

export function pickVoice(lang) {
  if (!window.speechSynthesis) return null;
  const prefix = lang.split('-')[0];
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.filter((x) => x.lang === lang);
  const byPrefix = voices.filter((x) => x.lang && x.lang.startsWith(prefix));
  const v =
    exact.find((x) => x.localService) ||
    byPrefix.find((x) => x.localService) ||
    exact[0] ||
    byPrefix[0] ||
    null;
  cachedVoices[prefix] = v;
  return v;
}

export function speakText(text, lang) {
  lang = lang || VOICE_LANG;
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.92;
    const prefix = lang.split('-')[0];
    const v = cachedVoices[prefix] !== undefined ? cachedVoices[prefix] : pickVoice(lang);
    if (v) utter.voice = v;
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    utter.onend = finish;
    utter.onerror = finish;
    window.speechSynthesis.speak(utter);
    setTimeout(finish, 4000);
  });
}

export function playPronunciation(card, media) {
  return new Promise((resolve) => {
    if (media && media.audio) {
      const a = new Audio(media.audio);
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      a.onended = finish;
      a.onerror = finish;
      a.play().catch(finish);
      setTimeout(finish, 6000);
    } else {
      speakText(card.front, VOICE_LANG).then(resolve);
    }
  });
}