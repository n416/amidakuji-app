import React from 'react';

export const Modals: React.FC = () => {
  return (
    <>
      <div id="groupSettingsModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <form onSubmit={(e) => e.preventDefault()}>
            <h3>グループ設定</h3>
            <input type="hidden" id="settingsGroupId" />
            <div className="input-group">
              <label htmlFor="groupNameEditInput">グループ名:</label>
              <input type="text" id="groupNameEditInput" placeholder="グループ名" autoComplete="off" />
            </div>
            <div className="input-group">
              <label htmlFor="customUrlInput">カスタムURL:</label>
              <input type="text" id="customUrlInput" placeholder="例: my-event-2025" autoComplete="off" />
            </div>
            <p className="url-preview">
              <code>/g/<span id="customUrlPreview"></span></code>
            </p>
            <div className="input-group">
              <label htmlFor="groupPasswordInput">合言葉:</label>
              <input type="password" id="groupPasswordInput" placeholder="新規設定・変更時のみ入力" autoComplete="current-password" />
            </div>
            <div className="input-group checkbox-group">
              <input type="checkbox" id="noIndexCheckbox" />
              <label htmlFor="noIndexCheckbox">検索エンジンに表示しない</label>
            </div>
            <div className="modal-actions">
              <button id="deletePasswordButton" className="delete-btn action-left" style={{display: 'none'}}>合言葉を削除</button>
              <button id="saveGroupSettingsButton" className="primary-action">設定を保存</button>
            </div>
          </form>
        </div>
      </div>
      <div id="prizeMasterModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <h3>賞品マスター管理</h3>
          <div className="prize-master-form">
            <div className="prize-master-image-dropzone">
              <label htmlFor="addMasterPrizeImageInput">
                <img id="addMasterPrizeImagePreview" src={undefined} alt="プレビュー" style={{display: 'none'}} />
                <div id="addMasterPrizePlaceholder">
                  <i data-lucide="image-plus"></i>
                  <span>クリックして画像を選択</span>
                </div>
              </label>
              <input type="file" id="addMasterPrizeImageInput" accept="image/*" className="visually-hidden" />
            </div>
            <div className="prize-master-inputs">
              <input type="text" id="addMasterPrizeNameInput" placeholder="新しい賞品名" />
              <div className="prize-rank-selector" data-rank="uncommon">
                <i data-lucide="star" className="lucide-star filled" data-value="miss"></i>
                <i data-lucide="star" className="lucide-star filled" data-value="uncommon"></i>
                <i data-lucide="star" className="lucide-star" data-value="common"></i>
                <i data-lucide="star" className="lucide-star" data-value="rare"></i>
                <i data-lucide="star" className="lucide-star" data-value="epic"></i>
              </div>
              <button id="addMasterPrizeButton" className="primary-action">マスターに追加</button>
            </div>
          </div>
          <ul id="prizeMasterList" className="item-list prize-master-list"></ul>
        </div>
      </div>
      <div id="passwordResetRequestModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <h3>合言葉リセット依頼</h3>
          <ul id="passwordResetRequestList" className="item-list"></ul>
        </div>
      </div>
      <div id="memberEditModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <h3>メンバー編集</h3>
          <input type="hidden" id="memberIdInput" />
          <div className="input-group">
            <label htmlFor="memberNameEditInput">名前:</label>
            <input type="text" id="memberNameEditInput" />
          </div>
          <div className="input-group">
            <label htmlFor="memberColorInput">カラー:</label>
            <input type="color" id="memberColorInput" />
          </div>
          <div className="modal-actions">
            <button id="saveMemberButton" className="primary-action">保存</button>
          </div>
        </div>
      </div>
      <div id="passwordSetModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <form onSubmit={(e) => e.preventDefault()}>
            <h3>合言葉の設定</h3>
            <p>合言葉を設定すると、他の人があなたのアカウントを使うのを防げます。</p>
            <input type="text" autoComplete="username" style={{display: 'none'}} />
            <div className="input-group">
              <label htmlFor="newPasswordInput">新しい合言葉:</label>
              <input type="password" id="newPasswordInput" placeholder="4文字以上" autoComplete="new-password" />
            </div>
            <div className="modal-actions">
              <button id="deleteUserPasswordButton" className="secondary-btn danger action-left" style={{display: 'none'}}>合言葉を削除する</button>
              <button id="savePasswordButton" className="primary-action">設定する</button>
            </div>
          </form>
        </div>
      </div>
      <div id="profileEditModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <h3>プロフィール編集</h3>
          <div className="profile-icon-container">
            <img id="profileIconPreview" src={undefined} alt="Profile Icon" width="100" height="100" />
            <label htmlFor="profileIconInput" className="button">画像を変更...</label>
            <input type="file" id="profileIconInput" accept="image/*" className="visually-hidden" />
          </div>
          <div className="input-group">
            <label htmlFor="profileColorInput">テーマカラー:</label>
            <input type="color" id="profileColorInput" />
          </div>
          <div className="modal-actions">
            <button id="saveProfileButton" className="primary-action">保存する</button>
          </div>
        </div>
      </div>
      <div id="prizeMasterSelectModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <h3>賞品をマスターから選択</h3>
          <ul id="prizeMasterSelectList" className="item-list prize-master-list"></ul>
          <div className="modal-actions">
            <button id="addSelectedPrizesButton" className="primary-action">選択した賞品を追加</button>
          </div>
        </div>
      </div>
      <div id="groupPasswordModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <form onSubmit={(e) => e.preventDefault()}>
            <h3>合言葉の入力</h3>
            <p>グループ「<strong id="verificationTargetGroupName"></strong>」へのアクセスには合言葉が必要です。</p>
            <input type="hidden" id="verificationTargetGroupId" />
            <input type="text" id="groupPasswordUsername" autoComplete="username" style={{display: 'none'}} />
            <div className="input-group">
              <label htmlFor="groupPasswordVerifyInput">合言葉:</label>
              <input type="password" id="groupPasswordVerifyInput" autoComplete="current-password" />
            </div>
            <div className="modal-actions">
              <button id="verifyPasswordButton" className="primary-action">認証</button>
            </div>
          </form>
        </div>
      </div>
      <div id="bulkRegisterModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <h3>メンバーの一括登録</h3>
          <div id="bulk-step1-input">
            <label htmlFor="bulkNamesTextarea">登録したいメンバーの名前を、改行・スペース・カンマ区切りでテキストエリアに貼り付けてください。</label>
            <textarea id="bulkNamesTextarea" rows={10} placeholder="佐藤 太郎, 鈴木 一郎, ..."></textarea>
            <div className="modal-actions">
              <button id="analyzeBulkButton" className="primary-action">確認する</button>
            </div>
          </div>
          <div id="bulk-step2-preview" style={{display: 'none'}}>
            <p>入力された名前を分析しました。内容を確認し、登録を実行してください。</p>
            <div className="tabs">
              <button className="tab-link active" data-tab="newRegistrationTab">新規登録</button>
              <button className="tab-link" data-tab="potentialMatchTab">類似候補</button>
              <button className="tab-link" data-tab="exactMatchTab">完全一致</button>
            </div>
            <div id="newRegistrationTab" className="tab-content active"></div>
            <div id="potentialMatchTab" className="tab-content"></div>
            <div id="exactMatchTab" className="tab-content"></div>
            <div className="modal-actions">
              <button id="finalizeBulkButton" className="primary-action" disabled>この内容で登録を実行する</button>
            </div>
          </div>
        </div>
      </div>
      <div id="prizeBulkAddModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <h3>景品の一括登録・編集</h3>
          <p>景品リストを編集し、「リストを更新」ボタンを押してください。</p>
          <textarea id="prizeBulkTextarea" rows={10}></textarea>
          <div className="modal-actions">
            <button id="cancelBulkAddButton" className="secondary-btn">キャンセル</button>
            <button id="clearBulkPrizesButton" className="secondary-btn action-left">クリア</button>
            <button id="updatePrizesFromTextButton" className="primary-action">リストを更新</button>
          </div>
        </div>
      </div>
      <div id="addPrizeModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <h3>景品の追加</h3>
          <div className="input-group">
            <label>景品名:</label>
            <input type="text" id="newPrizeNameInput" placeholder="景品名を入力" />
          </div>
          <div className="input-group">
            <label>画像:</label>
            <input type="file" id="newPrizeImageInput" accept="image/*" />
          </div>
          <div className="prize-rank-selector" data-rank="uncommon">
            <i data-lucide="star" className="lucide-star filled" data-value="miss"></i>
            <i data-lucide="star" className="lucide-star filled" data-value="uncommon"></i>
            <i data-lucide="star" className="lucide-star" data-value="common"></i>
            <i data-lucide="star" className="lucide-star" data-value="rare"></i>
            <i data-lucide="star" className="lucide-star" data-value="epic"></i>
          </div>
          <img id="newPrizeImagePreview" src={undefined} alt="Image Preview" style={{maxWidth: '100px', maxHeight: '100px', display: 'none'}} />
          <div className="modal-actions">
            <button id="callMasterButton" className="secondary-btn action-left">マスターから呼び出し</button>
            <button id="addPrizeOkButton" className="primary-action">追加</button>
          </div>
        </div>
      </div>
      <div id="summaryModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <h3>景品集計</h3>
          <p>合計: <span id="totalPrizes"></span>個</p>
          <ul id="prizeSummaryList"></ul>
        </div>
      </div>
      <div id="fillSlotsModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <span className="close-button"><i data-lucide="x"></i></span>
          <h3>参加枠を埋める</h3>
          <p>現在 <strong id="emptySlotCount">0</strong> 件の空き枠があります。</p>
          <div id="fillSlotsStep1">
            <h4>ステップ1：未参加のアクティブメンバー</h4>
            <ul id="unjoinedMemberList" className="item-list" style={{maxHeight: '200px', overflowY: 'auto'}}>
              <li>読み込み中...</li>
            </ul>
            <div className="modal-actions">
              <button id="selectMembersButton" className="primary-action">メンバーをランダム選出</button>
            </div>
          </div>
          <div id="fillSlotsStep2" style={{display: 'none'}}>
            <h4>ステップ2：選出されたメンバー</h4>
            <ul id="selectedMemberList" className="item-list"></ul>
            <div className="modal-actions">
              <button id="confirmFillSlotsButton" className="primary-action">このメンバーで枠を埋める</button>
            </div>
          </div>
        </div>
      </div>
      <div id="imageCropperModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content large">
          <span className="close-button" id="cancelCropButton"><i data-lucide="x"></i></span>
          <h3>画像の編集</h3>
          <p>画像をドラッグして位置を調整し、ホイールで拡大・縮小してください。</p>
          <div className="cropper-container">
            <img id="cropperImage" src={undefined} />
          </div>
          <div className="modal-actions">
            <button id="confirmCropButton" className="primary-action">決定</button>
          </div>
        </div>
      </div>
      <div id="customConfirmModal" className="modal" style={{display: 'none'}}>
        <div className="modal-content">
          <p id="customConfirmMessage" style={{marginBottom: '24px', fontSize: '16px', lineHeight: '1.6'}}></p>
          <div id="customConfirmButtons" className="modal-actions" style={{justifyContent: 'flex-end'}}></div>
        </div>
      </div>
      <div className="settings-fab" id="settingsFab" title="設定">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.82l-.15-.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0-2.82l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </div>
      <div className="settings-panel" id="settingsPanel">
        <h4>表示設定</h4>
        <div className="setting-item">
          <label htmlFor="animationToggle">背景アニメーション</label>
          <label className="switch">
            <input type="checkbox" id="animationToggle" />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="setting-item theme-switcher">
          <label>テーマ</label>
          <div className="radio-group">
            <input type="radio" id="theme-auto" name="theme" value="auto" />
            <label htmlFor="theme-auto">自動</label>
            <input type="radio" id="theme-light" name="theme" value="light" />
            <label htmlFor="theme-light">ライト</label>
            <input type="radio" id="theme-dark" name="theme" value="dark" />
            <label htmlFor="theme-dark">ダーク</label>
          </div>
        </div>
      </div>
    </>
  );
};
