import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { tutorials, TutorialStory, TutorialStep } from './tutorialData';
import { CustomConfirmModal } from '../components/CustomConfirmModal';

const CHECK_INTERVAL = 100;
const MAX_WAIT_TIME = 5000;

function waitForElement(selector: string): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    let elapsedTime = 0;
    const interval = setInterval(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element && element.offsetParent !== null) {
        clearInterval(interval);
        resolve(element);
      }
      elapsedTime += CHECK_INTERVAL;
      if (elapsedTime >= MAX_WAIT_TIME) {
        clearInterval(interval);
        reject(new Error(`Element with selector "${selector}" not found or not visible within ${MAX_WAIT_TIME}ms`));
      }
    }, CHECK_INTERVAL);
  });
}

function escapeHtml(str: string | undefined): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export const TutorialEngine: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentGroupId = useSelector((state: RootState) => state.lottery.currentGroupId || state.admin.currentGroup?.id);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentEventId = useSelector((state: RootState) => state.lottery.currentEventId);
  const currentLotteryData = useSelector((state: RootState) => state.lottery.currentLotteryData);
  const state = { currentGroupId, currentUser, currentEventId, currentLotteryData };

  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ display: 'none' });
  const [focusStyle, setFocusStyle] = useState<React.CSSProperties>({ display: 'none' });
  const [dialogStyle, setDialogStyle] = useState<React.CSSProperties>({ display: 'none' });
  const [showNextButton, setShowNextButton] = useState(false);
  const [nextButtonText, setNextButtonText] = useState('次へ');
  const [confirmModalConfig, setConfirmModalConfig] = useState<{message: string, options: string[], callback: (opt: string | null) => void} | null>(null);

  // Refs to control flow
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentViewIdRef = useRef<string>('');
  const returnUrlRef = useRef<string | null>(null);
  const activeTutorialState = useRef({
    targetEl: null as HTMLElement | null,
    focusTargetEl: null as HTMLElement | null,
    activeViewId: null as string | null,
  });

  const nextActionRef = useRef<(() => void) | null>(null);
  const cancelActionRef = useRef<(() => void) | null>(null);
  const skipAllActionRef = useRef<(() => void) | null>(null);

  const cleanupListenersRef = useRef<(() => void) | null>(null);

  // Parse viewId from location
  useEffect(() => {
    const path = location.pathname;
    let viewId = '';
    if (path.includes('/admin/groups') && !path.includes('/event')) {
      viewId = path === '/admin/groups' ? 'groupDashboard' : 'dashboardView';
    } else if (path.includes('/admin/group/') && path.includes('/event/')) {
      viewId = 'eventEditView';
    } else if (path.includes('/admin/group/') && path.includes('/members')) {
      viewId = 'memberManagementView';
    } else if (path.includes('/broadcast/')) {
      viewId = 'broadcastView';
    } else {
      // Just map some view element if exists
      const viewEl = document.querySelector('.view-container');
      if (viewEl) viewId = viewEl.id;
    }
    currentViewIdRef.current = viewId;
  }, [location.pathname]);

  const closeDialog = useCallback((result: { ok: boolean }) => {
    if (cleanupListenersRef.current) cleanupListenersRef.current();
    setIsVisible(false);
    setHighlightStyle({ display: 'none' });
    setFocusStyle({ display: 'none' });
    setDialogStyle({ display: 'none' });
    activeTutorialState.current.targetEl = null;
    activeTutorialState.current.focusTargetEl = null;
    return result;
  }, []);

  const showToast = (msg: string) => {
    // A simple toast implementation or dispatch event
    const toast = document.createElement('div');
    toast.className = 'toast active';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const showCustomConfirm = (msg: string, options: string[]): Promise<string | null> => {
    return new Promise((resolve) => {
      setConfirmModalConfig({ message: msg, options, callback: (opt) => {
        setConfirmModalConfig(null);
        resolve(opt);
      }});
    });
  };

  const markTutorialAsCompleted = (storyId: string, skipNavigate = false) => {
    try {
      localStorage.setItem(`tutorialCompleted_${storyId}`, 'true');
      if (!skipNavigate) {
        const params = new URLSearchParams(window.location.search);
        if (params.has('forceTutorial')) {
          params.delete('forceTutorial');
          navigate(`${window.location.pathname}?${params.toString()}`, { replace: true });
        }
      }
    } catch (e) {}
  };

  const isTutorialCompleted = (storyId: string) => {
    try {
      return localStorage.getItem(`tutorialCompleted_${storyId}`) === 'true';
    } catch (e) {
      return false;
    }
  };

  const updateHighlightPosition = (el: HTMLElement | null) => {
    if (!el) {
      setHighlightStyle({
        display: 'block',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
        left: 0, top: 0, width: 0, height: 0
      });
      return;
    }
    const rect = el.getBoundingClientRect();
    const padding = 5;
    setHighlightStyle({
      display: 'block',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
      left: rect.left - padding,
      top: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    });
  };

  const updateFocusBorderPosition = (el: HTMLElement | null) => {
    if (!el) {
      setFocusStyle({ display: 'none' });
      return;
    }
    const rect = el.getBoundingClientRect();
    setFocusStyle({
      display: 'block',
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    });
  };

  const positionDialog = (dialogRect: DOMRect, el: HTMLElement | null) => {
    let top, left;
    if (!el) {
      top = (window.innerHeight - dialogRect.height) / 2;
      left = (window.innerWidth - dialogRect.width) / 2;
    } else {
      const rect = el.getBoundingClientRect();
      const padding = 15;
      top = rect.bottom + padding;
      left = rect.left + rect.width / 2 - dialogRect.width / 2;
      if (top + dialogRect.height > window.innerHeight - 10) top = rect.top - dialogRect.height - padding;
      if (top < 10) top = 10;
      if (left < 10) left = 10;
      if (left + dialogRect.width > window.innerHeight - 10) left = window.innerWidth - dialogRect.width - 10;
    }
    setDialogStyle({ display: 'block', top, left });
  };

  const executeTutorial = async (story: TutorialStory, currentViewId: string, signal: AbortSignal) => {
    const pageStep = story.steps.find((step) => step.type === 'page' && step.match === currentViewId);
    if (!pageStep || !pageStep.subSteps) return;

    if (pageStep.precondition && !pageStep.precondition(state)) return;

    activeTutorialState.current.activeViewId = currentViewId;
    let startIndex = 0;
    for (let i = 0; i < pageStep.subSteps.length; i++) {
      if (pageStep.subSteps[i].precondition && !pageStep.subSteps[i].precondition!(state)) {
        startIndex = i + 1;
      } else break;
    }

    if (startIndex >= pageStep.subSteps.length) return;

    try {
      for (let i = startIndex; i < pageStep.subSteps.length; i++) {
        if (signal.aborted) throw new Error('Aborted');
        const subStep = pageStep.subSteps[i];
        if (subStep.precondition && !subStep.precondition(state)) continue;

        const result = await new Promise<{ok: boolean}>(async (resolve, reject) => {
          const onAbort = () => reject(new Error('Aborted'));
          signal.addEventListener('abort', onAbort);

          activeTutorialState.current.targetEl = null;
          activeTutorialState.current.focusTargetEl = null;

          const selectorForHighlight = subStep.highlightSelector || subStep.waitForClickOn || subStep.waitForInputOn;
          if (selectorForHighlight) {
            try {
              const el = await waitForElement(selectorForHighlight);
              if (signal.aborted) throw new Error('Aborted');
              activeTutorialState.current.targetEl = el;
              el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              // Wait for scroll
              await new Promise(r => setTimeout(r, 400));
              updateHighlightPosition(el);
            } catch (e) {
              signal.removeEventListener('abort', onAbort);
              return reject(e);
            }
          } else {
            updateHighlightPosition(null);
          }

          if (subStep.focusSelector) {
            try {
              const el = await waitForElement(subStep.focusSelector);
              activeTutorialState.current.focusTargetEl = el;
              updateFocusBorderPosition(el);
            } catch (e) {}
          }

          setTitle(story.title);
          setMessage(subStep.message);
          setShowNextButton(!subStep.removeOkButton);
          setNextButtonText('次へ');
          setIsVisible(true);

          // Force reflow for dialog rect
          setTimeout(() => {
            const dialogEl = document.getElementById('tutorial-dialog-react');
            if (dialogEl) {
              positionDialog(dialogEl.getBoundingClientRect(), activeTutorialState.current.focusTargetEl || activeTutorialState.current.targetEl);
            }
          }, 50);

          cleanupListenersRef.current = () => {
            signal.removeEventListener('abort', onAbort);
          };

          nextActionRef.current = () => resolve(closeDialog({ok: true}));
          cancelActionRef.current = () => {
            const params = new URLSearchParams(window.location.search);
            params.delete('forceTutorial');
            navigate(`${window.location.pathname}?${params.toString()}`, { replace: true });
            resolve(closeDialog({ok: false}));
          };
          skipAllActionRef.current = async () => {
            setIsVisible(false);
            const c1 = await showCustomConfirm('本当にすべてのチュートリアルを完了済みにしますか？', ['はい']);
            if (c1 !== 'はい') { setIsVisible(true); return; }
            const c2 = await showCustomConfirm('この操作は元に戻せません。本当によろしいですか？', ['はい']);
            if (c2 !== 'はい') { setIsVisible(true); return; }
            
            tutorials.forEach(t => markTutorialAsCompleted(t.id, true));
            const params = new URLSearchParams(window.location.search);
            if (params.has('forceTutorial')) {
              params.delete('forceTutorial');
              navigate(`${window.location.pathname}?${params.toString()}`, { replace: true });
            }
            showToast('すべてのチュートリアルを完了済みにしました。');
            window.dispatchEvent(new CustomEvent('tutorialsUpdated'));
            resolve(closeDialog({ok: false}));
          };

          if (subStep.waitForClickOn) {
            const clickTarget = document.querySelector(subStep.waitForClickOn);
            const clickHandler = () => {
              resolve(closeDialog({ok: true}));
            };
            if (clickTarget) {
              clickTarget.addEventListener('click', clickHandler, { once: true });
              const oldCleanup = cleanupListenersRef.current;
              cleanupListenersRef.current = () => {
                oldCleanup();
                clickTarget.removeEventListener('click', clickHandler);
              };
            }
          } else if (subStep.waitForInputOn) {
            const inputEl = document.querySelector(subStep.waitForInputOn) as HTMLInputElement;
            let isComposing = false;
            let debounceTimeout: any;

            const compStart = () => { isComposing = true; };
            const compEnd = (e: any) => { isComposing = false; e.target.dispatchEvent(new Event('input')); };
            const inputHandler = () => {
              clearTimeout(debounceTimeout);
              if (isComposing) return;
              const hasValue = inputEl && inputEl.value.trim() !== '';
              if (subStep.showNextButtonOnInput) {
                setShowNextButton(hasValue);
                if (hasValue) setNextButtonText('チュートリアルを進める');
              } else if (hasValue) {
                debounceTimeout = setTimeout(() => resolve(closeDialog({ok: true})), 2000);
              }
            };
            
            if (inputEl) {
              inputEl.addEventListener('input', inputHandler);
              inputEl.addEventListener('compositionstart', compStart);
              inputEl.addEventListener('compositionend', compEnd);
              
              const oldCleanup = cleanupListenersRef.current;
              cleanupListenersRef.current = () => {
                oldCleanup();
                clearTimeout(debounceTimeout);
                inputEl.removeEventListener('input', inputHandler);
                inputEl.removeEventListener('compositionstart', compStart);
                inputEl.removeEventListener('compositionend', compEnd);
              };
            }
          }

        });

        if (!result.ok) {
          returnUrlRef.current = null;
          return;
        }

        if (subStep.complete) {
          markTutorialAsCompleted(story.id);
          if (story.returnOnComplete && returnUrlRef.current) {
            const urlToReturn = returnUrlRef.current;
            returnUrlRef.current = null;
            showToast('チュートリアル完了！元の画面に戻ります。');
            setTimeout(() => navigate(urlToReturn), 1500);
          }
          window.dispatchEvent(new CustomEvent('tutorialsUpdated'));
          return;
        }
      }
    } catch (e) {
      closeDialog({ok: false});
      returnUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const currentViewId = currentViewIdRef.current;
    if (!currentViewId) return;

    const searchParams = new URLSearchParams(location.search);
    const forcedTutorialId = searchParams.get('forceTutorial');

    const run = async () => {
      // Small delay to ensure DOM is rendered
      await new Promise(r => setTimeout(r, 300));
      if (abortController.signal.aborted) return;

      if (forcedTutorialId) {
        const storyToForce = tutorials.find((s) => s.id === forcedTutorialId);
        if (storyToForce) {
          const pageStep = storyToForce.steps.find((step) => step.type === 'page' && step.match === currentViewId);
          if (pageStep) {
            if (pageStep.precondition && !pageStep.precondition(state)) {
              if (pageStep.preconditionFailMessage) {
                showToast(pageStep.preconditionFailMessage);
                searchParams.delete('forceTutorial');
                navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
              }
            } else {
              await executeTutorial(storyToForce, currentViewId, abortController.signal);
            }
          }
        }
        return;
      }

      for (const story of tutorials) {
        if (isTutorialCompleted(story.id)) continue;
        const pageStep = story.steps.find((step) => step.type === 'page' && step.match === currentViewId);
        if (pageStep) {
          if (pageStep.precondition && !pageStep.precondition(state)) continue;
          await executeTutorial(story, currentViewId, abortController.signal);
          break;
        }
      }
    };

    run();

    return () => {
      abortController.abort();
    };
  }, [location.pathname, location.search, state.currentEventId, state.currentLotteryData?.status]);

  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        updateHighlightPosition(activeTutorialState.current.targetEl);
        updateFocusBorderPosition(activeTutorialState.current.focusTargetEl);
        const dialogEl = document.getElementById('tutorial-dialog-react');
        if (dialogEl) {
          positionDialog(dialogEl.getBoundingClientRect(), activeTutorialState.current.focusTargetEl || activeTutorialState.current.targetEl);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible]);

  // Export setReturnUrl globally so TutorialListView can call it
  useEffect(() => {
    (window as any).setTutorialReturnUrl = (url: string) => {
      returnUrlRef.current = url;
    };
    return () => {
      delete (window as any).setTutorialReturnUrl;
    };
  }, []);

  if (!isVisible && !confirmModalConfig) return null;

  return (
    <>
      {isVisible && (
        <>
          <div className="tutorial-highlight-box" style={{ ...highlightStyle, position: 'fixed', zIndex: 9999, pointerEvents: 'none', transition: 'all 0.3s ease-in-out', borderRadius: '5px' }}></div>
          <div className="tutorial-focus-border" style={{ ...focusStyle, position: 'fixed', zIndex: 10001, pointerEvents: 'none', transition: 'all 0.3s ease-in-out', border: '3px solid blue', borderRadius: '5px', boxSizing: 'border-box' }}></div>
          <div id="tutorial-dialog-react" className="tutorial-dialog" style={{ ...dialogStyle, position: 'fixed', zIndex: 10002, backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', maxWidth: '350px', transition: 'all 0.3s ease', color: '#333' }}>
            <div className="step-title" style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '1.2em' }} dangerouslySetInnerHTML={{ __html: escapeHtml(title) }}></div>
            <div className="step-message" style={{ marginBottom: '20px', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: escapeHtml(message) }}></div>
            <div className="step-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
              <a onClick={() => skipAllActionRef.current?.()} className="skip-all-link" style={{ fontSize: '0.8em', color: '#dc3545', cursor: 'pointer', textDecoration: 'underline' }}>チュートリアルを全部終了したことにする</a>
              <div>
                <button onClick={() => cancelActionRef.current?.()} style={{ padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #ccc', marginRight: '10px' }}>キャンセル</button>
                {showNextButton && (
                  <button onClick={() => nextActionRef.current?.()} className="primary" style={{ padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #007bff', backgroundColor: '#007bff', color: 'white' }}>{nextButtonText}</button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {confirmModalConfig && (
        <CustomConfirmModal
          message={confirmModalConfig.message}
          options={confirmModalConfig.options}
          onSelect={confirmModalConfig.callback}
        />
      )}
    </>
  );
};
