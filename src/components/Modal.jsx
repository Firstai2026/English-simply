import { Icon } from './Icon.jsx';
import { IconBtn } from './IconBtn.jsx';

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-5"
      style={{ background: 'rgba(28,27,41,0.35)', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        className="dc-surface w-full sm:max-w-md p-5"
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '88vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="dc-display font-semibold text-base">{title}</p>
          <IconBtn label="Закрыть" size="sm" tone="ghost" onClick={onClose}>
            <Icon name="x" size={18} />
          </IconBtn>
        </div>
        {children}
      </div>
    </div>
  );
}