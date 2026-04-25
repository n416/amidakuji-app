import React from 'react';

export const LandingView: React.FC = () => {
  return (
    <div id="landingView" className="view-container" style={{display: 'none'}}>
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
          <p>
            Googleアカウントでログインすると、あみだくじイベントの作成やメンバー管理など、すべての機能をご利用いただけます。
          </p>
          <div className="controls">
            <button id="landingLoginButton" className="primary-action">運営者ログイン (Google)</button>
          </div>
        </div>

        <div className="landing-section participant-guide">
          <h3>参加者の方へ</h3>
          <p>
            このページは運営者向けのトップページです。<br />
            あみだくじに参加するには、イベントの主催者から共有された専用のURLにアクセスしてください。
          </p>
          <p className="example-url">
            （例: https://amidakuji-app-native.an.r.appspot.com/events/xxxxxx）
          </p>
        </div>
      </div>
    </div>
  );
};
