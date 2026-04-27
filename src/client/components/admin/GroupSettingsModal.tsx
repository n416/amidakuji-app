import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import * as api from '../../lib/api';

interface GroupSettingsModalProps {
  settingsGroup: any;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
  setToastMessage: (msg: string) => void;
  setConfirmDialog: (dialog: { message: string, onConfirm: () => void } | null) => void;
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  settingsGroup,
  onClose,
  onSaved,
  onDeleted,
  setToastMessage,
  setConfirmDialog
}) => {
  const [settingsData, setSettingsData] = useState({ name: '', customUrl: '', noIndex: false, password: '' });
  const [localSettingsGroup, setLocalSettingsGroup] = useState<any>(null);

  useEffect(() => {
    if (settingsGroup) {
      setLocalSettingsGroup(settingsGroup);
      setSettingsData({
        name: settingsGroup.name || '',
        customUrl: settingsGroup.customUrl || '',
        noIndex: settingsGroup.noIndex || false,
        password: ''
      });
    }
  }, [settingsGroup]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: settingsData.name.trim(),
        customUrl: settingsData.customUrl.trim(),
        noIndex: settingsData.noIndex
      };
      if (settingsData.password) payload.password = settingsData.password;
      
      await api.updateGroupSettings(settingsGroup.id, payload);
      
      setToastMessage('設定を保存しました。');
      onSaved();
    } catch (e) {
      setToastMessage('設定の保存に失敗しました。');
    }
  };

  const handleDeleteGroup = () => {
    setConfirmDialog({
      message: `グループ「${localSettingsGroup.name}」を削除しますか？\n関連するすべてのイベントも削除され、元に戻せません。`,
      onConfirm: async () => {
        try {
          await api.deleteGroup(settingsGroup.id);
          setToastMessage('グループを削除しました。');
          if (onDeleted) {
            onDeleted();
          } else {
            onSaved();
          }
        } catch (e: any) {
          setToastMessage(e.message || 'グループの削除に失敗しました。');
        }
      }
    });
  };

  const handleDeletePassword = () => {
    setConfirmDialog({
      message: '本当にこのグループの合言葉を削除しますか？',
      onConfirm: async () => {
        try {
          await api.deleteGroupPassword(settingsGroup.id);
          setToastMessage('合言葉を削除しました。');
          setLocalSettingsGroup((prev: any) => ({...prev, hasPassword: false}));
          onSaved();
        } catch (e) {
          setToastMessage('合言葉の削除に失敗しました。');
        }
      }
    });
  };

  if (!localSettingsGroup) return null;

  return (
    <div id="groupSettingsModal" className="modal active">
      <div className="modal-content">
        <span className="close-button" onClick={onClose}><X /></span>
        <form onSubmit={handleSaveSettings}>
          <h3>グループ設定: <span>{localSettingsGroup.name}</span></h3>
          <div className="input-group">
            <label htmlFor="groupNameEditInput">グループ名:</label>
            <input type="text" id="groupNameEditInput" value={settingsData.name} onChange={e => setSettingsData({...settingsData, name: e.target.value})} required placeholder="グループ名" autoComplete="off" />
          </div>
          <div className="input-group">
            <label htmlFor="customUrlInput">カスタムURL:</label>
            <input type="text" id="customUrlInput" value={settingsData.customUrl} onChange={e => setSettingsData({...settingsData, customUrl: e.target.value})} pattern="^[a-zA-Z0-9\-]+$" title="半角英数字とハイフンのみ使用できます" placeholder="例: my-event-2025" autoComplete="off" />
          </div>
          <p className="url-preview">
            <code>/g/<span>{settingsData.customUrl}</span></code>
          </p>
          <div className="input-group">
            <label htmlFor="groupPasswordInput">合言葉:</label>
            <div className="flex-gap-8">
              <input 
                type="password" 
                id="groupPasswordInput" 
                value={settingsData.password} 
                onChange={e => setSettingsData({...settingsData, password: e.target.value})} 
                placeholder={localSettingsGroup.hasPassword ? "新規設定・変更のみ入力（現在設定済）" : "新規設定・変更のみ入力"}
                autoComplete="current-password"
                className="flex-1"
              />
              <button 
                type="button" 
                className="secondary-btn" 
                onClick={() => setSettingsData({...settingsData, password: ''})}
                title="入力をクリア"
              >
                クリア
              </button>
            </div>
          </div>
          <div className="input-group checkbox-group">
            <input type="checkbox" id="noIndexCheckbox" checked={settingsData.noIndex} onChange={e => setSettingsData({...settingsData, noIndex: e.target.checked})} />
            <label htmlFor="noIndexCheckbox">検索エンジンにインデックスさせない (noindex)</label>
          </div>

          <div className="modal-actions">
            <div className="action-left flex-gap-8">
              <button type="button" className="delete-btn" onClick={handleDeleteGroup}>
                グループ削除
              </button>
              {localSettingsGroup.hasPassword && (
                <button type="button" id="deletePasswordButton" className="secondary-btn" onClick={handleDeletePassword}>
                  合言葉削除
                </button>
              )}
            </div>
            <button type="submit" id="saveGroupSettingsButton" className="primary-action">設定保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};
