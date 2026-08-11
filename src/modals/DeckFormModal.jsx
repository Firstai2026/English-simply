import { useState } from 'react';
import { Modal } from '../components/Modal.jsx';
import { TextField } from '../components/TextField.jsx';

export function DeckFormModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  return (
    <Modal title="Новая колода" onClose={onClose}>
      <TextField label="Название колоды" value={name} onChange={setName} placeholder="Например, Путешествия" required />
      <button
        disabled={!name.trim()}
        onClick={() => onSave(name)}
        className="dc-btn w-full py-3 mt-2 text-sm"
        style={{ background: 'var(--accent)', color: '#fff', opacity: name.trim() ? 1 : 0.5 }}
      >
        Создать
      </button>
    </Modal>
  );
}