import { Icon } from './Icon.jsx';

export function IconBtn({ onClick, children, label, tone = 'default', size = 'md', disabled }) {
  const sizes = { sm: 32, md: 40, lg: 56 };
  const s = sizes[size];
  const tones = {
    default: { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' },
    accent: { background: 'var(--accent)', color: '#fff', border: 'none' },
    good: { background: 'var(--good)', color: '#fff', border: 'none' },
    again: { background: 'var(--again)', color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: 'var(--ink-soft)', border: 'none' },
  };
  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="dc-btn dc-tappable"
      style={{
        width: s,
        height: s,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
        ...tones[tone],
      }}
    >
      {children}
    </button>
  );
}