import { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from '../components/Icon.jsx';
import { IconBtn } from '../components/IconBtn.jsx';
import { Modal } from '../components/Modal.jsx';
import { TextField } from '../components/TextField.jsx';
import { storageGet } from '../utils/storage.js';
import { fetchDictionaryData, fetchTranslation, fetchTranslationRuEn } from '../utils/api.js';
import { fileToDataUrl } from '../utils/helpers.js';
import { getPronunciationSources, playPronunciationSource } from '../utils/voice.js';

export function CardFormModal({ deckId, editingCard, existingCards = [], onSave, onClose }) {
  const [front, setFront] = useState(editingCard ? editingCard.front : '');
  const [back, setBack] = useState(editingCard ? editingCard.back : '');
  const [exampleEn, setExampleEn] = useState(editingCard ? editingCard.exampleEn || '' : '');
  const [exampleRu, setExampleRu] = useState(editingCard ? editingCard.exampleRu || '' : '');

  const isDuplicate = useMemo(() => {
    const f = front.trim().toLowerCase();
    if (!f) return false;
    return existingCards.some(
      (c) => c.front.trim().toLowerCase() === f && (!editingCard || c.id !== editingCard.id)
    );
  }, [front, existingCards, editingCard]);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageCleared, setImageCleared] = useState(false);

  const [audioPreview, setAudioPreview] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioCleared, setAudioCleared] = useState(false);
  const [audioFromDict, setAudioFromDict] = useState(false);
 const [audioSource, setAudioSource] = useState(
  editingCard ? editingCard.audioSource || 'merriam' : 'merriam'
);

