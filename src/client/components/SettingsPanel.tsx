import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';

interface SettingsPanelProps {
  animation: boolean;
  setAnimation: (val: boolean) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ animation, setAnimation }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark'>(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.theme) return parsed.theme;
      } catch (e) {}
    }
    return 'auto';
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load animation setting from localStorage
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.animation !== undefined) setAnimation(parsed.animation);
      } catch (e) {}
    }
  }, [setAnimation]);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('userSettings', JSON.stringify({ animation, theme }));
    
    document.body.classList.remove('light-mode', 'dark-mode');
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.add('light-mode');
      }
    }
    
    // Dispatch a custom event so other components (like canvas renderers) know the theme changed
    window.dispatchEvent(new Event('themeChanged'));
  }, [animation, theme]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(e.target as Node) &&
        fabRef.current &&
        !fabRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <div 
        className={`settings-fab ${isVisible ? 'active' : ''}`} 
        id="settingsFab" 
        title="設定"
        ref={fabRef}
        onClick={() => setIsVisible(!isVisible)}
      >
        <Settings />
      </div>
      <div 
        className={`settings-panel ${isVisible ? 'visible' : ''}`} 
        id="settingsPanel"
        ref={panelRef}
      >
        <h3>表示設定</h3>
        <div className="setting-item">
          <span>アニメーション</span>
          <label className="switch">
            <input 
              type="checkbox" 
              id="animationToggle" 
              checked={animation}
              onChange={(e) => setAnimation(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="setting-item theme-switcher">
          <span>テーマ</span>
          <div className="theme-options segmented-control">
            <label className={theme === 'auto' ? 'active' : ''}>
              <input 
                type="radio" 
                name="theme" 
                value="auto" 
                checked={theme === 'auto'}
                onChange={() => setTheme('auto')}
              /> 自動
            </label>
            <label className={theme === 'light' ? 'active' : ''}>
              <input 
                type="radio" 
                name="theme" 
                value="light" 
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
              /> ライト
            </label>
            <label className={theme === 'dark' ? 'active' : ''}>
              <input 
                type="radio" 
                name="theme" 
                value="dark" 
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
              /> ダーク
            </label>
          </div>
        </div>
      </div>
    </>
  );
};
