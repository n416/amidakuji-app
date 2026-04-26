import React from 'react';

interface CustomConfirmModalProps {
  message: string;
  options: string[];
  onSelect: (option: string | null) => void;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({ message, options, onSelect }) => {
  return (
    <div className="modal" style={{ display: 'block', zIndex: 10001 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <span className="close-button" onClick={() => onSelect(null)}>×</span>
        <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>{message}</p>
        <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '10px' }}>
          {options.map((opt, index) => (
            <button key={index} className={index === 0 ? "primary-action" : "secondary-btn"} onClick={() => onSelect(opt)}>
              {opt}
            </button>
          ))}
          <button className="secondary-btn" onClick={() => onSelect(null)}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
