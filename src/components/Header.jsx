import { Icon } from './Icon.jsx';
import { IconBtn } from './IconBtn.jsx';

export function Header({ title, onBack, onStats, streakCount, showStreak, version }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        {onBack ? (
          <IconBtn label="Назад" size="sm" onClick={onBack}>
            <Icon name="arrowLeft" size={18} />
          </IconBtn>
        ) : (
          <div style={{ width: 32 }} />
        )}
        <div className="flex items-center gap-2">
          <h1 className="dc-display text-lg font-semibold">{title}</h1>
          {version && (
            <span className="dc-mono text-xs" style={{ color: 'var(--ink-faint)' }}>v{version}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showStreak && streakCount > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-sm dc-mono"
            style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
          >
            <Icon name="flame" size={15} />
            <span>{streakCount}</span>
          </div>
        )}
        {onStats && (
          <IconBtn label="Статистика" size="sm" onClick={onStats}>
            <Icon name="barChart3" size={18} />
          </IconBtn>
        )}
      </div>
    </div>
  );
}