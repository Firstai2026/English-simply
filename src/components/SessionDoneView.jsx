import { Icon } from '../components/Icon.jsx';

export function SessionDoneView({ reviewedCount, streakCount, onDone }) {
  return (
    <div className="px-5 pb-8 flex flex-col items-center justify-center text-center" style={{ minHeight: '70vh' }}>
      <div
        className="flex items-center justify-center mb-5"
        style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--good-soft)', color: 'var(--good)' }}
      >
        <Icon name="check" size={32} />
      </div>
      <p className="dc-display text-xl font-semibold mb-1">Сессия завершена</p>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>
        Повторено карточек: {reviewedCount}
      </p>
      {streakCount > 0 && (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm dc-mono mb-6"
          style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
        >
          <Icon name="flame" size={16} /> {streakCount} {streakCount === 1 ? 'день подряд' : 'дней подряд'}
        </div>
      )}
      <button onClick={onDone} className="dc-btn px-6 py-3" style={{ background: 'var(--accent)', color: '#fff' }}>
        Готово
      </button>
    </div>
  );
}