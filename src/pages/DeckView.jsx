import { useState, useRef, useMemo } from 'react';
import { Icon } from '../components/Icon.jsx';
import { IconBtn } from '../components/IconBtn.jsx';
import { isDue, isReverseDue, boxOf, reverseBoxOf, isReverseUnlocked, LEARNED_BOX } from '../utils/srs.js';

export function DeckView({ deck, deckCards, onStartStudy, onStartPractice, onStartMatch, onStartMatchChoice, onStartListening, onAddCard, onEditCard, onDeleteCard, onResetCard, onForceDue, onDeleteDeck }) {
  const dueCount = deckCards.reduce((sum, c) => sum + (isDue(c) ? 1 : 0) + (isReverseDue(c) ? 1 : 0), 0);
  const graduatedCount = deckCards.filter((c) => boxOf(c) >= LEARNED_BOX).length;
  const [confirmKey, setConfirmKey] = useState(null);
  const confirmTimer = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return deckCards;
    return deckCards.filter((c) =>
      c.front.toLowerCase().includes(q) ||
      c.back.toLowerCase().includes(q) ||
      (c.exampleEn && c.exampleEn.toLowerCase().includes(q)) ||
      (c.exampleRu && c.exampleRu.toLowerCase().includes(q))
    );
  }, [deckCards, searchQuery]);

  function armOrRun(key, action) {
    if (confirmKey === key) {
      clearTimeout(confirmTimer.current);
      setConfirmKey(null);
      action();
    } else {
      setConfirmKey(key);
      clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmKey(null), 3000);
    }
  }

  return (
    <div className="px-5 pb-8">
      <div className="dc-surface p-5 mb-5">
        {dueCount > 0 ? (
          <>
            <p className="dc-display text-base font-semibold mb-1">Готово к повторению</p>
            <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)' }}>
              {dueCount} {dueCount === 1 ? 'карточка ждёт' : 'карточек ждут'} повторения
            </p>
            <button
              onClick={onStartStudy}
              className="dc-btn w-full py-3 text-sm"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Учить ({dueCount})
            </button>
          </>
        ) : (
          <>
            <p className="dc-display text-base font-semibold mb-1">Всё повторено ✓</p>
            <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)' }}>
              На сегодня карточек к повторению нет.
            </p>
            {deckCards.length > 0 && (
              <button
                onClick={onStartPractice}
                className="dc-btn w-full py-3 text-sm"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                Повторить всё ещё раз
              </button>
            )}
          </>
        )}
      </div>

      {deckCards.length >= 4 && (
        <button
          onClick={() => onStartMatch(false)}
          className="dc-btn w-full py-3 text-sm mb-3 flex items-center justify-center gap-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
        >
          <Icon name="arrowLeftRight" size={16} style={{ color: 'var(--accent)' }} /> Связки слов
        </button>
      )}

      {deckCards.length >= 8 && (
        <button
          onClick={() => onStartMatch(true)}
          className="dc-btn w-full py-3 text-sm mb-3 flex items-center justify-center gap-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
        >
          <Icon name="arrowLeftRight" size={16} style={{ color: 'var(--again)' }} /> Связки слов (сложнее)
        </button>
      )}

      {deckCards.length >= 4 && (
        <button
          onClick={onStartMatchChoice}
          className="dc-btn w-full py-3 text-sm mb-5 flex items-center justify-center gap-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
        >
          <Icon name="arrowLeftRight" size={16} style={{ color: 'var(--gold)' }} /> Связки слов (уровень 3)
        </button>
      )}

      {graduatedCount >= 4 ? (
        <button
          onClick={onStartListening}
          className="dc-btn w-full py-3 text-sm mb-5 flex items-center justify-center gap-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
        >
          <Icon name="volume2" size={16} style={{ color: 'var(--accent)' }} /> На слух
        </button>
      ) : (
        deckCards.length > 0 && (
          <p className="text-xs text-center mb-5" style={{ color: 'var(--ink-faint)' }}>
            «На слух» откроется, когда выучите хотя бы 4 слова
          </p>
        )
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          {searchQuery.trim()
            ? `${filteredCards.length} из ${deckCards.length}`
            : `${deckCards.length} ${deckCards.length === 1 ? 'карточка' : 'карточек'}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddCard}
            className="dc-btn flex items-center gap-1.5 px-3 py-2 text-sm"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Icon name="plus" size={16} /> Карточка
          </button>
          <IconBtn
            label={confirmKey === 'deck' ? 'Точно удалить колоду?' : 'Удалить колоду'}
            size="sm"
            tone={confirmKey === 'deck' ? 'again' : 'ghost'}
            onClick={() => armOrRun('deck', () => onDeleteDeck())}
          >
            <Icon name="trash2" size={16} />
          </IconBtn>
        </div>
      </div>

      {deckCards.length > 0 && (
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по карточкам…"
          className="w-full mb-3 px-3 py-2 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--ink)' }}
        />
      )}

      {deckCards.length === 0 ? (
        <div className="dc-surface p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Добавьте первую карточку, чтобы начать учить эту колоду.
          </p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="dc-surface p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Ничего не найдено по запросу «{searchQuery.trim()}».
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredCards.map((card) => {
            const box = boxOf(card);
            const mastered = box >= LEARNED_BOX;
            const revUnlocked = isReverseUnlocked(card);
            const revBox = reverseBoxOf(card);
            const notActiveYet = !isDue(card);
            return (
              <div key={card.id} className="dc-surface flex items-center justify-between px-4 py-3 gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{card.front}</p>
                    {mastered && (
                      <span
                        className="dc-mono text-xs px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: 'var(--good-soft)', color: 'var(--good)' }}
                      >
                        выучено
                      </span>
                    )}
                    {card.hasImage && <Icon name="imagePlus" size={13} style={{ color: 'var(--ink-faint)' }} />}
                    {card.hasAudio && <Icon name="music" size={13} style={{ color: 'var(--ink-faint)' }} />}
                  </div>
                  <p className="text-sm truncate" style={{ color: 'var(--ink-soft)' }}>{card.back}</p>
                  <div className="mastery-dots mt-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`mastery-dot ${i <= box ? 'filled' : ''}`} />
                    ))}
                  </div>
                  {revUnlocked && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Icon name="arrowLeftRight" size={11} style={{ color: 'var(--accent)' }} />
                      <span className="dc-mono text-xs" style={{ color: 'var(--accent)' }}>RU→EN</span>
                      <div className="mastery-dots">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span key={i} className={`mastery-dot ${i <= revBox ? 'filled' : ''}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-stretch gap-1 shrink-0" style={{ minWidth: 84 }}>
                  <button
                    onClick={() => onEditCard(card)}
                    className="dc-btn dc-tappable flex items-center justify-center gap-1 px-2 py-1.5 text-xs"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink-soft)' }}
                  >
                    <Icon name="pencil" size={12} /> Изменить
                  </button>
                  {notActiveYet && (
                    <button
                      onClick={() => onForceDue(card.id)}
                      className="dc-btn dc-tappable flex items-center justify-center gap-1 px-2 py-1.5 text-xs"
                      style={{ background: 'var(--good-soft)', color: 'var(--good)' }}
                    >
                      <Icon name="arrowUp" size={12} /> Учить
                    </button>
                  )}
                  {mastered ? (
                    <button
                      onClick={() => armOrRun('reset:' + card.id, () => onResetCard(card.id))}
                      className="dc-btn dc-tappable flex items-center justify-center gap-1 px-2 py-1.5 text-xs"
                      style={
                        confirmKey === 'reset:' + card.id
                          ? { background: 'var(--accent)', color: '#fff' }
                          : { background: 'var(--accent-soft)', color: 'var(--accent)' }
                      }
                    >
                      <Icon name="rotateCcw" size={12} /> {confirmKey === 'reset:' + card.id ? 'Точно?' : 'Вернуть'}
                    </button>
                  ) : (
                    <button
                      onClick={() => armOrRun('delete:' + card.id, () => onDeleteCard(card.id))}
                      className="dc-btn dc-tappable flex items-center justify-center gap-1 px-2 py-1.5 text-xs"
                      style={
                        confirmKey === 'delete:' + card.id
                          ? { background: 'var(--again)', color: '#fff' }
                          : { background: 'var(--again-soft)', color: 'var(--again)' }
                      }
                    >
                      <Icon name="trash2" size={12} /> {confirmKey === 'delete:' + card.id ? 'Точно?' : 'Удалить'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}