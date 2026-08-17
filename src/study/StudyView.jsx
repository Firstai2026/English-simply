import { Icon } from '../components/Icon.jsx';
import { IconBtn } from '../components/IconBtn.jsx';
import { StudyCard } from './StudyCard.jsx';

export function StudyView({
  card,
  media,
  direction,
  flipped,
  onFlip,
  onAnswer,
  progress,
  onExit,
}) {
  return (
    <div className="px-5 pb-8 flex flex-col" style={{ minHeight: '70vh' }}>
      <div className="flex items-center justify-between mb-6">
        <IconBtn label="Выйти" size="sm" tone="ghost" onClick={onExit}>
          <Icon name="x" size={18} />
        </IconBtn>
        <p className="dc-mono text-sm" style={{ color: 'var(--ink-soft)' }}>{progress}</p>
        <div style={{ width: 32 }} />
      </div>

      <div className="flex-1 flex items-center">
       <StudyCard
       card={card}
       media={media}
       direction={direction}
       flipped={flipped}
       onFlip={onFlip}
       onAnswer={onAnswer}
/>
      </div>

      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={() => onAnswer(false)}
          className="dc-btn flex items-center gap-2 px-6 py-3"
          style={{ background: 'var(--again-soft)', color: 'var(--again)' }}
        >
          <Icon name="x" size={18} /> Не помню
        </button>
        <button
          onClick={() => onAnswer(true)}
          className="dc-btn flex items-center gap-2 px-6 py-3"
          style={{ background: 'var(--good-soft)', color: 'var(--good)' }}
        >
          <Icon name="check" size={18} /> Помню
        </button>
      </div>
    </div>
  );
}