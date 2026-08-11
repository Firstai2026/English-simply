import { useState, useEffect } from 'react';
import { Icon } from '../components/Icon.jsx';
import { StudyView } from '../study/StudyView.jsx';
import { ListeningGame } from './ListeningGame.jsx';
import { MatchGame } from './MatchGame.jsx';
import { shuffleArr } from '../utils/helpers.js';
import { storageGet } from '../utils/storage.js';

export function MixedPractice({ pool, applyReview, onExit }) {
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [batchQueue, setBatchQueue] = useState([]);
  const [batchSize, setBatchSize] = useState(1);
  const [batchFlipped, setBatchFlipped] = useState(false);
  const [mediaCache, setMediaCache] = useState({});

  useEffect(() => {
    const shuffled = shuffleArr(pool);
    const chunkSize = 3;
    const chunks = [];
    for (let i = 0; i < shuffled.length; i += chunkSize) {
      chunks.push(shuffled.slice(i, i + chunkSize));
    }
    const built = [];
    chunks.forEach((chunk, i) => {
      built.push({ type: 'cards', items: chunk });
      if (i < chunks.length - 1) {
        const interludeWords = shuffleArr(pool).slice(0, Math.min(4, pool.length));
        if (interludeWords.length >= 2) {
          built.push(i % 2 === 0 ? { type: 'listening', words: interludeWords } : { type: 'match', words: interludeWords });
        }
      }
    });
    setSteps(built);
    setStepIndex(0);
  }, [pool]);

  const currentStep = steps[stepIndex];

  useEffect(() => {
    if (currentStep && currentStep.type === 'cards') {
      setBatchQueue(currentStep.items.map((c) => ({ id: c.id, dir: 'forward' })));
      setBatchSize(currentStep.items.length);
      setBatchFlipped(false);
      currentStep.items.forEach((c) => {
        if ((c.hasAudio || c.hasImage) && mediaCache[c.id] === undefined) {
          storageGet('media:' + c.id).then((raw) => {
            if (raw) setMediaCache((prev) => ({ ...prev, [c.id]: JSON.parse(raw) }));
          });
        }
      });
    }
  }, [stepIndex, steps]);

  function nextStep() {
    setStepIndex((i) => i + 1);
  }

  const done = steps.length > 0 && stepIndex >= steps.length;

  if (done) {
    return (
      <div className="px-5 pb-8 flex flex-col items-center justify-center text-center" style={{ minHeight: '60vh' }}>
        <div
          className="flex items-center justify-center mb-5"
          style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--good-soft)', color: 'var(--good)' }}
        >
          <Icon name="check" size={28} />
        </div>
        <p className="dc-display text-lg font-semibold mb-1">Тренировка завершена</p>
        <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
          Пройдено слов: {pool.length}
        </p>
        <button onClick={onExit} className="dc-btn px-6 py-3 text-sm" style={{ background: 'var(--accent)', color: '#fff' }}>
          Готово
        </button>
      </div>
    );
  }

  if (!currentStep) return null;

  const progressLabel = `Этап ${stepIndex + 1} из ${steps.length}`;

  if (currentStep.type === 'cards') {
    const batchItem = batchQueue[0];
    const batchCard = batchItem && pool.find((c) => c.id === batchItem.id);
    if (!batchCard) return null;

    function handleAnswer(knew) {
      applyReview(batchItem.id, batchItem.dir, knew);
      const rest = batchQueue.slice(1);
      setBatchFlipped(false);
      if (rest.length === 0) {
        nextStep();
      } else {
        setBatchQueue(rest);
      }
    }

    return (
      <div>
        <p className="text-xs text-center pt-4" style={{ color: 'var(--ink-faint)' }}>{progressLabel}</p>
        <StudyView
          card={batchCard}
          media={mediaCache[batchCard.id]}
          direction="forward"
          flipped={batchFlipped}
          onFlip={() => setBatchFlipped((f) => !f)}
          onAnswer={handleAnswer}
          progress={`${batchSize - batchQueue.length + 1} / ${batchSize}`}
          onExit={onExit}
        />
      </div>
    );
  }

  if (currentStep.type === 'listening') {
    return (
      <div>
        <p className="text-xs text-center pt-4" style={{ color: 'var(--ink-faint)' }}>{progressLabel} · на слух</p>
        <ListeningGame pool={currentStep.words} onExit={nextStep} />
      </div>
    );
  }

  if (currentStep.type === 'match') {
    return (
      <div>
        <p className="text-xs text-center pt-4" style={{ color: 'var(--ink-faint)' }}>{progressLabel} · связки слов</p>
        <MatchGame gameCards={currentStep.words} distractorCards={[]} onExit={nextStep} />
      </div>
    );
  }

  return null;
}