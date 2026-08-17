import { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icon.jsx';
import { StudyView } from '../study/StudyView.jsx';
import { ListeningGame } from './ListeningGame.jsx';
import { MatchGame } from './MatchGame.jsx';
import { shuffleArr } from '../utils/helpers.js';
import { storageGet } from '../utils/storage.js';

export function MixedPractice({ pool, mixed, applyReview, onExit }) {
  const practicePoolRef = useRef(pool);
  
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [batchQueue, setBatchQueue] = useState([]);
  const [batchSize, setBatchSize] = useState(1);
  const [batchFlipped, setBatchFlipped] = useState(false);
  const [mediaCache, setMediaCache] = useState({});

 useEffect(() => {
  const practicePool = practicePoolRef.current;

  if (!practicePool.length) {
    setSteps([]);
    setStepIndex(0);
    return;
  }

  const shuffled = shuffleArr(practicePool);

  // Обычный режим: только карточки
  if (!mixed) {
    const chunks = [];
    let index = 0;

    while (index < shuffled.length) {
      const remaining = shuffled.length - index;

      let minSize;
      let maxSize;

      if (shuffled.length <= 3) {
        minSize = 1;
        maxSize = Math.min(2, remaining);
      } else if (shuffled.length <= 6) {
        minSize = 2;
        maxSize = Math.min(3, remaining);
      } else if (shuffled.length <= 10) {
        minSize = 2;
        maxSize = Math.min(4, remaining);
      } else {
        minSize = 3;
        maxSize = Math.min(6, remaining);
      }

      if (minSize > remaining) minSize = remaining;

      const size =
        minSize +
        Math.floor(Math.random() * (maxSize - minSize + 1));

      chunks.push({
        type: 'cards',
        items: shuffled.slice(index, index + size),
      });

      index += size;
    }

    setSteps(chunks);
    setStepIndex(0);
    return;
  }

  // Смешанный режим проблемных слов
  const built = [];
  let index = 0;
  let lastExercise = null;

  while (index < shuffled.length) {
    const remaining = shuffled.length - index;

    let minSize;
    let maxSize;

    if (shuffled.length <= 3) {
      minSize = 1;
      maxSize = Math.min(2, remaining);
    } else if (shuffled.length <= 6) {
      minSize = 1;
      maxSize = Math.min(3, remaining);
    } else if (shuffled.length <= 10) {
      minSize = 2;
      maxSize = Math.min(4, remaining);
    } else {
      minSize = 3;
      maxSize = Math.min(6, remaining);
    }

    if (minSize > remaining) minSize = remaining;

    const size =
      minSize +
      Math.floor(Math.random() * (maxSize - minSize + 1));

    const chunk = shuffled.slice(index, index + size);

    built.push({
      type: 'cards',
      items: chunk,
    });

    index += size;

    // После блока карточек иногда вставляем упражнение.
    if (index < shuffled.length) {
      let exercise;

      if (lastExercise === 'listening') {
        exercise = 'match';
      } else if (lastExercise === 'match') {
        exercise = 'listening';
      } else {
        exercise = Math.random() < 0.5 ? 'listening' : 'match';
      }

      const exerciseWords = shuffleArr(practicePool).slice(
        0,
        Math.min(4, practicePool.length)
      );

      if (exerciseWords.length >= 2) {
        built.push(
          exercise === 'listening'
            ? { type: 'listening', words: exerciseWords }
            : { type: 'match', words: exerciseWords }
        );

        lastExercise = exercise;
      }
    }
  }

  setSteps(built);
setStepIndex(0);
}, []);
  
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
        <ListeningGame
  pool={currentStep.words}
  onExit={onExit}
  onReview={(cardId, direction, knew) => {
    if (mixed) {
      applyReview(cardId, direction, knew);
    }
  }}
/>
      </div>
    );
  }

  if (currentStep.type === 'match') {
    return (
      <div>
        <p className="text-xs text-center pt-4" style={{ color: 'var(--ink-faint)' }}>{progressLabel} · связки слов</p>
       <MatchGame
  gameCards={currentStep.words}
  distractorCards={[]}
  onExit={nextStep}
  onReview={(cardId, direction, knew) => {
    if (mixed) {
      applyReview(cardId, direction, knew);
    }
  }}
/>
      </div>
    );
  }

  return null;
}