const audioSourceRequestRef = useRef(0);

  const [loadingMedia, setLoadingMedia] = useState(!!editingCard);

  const [dictLoading, setDictLoading] = useState(false);
  const [dictError, setDictError] = useState(null);
  const [dictExamples, setDictExamples] = useState([]);
  const [dictIndex, setDictIndex] = useState(0);

  const [translating, setTranslating] = useState(false);
  const [translatingExample, setTranslatingExample] = useState(false);
  const [backAutoFilled, setBackAutoFilled] = useState(false);
  const [exampleRuAutoFilled, setExampleRuAutoFilled] = useState(false);
  const isRussianInput = /[а-яёА-ЯЁ]/.test(front.trim());

  function handleBackChange(v) {
    setBack(v);
    setBackAutoFilled(false);
  }
  function handleExampleRuChange(v) {
    setExampleRu(v);
    setExampleRuAutoFilled(false);
  }

  useEffect(() => {
    let cancelled = false;
    if (editingCard) {
      storageGet('media:' + editingCard.id).then((raw) => {
        if (cancelled) return;
        if (raw) {
          const m = JSON.parse(raw);
          if (m.image) setImagePreview(m.image);
          if (m.audio) {
            setAudioPreview(m.audio);
            setAudioUrl(m.audio);
          }
        }
        setLoadingMedia(false);
      });
    }
    return () => { cancelled = true; };
  }, [editingCard]);

  useEffect(() => {
    if (!front.trim() || (back.trim() && !backAutoFilled)) return;
    const timer = setTimeout(async () => {
      setTranslating(true);
      const translated = isRussianInput
  ? await fetchTranslationRuEn(front)
  : await fetchTranslation(front);
      setTranslating(false);
      if (translated) {
        setBack(translated);
        setBackAutoFilled(true);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [front, isRussianInput]);
    useEffect(() => {
    if (!back.trim() || front.trim()) return;

    const isRussianBack = /[а-яёА-ЯЁ]/.test(back.trim());
    if (!isRussianBack) return;

    const timer = setTimeout(async () => {
      setTranslating(true);

      const translated = await fetchTranslationRuEn(back);

      setTranslating(false);

      if (translated) {
        setFront(translated);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [back, front]);

  useEffect(() => {
    if (!exampleEn.trim() || (exampleRu.trim() && !exampleRuAutoFilled)) return;
    const timer = setTimeout(async () => {
      setTranslatingExample(true);
      const translated = await fetchTranslation(exampleEn);
      setTranslatingExample(false);
      if (translated) {
        setExampleRu(translated);
        setExampleRuAutoFilled(true);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [exampleEn]);

  async function handleImagePick(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImageCleared(false);
    const preview = await fileToDataUrl(file);
    setImagePreview(preview);
  }
  async function handleAudioPick(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAudioFile(file);
    setAudioUrl(null);
    setAudioFromDict(false);
    setAudioCleared(false);
    const preview = await fileToDataUrl(file);
    setAudioPreview(preview);
  }
  function clearAudio() {
    setAudioPreview(null);
    setAudioFile(null);
    setAudioUrl(null);
    setAudioFromDict(false);
    setAudioCleared(true);
  }

  async function handleAudioSourceChange(source) {
  setAudioSource(source);

  const requestId = ++audioSourceRequestRef.current;
  setAudioPreview(null);
  setAudioUrl(null);
  setAudioFile(null);
  setAudioFromDict(false);
  setAudioCleared(false);

  const word = front.trim();
  if (!word) return;

  if (source === 'tts') {
    await playPronunciationSource({ id: 'tts' }, word);
    return;
  }
  if (source === 'merriam') {
    const response = await fetch(
      `https://english-simply.vercel.app/api/pronunciation?word=${encodeURIComponent(word)}`
    );

    if (!response.ok) return;

    const data = await response.json();

    if (requestId !== audioSourceRequestRef.current) return;

    if (data?.audio) {
      setAudioPreview(data.audio);
      setAudioUrl(data.audio);
      setAudioFile(null);
      setAudioFromDict(false);
      setAudioCleared(false);
    }

    return;
  }
  if (source === 'dictionary') {
    const response = await fetch(
      `/api/dictionary-audio?word=${encodeURIComponent(word)}`
    );

    const data = await response.json();

    if (requestId !== audioSourceRequestRef.current) return;

    if (data?.audio) {
      setAudioPreview(data.audio);
      setAudioUrl(data.audio);
      setAudioFile(null);
      setAudioFromDict(true);
      setAudioCleared(false);
    }

    return;
  }

  const sources = await getPronunciationSources(word);

  if (requestId !== audioSourceRequestRef.current) return;

  const selected = sources.find((item) => item.id === source);

  if (selected?.audio) {
    setAudioPreview(selected.audio);
    setAudioUrl(selected.audio);
    setAudioFile(null);
    setAudioFromDict(false);
    setAudioCleared(false);
  }
}
  async function handleDictLookup() {
  if (!front.trim() || dictLoading) return;
  const dictionaryWord = isRussianInput ? back.trim() : front.trim();

if (!dictionaryWord) return;

  setDictLoading(true);
  setDictError(null);

  try {
    const response = await fetch(
     `https://english-simply.vercel.app/api/pronunciation?word=${encodeURIComponent(dictionaryWord)}`
    );

    if (!response.ok) {
      throw new Error(`Pronunciation API HTTP ${response.status}`);
    }

    const result = await response.json();

    const examples = Array.isArray(result.examples)
      ? result.examples
      : [];

    const audio = result.audio || null;
    const notFound = !!result.notFound;

    if (notFound && !audio && examples.length === 0) {
      setDictError('notfound');
      setDictExamples([]);
      return;
    }

    setDictExamples(examples);
    setDictIndex(0);

    if (examples.length > 0 && !exampleEn.trim()) {
      setExampleEn(examples[0]);
    }

    if (audio) {
      setAudioPreview(audio);
      setAudioUrl(audio);
      setAudioFile(null);
      setAudioFromDict(true);
      setAudioCleared(false);
    }

    if (examples.length === 0 && !audio) {
      setDictError('empty');
    }
  } catch (e) {
    console.error('Dictionary lookup failed', e);
    setDictError('error');
  } finally {
    setDictLoading(false);
  }
}

  function cycleExample() {
    if (dictExamples.length === 0) return;
    const next = (dictIndex + 1) % dictExamples.length;
    setDictIndex(next);
    setExampleEn(dictExamples[next]);
  }

  const canSave = front.trim() && back.trim();

  return (
    <Modal title={editingCard ? 'Изменить карточку' : 'Новая карточка'} onClose={onClose}>
      <TextField label="Слово / фраза (англ.)" value={front} onChange={setFront} placeholder="e.g. to notice" required />
      {isDuplicate && (
        <p className="text-xs -mt-2 mb-3" style={{ color: 'var(--gold)' }}>
          Такое слово уже есть в этой колоде — сохранится ещё одна карточка.
        </p>
      )}

      <div className="mb-3 -mt-1 flex items-center gap-2 flex-wrap">
        <button
          onClick={handleDictLookup}
          disabled={(!front.trim() && !back.trim()) || dictLoading}
          className="dc-btn dc-tappable flex items-center gap-1.5 px-3 py-1.5 text-sm"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', opacity: !front.trim() ? 0.5 : 1 }}
        >
          <Icon name="bookOpen" size={14} /> {dictLoading ? 'Ищу…' : 'Найти в словаре'}
        </button>
        {dictError === 'notfound' && (
          <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>Слово не найдено в словаре</span>
        )}
        {dictError === 'empty' && (
          <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>Ни примеров, ни аудио не нашлось</span>
        )}
        {dictError === 'error' && (
          <span className="text-xs" style={{ color: 'var(--again)' }}>Не удалось связаться со словарём</span>
        )}
      </div>

      <TextField label="Перевод (рус.)" value={back} onChange={handleBackChange} placeholder="например, замечать" required />
      {translating && (
        <p className="text-xs -mt-2 mb-3" style={{ color: 'var(--ink-faint)' }}>Переводим…</p>
      )}

      <label className="block mb-1">
        <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>Пример предложения (англ.)</span>
        <input
          value={exampleEn}
          onChange={(e) => setExampleEn(e.target.value)}
          placeholder="Did you notice the change?"
          className="w-full mt-1 px-3 py-2 text-sm"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--ink)' }}
        />
      </label>
      {dictExamples.length > 1 && (
        <button onClick={cycleExample} className="dc-tappable text-xs mb-3" style={{ color: 'var(--accent)' }}>
          Другой пример ({dictIndex + 1}/{dictExamples.length})
        </button>
      )}
      {dictExamples.length <= 1 && <div className="mb-3" />}

      <TextField label="Перевод примера (рус.)" value={exampleRu} onChange={handleExampleRuChange} placeholder="Ты заметил изменение?" />
      {translatingExample && (
        <p className="text-xs -mt-2 mb-3" style={{ color: 'var(--ink-faint)' }}>Переводим…</p>
      )}

      <div className="mb-3">
        <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>Картинка для ассоциации</span>
        <div className="mt-1 flex items-center gap-3">
          {imagePreview && !imageCleared ? (
            <div className="relative">
              <img src={imagePreview} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10 }} />
              <button
                onClick={() => { setImagePreview(null); setImageFile(null); setImageCleared(true); }}
                className="absolute flex items-center justify-center"
                style={{ top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--again)', color: '#fff' }}
                aria-label="Убрать картинку"
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          ) : (
            <label
              className="dc-tappable flex items-center justify-center cursor-pointer"
              style={{ width: 64, height: 64, borderRadius: 10, border: '1px dashed var(--border)', color: 'var(--ink-faint)' }}
            >
              <Icon name="imagePlus" size={20} />
              <input type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
            </label>
          )}
          <span className="text-sm" style={{ color: 'var(--ink-faint)' }}>
            {loadingMedia ? 'Загрузка…' : 'необязательно'}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>Аудио произношения</span>
        <div className="mt-2 flex items-center gap-2">
  <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
    Источник:
  </span>

  <select
    value={audioSource}
    onChange={(e) => handleAudioSourceChange(e.target.value)}
    className="text-sm px-2 py-1"
    style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      color: 'var(--ink)',
    }}
  >
    <option value="merriam">Merriam-Webster</option>
    <option value="wiktionary">Wiktionary US</option>
    <option value="dictionary">Dictionary API</option>
    <option value="tts">Синтез речи</option>
  </select>
</div>
        <div className="mt-1 flex items-center gap-3">
          {audioPreview && !audioCleared ? (
            <div className="flex items-center gap-2">
              <audio
  key={audioPreview}
  controls
  src={audioPreview}
  style={{ height: 32, maxWidth: 180 }}
/>
              <IconBtn label="Убрать аудио" size="sm" tone="ghost" onClick={clearAudio}>
                <Icon name="x" size={14} />
              </IconBtn>
            </div>
          ) : (
            <label
              className="dc-btn dc-tappable flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink-soft)' }}
            >
              <Icon name="music" size={15} /> Загрузить файл
              <input type="file" accept="audio/*" onChange={handleAudioPick} className="hidden" />
            </label>
          )}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>
          {audioFromDict && !audioCleared
            ? 'Аудио найдено в словаре.'
            : 'Найдите словом выше или загрузите файл — иначе сработает синтез речи.'}
        </p>
      </div>

     <button
     disabled={!canSave}
     onClick={() =>
    onSave(
      {
        front: front.trim(),
        back: back.trim(),
        exampleEn: exampleEn.trim(),
        exampleRu: exampleRu.trim(),
        audioSource,
      },
      {
        image: imageFile,
        clearImage: imageCleared && !imageFile,
        audio: audioFile,
        audioUrl: audioUrl,
        clearAudio: audioCleared && !audioFile && !audioUrl,
      }
    )
  }
        className="dc-btn w-full py-3 text-sm"
        style={{ background: 'var(--accent)', color: '#fff', opacity: canSave ? 1 : 0.5 }}
      >
        Сохранить
      </button>
    </Modal>
  );
}