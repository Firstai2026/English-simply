export async function fetchDictionaryData(word) {
    const clean = word.trim().toLowerCase();
    if (!clean) return { examples: [], audio: null, notFound: true };
    let res;
    try {
      res = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(clean));
    } catch (e) {
      throw new Error('network');
    }
    if (!res.ok) {
      if (res.status === 404) return { examples: [], audio: null, notFound: true };
      throw new Error('http ' + res.status);
    }
    const data = await res.json();
    const examples = [];
    let audio = null;
    (Array.isArray(data) ? data : []).forEach((entry) => {
      (entry.phonetics || []).forEach((p) => {
        if (!audio && p.audio) audio = p.audio.startsWith('//') ? 'https:' + p.audio : p.audio;
      });
      (entry.meanings || []).forEach((m) => {
        (m.definitions || []).forEach((d) => {
          if (d.example) examples.push(d.example);
        });
      });
    });
    return { examples: [...new Set(examples)], audio, notFound: false };
  }
  
  export async function fetchTranslation(word) {
    const clean = word.trim();
    if (!clean) return null;
    try {
      const res = await fetch(
        'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(clean) + '&langpair=en|ru'
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.responseStatus && data.responseStatus !== 200) return null;
      const text = data && data.responseData && data.responseData.translatedText;
      if (!text) return null;
      if (!/[а-яёА-ЯЁ]/.test(text)) return null;
      return text;
    } catch (e) {
      return null;
    }
  }
    export async function fetchTranslationRuEn(word) {
  const clean = word.trim();
  if (!clean) return null;

  try {
    const res = await fetch(
      'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(clean) +
      '&langpair=ru|en'
    );

    if (!res.ok) return null;

    const data = await res.json();

    if (data && data.responseStatus && data.responseStatus !== 200) {
      return null;
    }

    const text =
      data &&
      data.responseData &&
      data.responseData.translatedText;

    if (!text) return null;
    if (/[а-яёА-ЯЁ]/.test(text)) return null;

    return text;
  } catch (e) {
    return null;
  }
}
  