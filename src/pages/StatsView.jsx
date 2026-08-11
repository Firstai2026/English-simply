import { Icon } from '../components/Icon.jsx';

export function StatsView({ stats, streak, overallAccuracy, problemWords, onStartMixed }) {
  const rows = [
    { label: 'Новые', value: stats.neu, color: 'var(--ink-faint)' },
    { label: 'Учатся', value: stats.learning, color: 'var(--accent)' },
    { label: 'Выучены', value: stats.mastered, color: 'var(--good)' },
    { label: 'Открыта обратная сторона (RU → EN)', value: stats.reverseUnlocked, color: 'var(--gold)' },
  ];
  const maxVal = Math.max(1, stats.neu, stats.learning, stats.mastered, stats.reverseUnlocked);
  const topProblems = problemWords.slice(0, 10);
  const maxWrong = Math.max(1, ...topProblems.map((c) => c.wrongCount || 0));

  return (
    <div className="px-5 pb-8">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="dc-surface p-4">
          <p className="dc-mono text-2xl font-semibold">{stats.total}</p>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>всего карточек</p>
        </div>
        <div className="dc-surface p-4">
          <p className="dc-mono text-2xl font-semibold" style={{ color: 'var(--accent)' }}>{stats.dueToday}</p>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>к повторению сегодня</p>
        </div>
      </div>

      <div className="dc-surface p-4 mb-3 flex items-center gap-3">
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold-soft)', color: 'var(--gold)' }}
        >
          <Icon name="flame" size={22} />
        </div>
        <div>
          <p className="dc-mono text-xl font-semibold">{streak.count}</p>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            {streak.count === 1 ? 'день подряд' : 'дней подряд'}
          </p>
        </div>
      </div>

      {overallAccuracy !== null && (
        <div className="dc-surface p-4 mb-3">
          <p className="dc-mono text-2xl font-semibold" style={{ color: 'var(--good)' }}>{overallAccuracy}%</p>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>правильных ответов за всё время</p>
        </div>
      )}

      <div className="dc-surface p-4 mb-3">
        <p className="text-sm font-medium mb-3">Прогресс изучения</p>
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span style={{ color: 'var(--ink-soft)' }}>{r.label}</span>
                <span className="dc-mono">{r.value}</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ height: '100%', width: `${(r.value / maxVal) * 100}%`, borderRadius: 4, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {topProblems.length > 0 && (
        <div className="dc-surface p-4">
          <p className="text-sm font-medium mb-3">Проблемные слова</p>
          <div className="flex flex-col gap-2 mb-4">
            {topProblems.map((c) => (
              <div key={c.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="truncate">{c.front} — {c.back}</span>
                  <span className="dc-mono shrink-0" style={{ color: 'var(--again)' }}>{c.wrongCount}</span>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${((c.wrongCount || 0) / maxWrong) * 100}%`,
                      borderRadius: 4,
                      background: 'var(--again)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onStartMixed}
            className="dc-btn w-full py-3 text-sm"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Начать тренировку
          </button>
          {problemWords.length < 4 && (
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--ink-faint)' }}>
              Обычные карточки, «на слух» и связки слов появятся по очереди, когда наберётся хотя бы 4 проблемных слова.
            </p>
          )}
        </div>
      )}
    </div>
  );
}