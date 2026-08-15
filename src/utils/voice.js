const VOICE_LANG = 'en-US';
const cachedVoices = {};

let audioMap = null;
let audioMapPromise = null;

function loadAudioMap() {
  if (audioMap !== null) {
    return Promise.resolve(audioMap);
  }

  if (audioMapPromise) {
    return audioMapPromise;
  }

  audioMapPromise = fetch(`${import.meta.env.BASE_URL}audio/audio-map.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Audio map HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      audioMap = data || {};
      return audioMap;
    })
    .catch((error) => {
      console.warn('Merriam-Webster audio map unavailable:', error);
      audioMap = {};
      return audioMap;
    });

  return audioMapPromise;
}

function getMerriamWebsterAudio(word) {
  const normalized = String(word || '').trim().toLowerCase();

  if (!normalized) {
    return Promise.resolve(null);
  }

  return loadAudioMap().then((map) => {
    return map[normalized] || null;
  });
}

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
    if (!window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.92;

    const prefix = lang.split('-')[0];
    const v =
      cachedVoices[prefix] !== undefined
        ? cachedVoices[prefix]
        : pickVoice(lang);

    if (v) utter.voice = v;

    let done = false;

    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };

    utter.onend = finish;
    utter.onerror = finish;

    window.speechSynthesis.speak(utter);

    setTimeout(finish, 4000);
  });
}

let currentAudio = null;

function playAudio(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve();
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    const a = new Audio(url);
    currentAudio = a;

    let done = false;

    const finish = () => {
      if (!done) {
        done = true;

        if (currentAudio === a) {
          currentAudio = null;
        }

        resolve();
      }
    };

    a.onended = finish;
    a.onerror = finish;

    a.play().catch(finish);

    setTimeout(finish, 6000);
  });
}

function getDictionaryApiAudio(word) {
  const normalized = String(word || '').trim().toLowerCase();

  if (!normalized) {
    return Promise.resolve(null);
  }

  return fetch(
    `${import.meta.env.VITE_API_BASE_URL || ''}/api/dictionary-audio?word=${encodeURIComponent(normalized)}`
  )
    .then((response) => {
      if (!response.ok) {
        return null;
      }
      return response.json();
    })
    .then((data) => {
      return data && data.audio ? data.audio : null;
    })
    .catch(() => null);
}
export async function getPronunciationSources(word) {
  const normalized = String(word || '').trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  const sources = [];

  const merriamAudio = await getMerriamWebsterAudio(normalized);

  if (merriamAudio) {
    sources.push({
      id: 'merriam',
      label: 'Merriam-Webster',
      audio: merriamAudio,
    });
  }

  const dictionaryAudio = await getDictionaryApiAudio(normalized);

  if (dictionaryAudio) {
    sources.push({
      id: 'dictionary',
      label: 'Dictionary API',
      audio: dictionaryAudio,
    });
  }
  return sources;
}

export function playPronunciationSource(source, word) {
  if (!source) {
    return Promise.resolve();
  }

  if (source.id === 'tts') {
    return speakText(word, VOICE_LANG);
  }

  return playAudio(source.audio);
}
export function playPronunciation(card, media) {
  const word = String(card?.front || '').trim();
  const selectedSource = card?.audioSource;

  if (selectedSource === 'merriam') {
    return getMerriamWebsterAudio(word)
      .then((audio) => {
        if (audio) {
          return playAudio(audio);
        }

        return speakText(word, VOICE_LANG);
      });
  }

  if (selectedSource === 'dictionary') {
    return getDictionaryApiAudio(word)
      .then((audio) => {
        if (audio) {
          return playAudio(audio);
        }

        return speakText(word, VOICE_LANG);
      });
  }

  return getMerriamWebsterAudio(word)
    .then((merriamAudio) => {
      if (merriamAudio) {
        return playAudio(merriamAudio);
      }

      return getDictionaryApiAudio(word);
    })
    .then((dictionaryAudio) => {
      if (dictionaryAudio) {
        return playAudio(dictionaryAudio);
      }

      if (media && media.audio) {
        return playAudio(media.audio);
      }

      return speakText(word, VOICE_LANG);
    });
}