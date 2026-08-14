import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon.jsx';
import { MatchTile } from './MatchTile.jsx';
import { shuffleArr } from '../utils/helpers.js';
import { storageGet } from '../utils/storage.js';
import { playPronunciation } from '../utils/voice.js';

export function MatchGame({ gameCards, distractorCards = [], onExit, onReview }) {
  const [leftOrder, setLeftOrder] = useState([]);
  const [rightOrder, setRightOrder] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedIds, setMatchedIds] = useState({});
  const [wrongPair, setWrongPair] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [mediaCache, setMediaCache] = useState({});

  useEffect(() => {
    setLeftOrder(shuffleArr(gameCards));
    setRightOrder(shuffleArr([...gameCards, ...distractorCards]));
    setMatchedIds({});
    setSelectedLeft(null);
    setSelectedRight(null);
    setMistakes(0);
    gameCards.forEach((c) => {
      if ((c.hasImage || c.hasAudio) && mediaCache[c.id] === undefined) {
        storageGet('media:' + c.id).then((raw) => {
          if (raw) setMediaCache((prev) => ({ ...prev, [c.id]: JSON.parse(raw) }));
        });
      }
    });
  }, [gameCards, distractorCards]);

  const isHard = distractorCards.length > 0;

  function tileState(id, side) {
    if (matchedIds[id]) return 'matched';
    if (wrongPair) {
      if (side === 'left' && wrongPair.left === id) return 'wrong';
      if (side === 'right' && wrongPair.right === id) return 'wrong';
    }
    if (side === 'left' && selectedLeft === id) return 'selected';
    if (side === 'right' && selectedRight === id) return 'selected';
    return 'default';
  }

  function pick(id, side) {
    if (matchedIds[id] || wrongPair) return;
    if (side === 'left') {
      if (isHard) {
        const card = gameCards.find((c) => c.id === id);
        if (card) playPronunciation(card, mediaCache[id]);
      }
      setSelectedLeft(id);
      if (selectedRight != null) evaluate(id, selectedRight);
    } else {
      setSelectedRight(id);
      if (selectedLeft != null) evaluate(selectedLeft, id);
    }
  }

  function evaluate(leftId, rightId) {
    if (leftId === rightId) {
      setMatchedIds((prev) => ({ ...prev, [leftId]: true }));
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setMistakes((m) => m + 1);
      setWrongPair({ left: leftId, right: rightId });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 500);
    }
  }

  const total = gameCards.length;
  const matchedCount = Object.keys(matchedIds).length;
  const done = total > 0 && matchedCount === total;

  function playAgain() {
    setLeftOrder(shuffleArr(gameCards));
    setRightOrder(shuffleArr([...gameCards, ...distractorCards]));
    setMatchedIds({});
    setSelectedLeft(null);
    setSelectedRight(null);
    setMistakes(0);
  }

  if (done) {
    return (
      <div className="px-5 pb-8 flex flex-col items-center justify-center text-center" style={{ minHeight: '60vh' }}>
        <div
          className="flex items-center justify-center mb-5"
          style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--good-soft)', color: 'var(--good)' }}
        >
          <Icon name="check" size={28} />
        </div>
        <p className="dc-display text-lg font-semibold mb-1">Все пары найдены!</p>
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

  return (
    <div className="px-5 pb-8">
      <p className="text-sm text-center mb-4" style={{ color: 'var(--ink-soft)' }}>
        Найдено пар: {matchedCount} / {total}
        {distractorCards.length > 0 && ` · среди ${rightOrder.length} переводов есть лишние`}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {leftOrder.map((c) => (
            <MatchTile
              key={c.id}
              label={c.front}
              image={c.hasImage ? mediaCache[c.id] && mediaCache[c.id].image : null}
              state={tileState(c.id, 'left')}
              onClick={() => pick(c.id, 'left')}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {rightOrder.map((c) => (
            <MatchTile
              key={c.id}
              label={c.back}
              state={tileState(c.id, 'right')}
              onClick={() => pick(c.id, 'right')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}