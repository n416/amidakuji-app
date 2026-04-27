import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setPasswordRequests } from '../../store/adminSlice';
import { X } from 'lucide-react';
import * as api from '../../lib/api';

interface PasswordRequestsModalProps {
  groupId: string;
  onClose: () => void;
  setToastMessage: (msg: string) => void;
  setConfirmDialog: (dialog: { message: string, onConfirm: () => void } | null) => void;
  onRefresh: () => void;
}

export const PasswordRequestsModal: React.FC<PasswordRequestsModalProps> = ({
  groupId,
  onClose,
  setToastMessage,
  setConfirmDialog,
  onRefresh
}) => {
  const dispatch = useDispatch();
  const passwordRequests = useSelector((state: RootState) => state.admin.passwordRequests);

  const handleApprovePasswordReset = (memberId: string, requestId: string) => {
    setConfirmDialog({
      message: 'このユーザーの合言葉を削除しますか？',
      onConfirm: async () => {
        try {
          await api.approvePasswordReset(memberId, groupId, requestId);
          setToastMessage('合言葉を削除しました。');
          onRefresh();
          if (passwordRequests.length <= 1) {
            onClose();
          }
        } catch (e) {
          setToastMessage('削除に失敗しました');
        }
      }
    });
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}><X size={28} /></span>
        <h3>合言葉リセット依頼</h3>
        <p>以下のユーザーが合言葉を忘れたため、リセット（削除）を依頼しています。</p>
        <ul className="item-list">
          {passwordRequests.map(req => (
            <li key={req.id} className="item-list-item flex-center-between">
              <span>{req.memberName}</span>
              <button className="primary-action" onClick={() => handleApprovePasswordReset(req.memberId, req.id)}>削除を承認</button>
            </li>
          ))}
          {passwordRequests.length === 0 && <li>リセット依頼はありません。</li>}
        </ul>
      </div>
    </div>
  );
};
