import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon.jsx';
import { MatchTile } from './MatchTile.jsx';
import { shuffleArr } from '../utils/helpers.js';
import { storageGet } from '../utils/storage.js';
import { playPronunciation, speakText } from '../utils/voice.js';

export function ListeningGame({ pool, onExit, onReview }) {
  const [queue, setQueue] = useState([]);
  const [ready, setReady] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [mediaCache, setMediaCache] = useState({});

  function buildRound(card) {
    const direction = Math.random() < 0.5 ? 'en' : 'ru';
    const distractors = shuffleArr(pool.filter((c) => c.id !== card.id)).slice(0, 3);
    const options = shuffleArr([card, ...distractors]);
    return { card, direction, options };
  }

  useEffect(() => {
    setQueue(shuffleArr(pool).map(buildRound));
    setReady(true);
    setDoneCount(0);
    setSelected(null);
    setAnswered(false);
    setMistakes(0);
    pool.forEach((c) => {
      if (c.hasAudio && mediaCache[c.id] === undefined) {
        storageGet('media:' + c.id).then((raw) => {
          if (raw) setMediaCache((prev) => ({ ...prev, [c.id]: JSON.parse(raw) }));
        });
      }
    });
  }, [pool]);

  const current = queue[0];

  function playCurrent() {
    if (!current) return;
    if (current.direction === 'en') {
      playPronunciation(current.card, mediaCache[current.card.id]);
    } else {
      speakText(current.card.back, 'ru-RU');
    }
  }

  useEffect(() => {
    if (current) playCurrent();
  }, [queue]);

  function choose(optionCard) {
    if (answered || !current) return;
    const isCorrect = optionCard.id === current.card.id;
    setSelected(optionCard.id);
    setAnswered(true);
    if (!isCorrect) setMistakes((m) => m + 1);

    function advance() {
      setAnswered(false);
      setSelected(null);
      if (isCorrect) {
        setDoneCount((d) => d + 1);
        setQueue((q) => q.slice(1));
      } else {
        setQueue((q) => [{ ...q[0], options: shuffleArr(q[0].options) }, ...q.slice(1)]);
      }
    }

    if (isCorrect && current.direction === 'ru') {
      playPronunciation(optionCard, mediaCache[optionCard.id]).then(() => {
        setTimeout(advance, 300);
      });
    } else {
      setTimeout(advance, 900);
    }
  }

  function playAgain() {
    setQueue(shuffleArr(pool).map(buildRound));
    setDoneCount(0);
    setMistakes(0);
    setSelected(null);
    setAnswered(false);
  }

  const done = ready && queue.length === 0;

  if (done) {
    return (
      <div className="px-5 pb-8 flex flex-col items-center justify-center text-center" style={{ minHeight: '60vh' }}>
        <div
          className="flex items-center justify-center mb-5"
          style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <Icon name="volume2" size={28} />
        </div>
        <p className="dc-display text-lg font-semibold mb-1">Готово!</p>
        <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
          {mistakes === 0 ? 'Без единой ошибки' : `Ошибок: ${mistakes}`}
        </p>
        <div className="flex items-center gap-3">
          <button onClick={playAgain} className="dc-btn px-5 py-3 text-sm" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            Ещё раз
          </button>
          <button onClick={onExit} className="dc-btn px-5 py-3 text-sm" style={{ background: 'var(--accent)', color: '#fff' }}>
            Готово
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="px-5 pb-8 flex flex-col items-center" style={{ minHeight: '60vh' }}>
      <p className="text-sm mb-1" style={{ color: 'var(--ink-soft)' }}>{doneCount + 1} / {pool.length}</p>
      <p className="text-xs mb-5" style={{ color: 'var(--ink-faint)' }}>
        {current.direction === 'en' ? 'Слушайте слово на английском' : 'Слушайте перевод на русском'}
      </p>
      <button
        onClick={playCurrent}
        className="dc-btn dc-tappable flex items-center justify-center mb-6"
        style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)' }}
        aria-label="Повторить"
      >
        <Icon name="volume2" size={28} />
      </button>
      <div className="flex flex-col gap-2" style={{ width: '100%', maxWidth: 360 }}>
        {current.options.map((opt) => {
          const label = current.direction === 'en' ? opt.back : opt.front;
          let state = 'default';
          if (answered && opt.id === selected) {
            state = selected === current.card.id ? 'matched' : 'wrong';
          }
          return <MatchTile key={opt.id} label={label} state={state} onClick={() => choose(opt)} />;
        })}
      </div>
    </div>
  );
}