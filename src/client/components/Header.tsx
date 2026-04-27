import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, matchPath } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, HelpCircle, ChevronDown, User, LogOut, Trash2, Settings, Plus } from 'lucide-react';
import * as api from '../lib/api';
import { ParticipantHeader } from './ParticipantHeader';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading } = useSelector((state: any) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tutorialDropdownOpen, setTutorialDropdownOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const location = useLocation();

  const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setShowConfirmModal({ isOpen: true, message, onConfirm });
  };

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

  useEffect(() => {
    const match = matchPath('/admin/groups/:groupId/*', location.pathname);
    if (match && match.params.groupId && match.params.groupId !== 'members') {
      const gId = match.params.groupId;
      if (groups.some(g => g.id === gId)) {
        localStorage.setItem('lastGroupId', gId);
      }
    }
  }, [location.pathname, groups]);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const updateHeight = () => {
      const height = headerEl.offsetHeight;
      document.documentElement.style.setProperty('--header-height', `${height}px`);
    };

    // 初回実行
    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    resizeObserver.observe(headerEl);

    return () => {
      resizeObserver.disconnect();
    };
  }, [user?.isImpersonating, isAuthenticated, isParticipantView]);

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    const lastGroupId = localStorage.getItem('lastGroupId');
    if (lastGroupId && groups.some(g => g.id === lastGroupId)) {
      navigate(`/admin/groups/${lastGroupId}`);
    } else {
      navigate('/admin/groups');
    }
  };

  const handleAdminLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      window.location.href = '/';
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    confirmAction('本当にアカウントを削除しますか？この操作は取り消せません。', async () => {
      try {
        await api.deleteUserAccount();
        showToast('アカウントを削除しました。');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (e) {
        showToast('アカウント削除に失敗しました。');
        setShowConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getActiveGroupId = () => {
    const match = matchPath('/admin/groups/:groupId/*', location.pathname);
    if (match && match.params.groupId && match.params.groupId !== 'members') {
      return match.params.groupId;
    }
    return localStorage.getItem('lastGroupId') || '';
  };
  const activeGroupId = getActiveGroupId();
  const currentGroupName = groups.find(g => g.id === activeGroupId)?.name || 'グループ切替';

  return (
    <div id="header-container" ref={headerRef}>
      {user?.isImpersonating && (
        <div className="impersonation-banner">
          <span>現在、成り代わり中です（元の管理者ID: {user.originalAdminId}）</span>
          <button
            className="secondary-btn"
            onClick={async () => {
              try {
                await api.stopImpersonating();
                window.location.href = '/admin/dashboard';
              } catch(e) {
                console.error(e);
              }
            }}
          >
            本来のユーザーに戻る
          </button>
        </div>
      )}
      {showAdminHeader && (
        <header className="main-header visible">
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
          
          {isAuthenticated && (
            <Link to="/" className="button header-icon-button" title="ホーム" onClick={handleHomeClick}>
              <Home size={16} /><span>ホーム</span>
            </Link>
          )}

          {isAuthenticated && groups.length > 0 && (
            <div className="group-switcher-container">
              <label className="group-switcher-label">グループ選択</label>
              <div id="groupSwitcher" onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}>
                <button id="currentGroupName">
                  {currentGroupName}
                </button>
                <div id="groupDropdown" className={`dropdown-content ${groupDropdownOpen ? 'open' : ''}`}>
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
                    <Plus size={14} className="icon-inline mr-5" /> 新規グループ作成
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && (
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
                <div className="dropdown-content open">
                  <Link to="/tutorials" className="dropdown-item-link" onClick={() => {setTutorialDropdownOpen(false); setMenuOpen(false);}}>
                    すべて表示
                  </Link>
                </div>
              )}
            </div>
          )}

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
                <div className="dropdown-content open">
                  <ul className="dropdown-list">
                    <li>
                      <Link 
                        to="/admin/dashboard" 
                        className="dropdown-item-link dropdown-item-flex" 
                        onClick={() => {setUserDropdownOpen(false); setMenuOpen(false);}}
                      >
                        <Settings size={16}/> システム管理
                      </Link>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item-btn"
                        onClick={() => { handleLogout(); setUserDropdownOpen(false); setMenuOpen(false); }}
                      >
                        <LogOut size={16}/> ログアウト
                      </button>
                    </li>
                    <li>
                      <button 
                        className="delete-btn dropdown-item-btn text-danger"
                        onClick={() => { handleDeleteAccount(); setUserDropdownOpen(false); setMenuOpen(false); }}
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
      {showConfirmModal.isOpen && (
        <div className="modal active">
          <div className="modal-content text-center max-w-400">
            <h3>確認</h3>
            <p className="confirm-message">{showConfirmModal.message}</p>
            <div className="modal-actions center gap-15">
              <button className="secondary-btn" onClick={() => setShowConfirmModal({...showConfirmModal, isOpen: false})}>キャンセル</button>
              <button className="primary-action" onClick={showConfirmModal.onConfirm}>OK</button>
            </div>
          </div>
        </div>
      )}
      {toastMessage && (
        <div className="toast active">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
