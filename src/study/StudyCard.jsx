import { useState, useRef, useEffect } from 'react';
import { Icon } from '../components/Icon.jsx';
import { playPronunciation } from '../utils/voice.js';
export function StudyCard({
  card,
  media,
  direction,
  flipped,
  onFlip,
  onAnswer,
  }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const movedRef = useRef(false);
  const isReverse = direction === 'reverse';
  const frontText = isReverse ? card.back : card.front;
  const backText = isReverse ? card.front : card.back;
  const frontExample = isReverse ? card.exampleRu : card.exampleEn;
  const backExample = isReverse ? card.exampleEn : card.exampleRu;
  useEffect(() => {
  if (!isReverse && (!card.hasAudio || media !== undefined)) {
    playPronunciation(card, media);
  }
}, [card.id, direction, media]);

useEffect(() => {
  if (isReverse && flipped) playPronunciation(card, media);
}, [flipped]);

function getClientX(e) {
  if (typeof e.clientX === 'number') return e.clientX;
  if (e.touches && e.touches[0]) return e.touches[0].clientX;
  return 0;
}

function onDown(e) {
  setDragging(true);
  movedRef.current = false;
  startX.current = getClientX(e);
}

function onMove(e) {
  if (!dragging) return;
  const x = getClientX(e);
  const dx = x - startX.current;
  if (Math.abs(dx) > 4) movedRef.current = true;
  setDragX(dx);
}

function onUp() {
  if (!dragging) return;
  setDragging(false);

  if (dragX > 100) {
    fly(true);
  } else if (dragX < -100) {
    fly(false);
  } else {
    setDragX(0);
    if (!movedRef.current) onFlip();
  }
}

function fly(knew) {
  setDragX(knew ? 700 : -700);

  setTimeout(() => {
    onAnswer(knew);
    setDragX(0);
  }, 180);
}

  const rotation = dragX / 22;
  const tintOpacity = Math.min(Math.abs(dragX) / 140, 0.85);

  return (
    <div className="flip-scene mx-auto" style={{ width: '100%', maxWidth: 360, height: 420 }}>
      <div
        className={`flip-card ${flipped ? 'is-flipped' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          transform: `translateX(${dragX}px) rotate(${rotation}deg) ${flipped ? 'rotateY(180deg)' : ''}`,
          transition: dragging ? 'none' : undefined,
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'pan-y',
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        {/* front */}
        <div className="flip-face dc-surface flex flex-col items-center justify-center p-6" style={{ boxShadow: '0 8px 30px rgba(28,27,41,0.06)' }}>
          {dragX !== 0 && (
            <div
              className="flip-face"
              style={{
                background: dragX > 0 ? 'var(--good)' : 'var(--again)',
                opacity: tintOpacity * 0.12,
                pointerEvents: 'none',
              }}
            />
          )}
          {isReverse && (
            <span
              className="dc-mono text-xs px-2 py-0.5 rounded-full mb-3"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              RU → EN
            </span>
          )}
          {media && media.image && (
            <img
              src={media.image}
              alt=""
              className="rounded-2xl mb-5"
              style={{ width: '100%', maxHeight: 160, objectFit: 'cover' }}
            />
          )}
          <p className="dc-display font-semibold text-center" style={{ fontSize: 28 }}>{frontText}</p>
          {frontExample && (
            <p className="text-sm text-center mt-3" style={{ color: 'var(--ink-soft)', maxWidth: 280 }}>{frontExample}</p>
          )}
          {!isReverse && (
  <div className="mt-5 flex items-center gap-2">
    <button
  className="dc-btn dc-tappable flex items-center justify-center"
  style={{
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--accent-soft)',
    color: 'var(--accent)',
  }}
  onClick={(e) => {
    e.stopPropagation();
    playPronunciation(card, media);
  }}
  onPointerDown={(e) => e.stopPropagation()}
  aria-label="Произнести"
>
  <Icon name="volume2" size={20} />
</button>
</div>
)}
          <p className="text-xs mt-6" style={{ color: 'var(--ink-faint)' }}>нажмите или смахните</p>
        </div>

        {/* back */}
        <div className="flip-face flip-face-back dc-surface flex flex-col items-center justify-center p-6 text-center" style={{ boxShadow: '0 8px 30px rgba(28,27,41,0.06)' }}>
          <p className="dc-display font-semibold" style={{ fontSize: 26, color: 'var(--accent)' }}>{backText}</p>
          {isReverse && (
  <button
    className="dc-btn dc-tappable mt-3 flex items-center justify-center"
    style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: 'var(--accent-soft)',
      color: 'var(--accent)',
    }}
    onClick={(e) => {
      e.stopPropagation();
      playPronunciation(card, media);
    }}
  >
    <Icon name="volume2" size={18} />
  </button>
)}

{backExample && (
            <p className="text-sm mt-5" style={{ color: 'var(--ink-soft)', maxWidth: 280 }}>{backExample}</p>
          )}
        </div>
      </div>
    </div>
  );
}