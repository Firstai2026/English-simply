export function TextField({ label, value, onChange, placeholder, required }) {
    return (
      <label className="block mb-3">
        <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          {label} {required && <span style={{ color: 'var(--again)' }}>*</span>}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full mt-1 px-3 py-2 text-sm"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--ink)' }}
        />
      </label>
    );
  }