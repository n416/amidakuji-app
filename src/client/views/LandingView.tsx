import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.id) {
      navigate('/admin/groups', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const handleAdminLogin = () => {
    window.location.href = '/auth/google';
  };

  return (
    <div id="landingView" className="view-container">
      <div className="landing-container">
        <h2>ダイナミックあみだくじへようこそ！</h2>
        <p className="landing-subtitle">インタラクティブなあみだくじを作成して、イベントを盛り上げましょう。</p>

        <div className="landing-section">
          <h3>🎉 このサイトについて</h3>
          <p>
            「ダイナミックあみだくじ」は、イベントやパーティーの主催者（運営者）が、リアルタイムで結果が変化するインタラクティブなあみだくじを作成・実施するためのツールです。
          </p>
        </div>

        <div className="landing-section">
          <h3>運営者の方へ</h3>
          <p>Googleアカウントでログインすると、あみだくじイベントの作成やメンバー管理など、すべての機能をご利用いただけます。</p>
          <div className="login-action-container">
            <button className="primary-action login-button" onClick={handleAdminLogin}>運営者ログイン (Google)</button>
          </div>
        </div>

        <div className="landing-section">
          <h3>参加者の方へ</h3>
          <p>
            このページは運営者向けのトップページです。<br/>
            あみだくじに参加するには、イベントの主催者から共有された専用のURLにアクセスしてください。
          </p>
          <p className="url-example">（例: https://amidakuji-app-native.an.r.appspot.com/events/xxxxxx）</p>
        </div>
      </div>
    </div>
  );
};
