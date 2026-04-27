import React from 'react';

interface CustomConfirmModalProps {
  message: string;
  options: string[];
  onSelect: (option: string | null) => void;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({ message, options, onSelect }) => {
  return (
    <div className="modal active z-10001">
      <div className="modal-content max-w-400">
        <span className="close-button" onClick={() => onSelect(null)}>×</span>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions center gap-15">
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
