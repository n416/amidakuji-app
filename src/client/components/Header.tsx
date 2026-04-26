import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, HelpCircle, ChevronDown, User, LogOut, Trash2, Settings, Plus } from 'lucide-react';
import * as api from '../lib/api';
import { ParticipantHeader } from './ParticipantHeader';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useSelector((state: any) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tutorialDropdownOpen, setTutorialDropdownOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const location = useLocation();

  const isParticipantView = 
    location.pathname.startsWith('/events/') || 
    location.pathname.startsWith('/share/') || 
    (location.pathname.startsWith('/groups/') && !location.pathname.startsWith('/admin/groups')) || 
    (location.pathname.startsWith('/g/') && !location.pathname.startsWith('/admin/'));

  const showAdminHeader = !isParticipantView || isAuthenticated;

  useEffect(() => {
    if (isAuthenticated) {
      api.getGroups().then((gs: any) => {
        setGroups(gs);
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  const handleAdminLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout');
      window.location.href = '/';
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) {
      try {
        await api.deleteUserAccount();
        alert('アカウントを削除しました。');
        window.location.href = '/';
      } catch (e) {
        alert('アカウント削除に失敗しました。');
      }
    }
  };

  return (
    <div id="header-container">
      {showAdminHeader && (
        <header className="main-header" style={{ display: 'flex' }}>
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
          
          <Link to="/" className="button header-icon-button" title="ホーム" onClick={() => setMenuOpen(false)}>
            <Home size={16} /><span>ホーム</span>
          </Link>

          {isAuthenticated && groups.length > 0 && (
            <div className="group-switcher-container">
              <label className="group-switcher-label">グループ選択</label>
              <div id="groupSwitcher" onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}>
                <button id="currentGroupName">
                  {groups.find(g => g.id === window.location.pathname.split('/')[3])?.name || 'グループ切替'}
                </button>
                <div id="groupDropdown" className="dropdown-content" style={{ display: groupDropdownOpen ? 'block' : 'none' }}>
                  <ul id="switcherGroupList">
                    {groups.map(g => (
                      <li key={g.id}>
                        <button onClick={() => { setMenuOpen(false); navigate(`/admin/groups/${g.id}`); }}>
                          {g.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button id="switcherCreateGroup" onClick={() => { setGroupDropdownOpen(false); setMenuOpen(false); navigate('/admin/groups'); }}>
                    <Plus size={14} style={{verticalAlign: 'middle', marginRight: '5px'}} /> 新規グループ作成
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="header-dropdown">
            <button 
              className="button header-icon-button" 
              onClick={() => setTutorialDropdownOpen(!tutorialDropdownOpen)}
            >
              <HelpCircle size={16} />
              <span>チュートリアル</span>
              <ChevronDown size={14} className="dropdown-arrow" />
            </button>
            {tutorialDropdownOpen && (
              <div className="dropdown-content" style={{ display: 'block' }}>
                <Link to="/tutorials" className="dropdown-item-link" onClick={() => {setTutorialDropdownOpen(false); setMenuOpen(false);}}>
                  すべて表示
                </Link>
              </div>
            )}
          </div>

          {!isLoading && isAuthenticated ? (
            <div className="header-dropdown">
              <button 
                className="button header-icon-button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <User size={16} />
                <span>ユーザー</span>
                <ChevronDown size={14} className="dropdown-arrow" />
              </button>
              {userDropdownOpen && (
                <div className="dropdown-content" style={{ display: 'block' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li>
                      <Link 
                        to="/admin/dashboard" 
                        className="dropdown-item-link" 
                        onClick={() => {setUserDropdownOpen(false); setMenuOpen(false);}}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Settings size={16}/> システム管理
                      </Link>
                    </li>
                    <li>
                      <button 
                        onClick={() => { handleLogout(); setUserDropdownOpen(false); setMenuOpen(false); }}
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <LogOut size={16}/> ログアウト
                      </button>
                    </li>
                    <li>
                      <button 
                        className="delete-btn"
                        onClick={() => { handleDeleteAccount(); setUserDropdownOpen(false); setMenuOpen(false); }}
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 15px', cursor: 'pointer', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Trash2 size={16}/> アカウント削除
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : !isLoading && !isAuthenticated ? (
            <div className="auth-controls">
              <button className="primary-action" onClick={handleAdminLogin}>運営者ログイン</button>
            </div>
          ) : null}

        </div>
        </header>
      )}
      <ParticipantHeader />
    </div>
  );
};
