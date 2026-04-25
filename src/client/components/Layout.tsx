import React from 'react';
import { Header } from './Header';
import { CanvasContainer } from './CanvasContainer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      {/* 既存の Loading Mask */}
      <div id="globalLoadingMask" className="loading-mask" style={{ display: 'none', position: 'fixed', zIndex: 9999 }}>
        <p>読み込み中...</p>
      </div>

      <CanvasContainer />
      <Header />
      
      {/* メインコンテンツ（各View） */}
      {children}
    </>
  );
};
