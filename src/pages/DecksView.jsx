import { useMemo } from 'react';
import { Icon } from '../components/Icon.jsx';
import { isDue, isReverseDue } from '../utils/srs.js';

export function DecksView({ decks, cards, onOpenDeck, onNewDeck, onExportAll, onImportFile, importError }) {
  const dueByDeck = useMemo(() => {
    const m = {};
    decks.forEach((d) => {
      m[d.id] = cards.filter((c) => c.deckId === d.id).reduce(
        (sum, c) => sum + (isDue(c) ? 1 : 0) + (isReverseDue(c) ? 1 : 0),
        0
      );
    });
    return m;
  }, [decks, cards]);

  return (
    <div className="px-5 pb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          {decks.length} {decks.length === 1 ? 'колода' : 'колод'}
        </p>
        <button
          onClick={onNewDeck}
          className="dc-btn flex items-center gap-1.5 px-3 py-2 text-sm"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Icon name="plus" size={16} /> Новая колода
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="dc-surface p-8 text-center mt-6">
          <p className="dc-display text-base mb-1">Пока нет колод</p>
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Создайте первую колоду, чтобы начать учить слова.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {decks.map((deck) => {
            const total = cards.filter((c) => c.deckId === deck.id).length;
            const due = dueByDeck[deck.id] || 0;
            return (
              <button
                key={deck.id}
                onClick={() => onOpenDeck(deck.id)}
                className="dc-surface dc-tappable flex items-center justify-between px-4 py-4 text-left"
              >
                <div>
                  <p className="dc-display font-semibold text-base">{deck.name}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                    {total} {total === 1 ? 'карточка' : 'карточек'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {due > 0 && (
                    <span
                      className="dc-mono text-xs px-2 py-1 rounded-full"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      {due} к повторению
                    </span>
                  )}
                  <Icon name="chevronRight" size={18} style={{ color: 'var(--ink-faint)' }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs mb-2" style={{ color: 'var(--ink-faint)' }}>
          Перенос на другое устройство (со своим прогрессом)
        </p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={onExportAll} className="dc-tappable text-xs" style={{ color: 'var(--accent)' }}>
            Экспортировать всё
          </button>
          <span style={{ color: 'var(--border)' }}>·</span>
          <label className="dc-tappable text-xs cursor-pointer" style={{ color: 'var(--accent)' }}>
            Импортировать файл
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) onImportFile(f);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>
        </div>
        {importError && (
          <p className="text-xs mt-2" style={{ color: 'var(--again)' }}>{importError}</p>
        )}
      </div>
    </div>
  );
}