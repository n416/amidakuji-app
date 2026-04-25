import React, { useState } from 'react';
import { Home, Plus, HelpCircle, ChevronDown, User, Settings, Trophy, Users } from 'lucide-react';

export const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  // ログイン状態や現在グループなどのステートは後続フェーズで Context/Zustand に移行します
  const isLoggedIn = false; 

  return (
    <div id="header-container">
      {/* 既存のインパーソネーションバナー（必要に応じて表示） */}
      <div className="impersonation-banner" style={{ display: 'none', backgroundColor: '#ffeeb0', padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#333', zIndex: 1000, position: 'relative' }}>
        <span id="impersonationBannerText">現在、別のユーザーとして操作中です。</span>
        <button id="stopImpersonatingButton" className="button-secondary" style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '0.9em', cursor: 'pointer' }}>元の管理者に戻る</button>
      </div>

      <header className="main-header">
        <h1>ダイナミックあみだくじ</h1>
        
        <button 
          id="hamburger-button" 
          aria-label="メニューを開く" 
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div id="nav-menu" className={menuOpen ? 'open' : ''}>
          <a href="/" className="button header-icon-button" title="ホーム">
            <Home size={18} />
            <span>ホーム</span>
          </a>

          {isLoggedIn && (
            <div className="group-switcher-container">
              <label className="group-switcher-label">グループ選択</label>
              <div id="groupSwitcher" onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}>
                <button id="currentGroupName">マングループ</button>
                {groupDropdownOpen && (
                  <div className="dropdown-content" style={{ display: 'block' }}>
                    <ul id="switcherGroupList">
                      <li>グループA</li>
                    </ul>
                    <button id="switcherCreateGroup"><Plus size={16} /> 新規グループを作成</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="header-dropdown" id="tutorialMenuContainer">
            <button className="button header-icon-button" id="tutorialMenuButton">
              <HelpCircle size={18} />
              <span>チュートリアル</span>
              <ChevronDown size={16} className="dropdown-arrow" />
            </button>
          </div>

          <div className="header-dropdown" id="userMenuContainer">
            <button 
              className="button header-icon-button" 
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              <User size={18} />
              <span>ユーザー</span>
              <ChevronDown size={16} className="dropdown-arrow" />
            </button>
            {userDropdownOpen && (
              <div className="dropdown-content" style={{ display: 'block' }}>
                <ul>
                  <li><button id="adminDashboardButton">システム管理</button></li>
                  <li><button id="logoutButton">ログアウト</button></li>
                  <li><button id="deleteAccountButton" className="delete-btn">アカウント削除</button></li>
                </ul>
              </div>
            )}
          </div>

          {!isLoggedIn && (
            <div className="auth-controls">
              <button id="loginButton">運営者ログイン</button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};
