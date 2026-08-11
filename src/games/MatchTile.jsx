import { Icon } from '../components/Icon.jsx';

export function MatchTile({ label, image, state, onClick }) {
  const styles = {
    default: { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' },
    selected: { background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)' },
    matched: { background: 'var(--good-soft)', border: '1px solid var(--good)', color: 'var(--good)', opacity: 0.6 },
    wrong: { background: 'var(--again-soft)', border: '1px solid var(--again)', color: 'var(--again)' },
  };
  return (
    <button
      onClick={onClick}
      disabled={state === 'matched'}
      className="dc-btn dc-tappable flex items-center gap-2 px-3 py-3 text-sm"
      style={{ ...styles[state], width: '100%', textAlign: 'left', minHeight: 52, cursor: state === 'matched' ? 'default' : 'pointer' }}
    >
      {image && (
        <img src={image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
      )}
      <span className="truncate">{label}</span>
      {state === 'matched' && <Icon name="check" size={14} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
    </button>
  );
}