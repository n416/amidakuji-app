// @ts-nocheck
import {animator, isAnimationRunning, updateRevealedPrizes} from './core';
import {calculateAllPaths, getTargetHeight, calculatePrizeAreaHeight} from './path';
import {drawLotteryBase, drawTracerPath, drawTracerIcon, drawRevealedPrizes} from './drawing';

export let adminPanzoom: any = null;
export let participantPanzoom: any = null;
let currentAdminPanzoomElement = null;
let currentParticipantPanzoomElement = null;
let resizeDebounceTimer;

export function resetParticipantPanzoom() {
  if (participantPanzoom) {
    try { participantPanzoom.destroy(); } catch(e) {}
    participantPanzoom = null;
    currentParticipantPanzoomElement = null;
  }
}

export function resetAdminPanzoom() {
  if (adminPanzoom) {
    try { adminPanzoom.destroy(); } catch(e) {}
    adminPanzoom = null;
    currentAdminPanzoomElement = null;
  }
}

export function initializePanzoom(canvasElement) {
  if (!canvasElement) return null;

  const panzoomElement = canvasElement.parentElement;
  const isParticipantCanvas = canvasElement.id === 'participantCanvas' || canvasElement.id === 'participantCanvasStatic';

  if (isParticipantCanvas && participantPanzoom) {
    if (currentParticipantPanzoomElement === panzoomElement) {
      return participantPanzoom;
    } else {
      try { participantPanzoom.destroy(); } catch(e) {}
      participantPanzoom = null;
    }
  }
  if (canvasElement.id === 'adminCanvas' && adminPanzoom) {
    if (currentAdminPanzoomElement === panzoomElement) {
      return adminPanzoom;
    } else {
      try { adminPanzoom.destroy(); } catch(e) {}
      adminPanzoom = null;
    }
  }

  const panzoom = Panzoom(panzoomElement, {
    maxScale: 10,
    minScale: 0.1,
    contain: 'outside',
  });

  const container = canvasElement.closest('.canvas-panzoom-container');

  const wheelListener = (event) => {
    if (!event.shiftKey) {
      panzoom.zoomWithWheel(event);
    }
  };

  if (container) {
    if (container._wheelListener) {
      container.removeEventListener('wheel', container._wheelListener);
    }
    container.addEventListener('wheel', wheelListener);
    container._wheelListener = wheelListener;
  }

  if (canvasElement.id === 'adminCanvas') {
    adminPanzoom = panzoom;
    currentAdminPanzoomElement = panzoomElement;
  } else if (isParticipantCanvas) {
    participantPanzoom = panzoom;
    currentParticipantPanzoomElement = panzoomElement;
  }

  return panzoom;
}

export async function preloadIcons(participants) {
  const newIcons = participants.filter((p) => p && p.name && !animator.icons[p.name]);
  if (newIcons.length === 0) return;
  const promises = newIcons.map((p) => {
    return new Promise((resolve) => {
      const iconUrl = p.iconUrl || `/api/avatar-proxy?name=${encodeURIComponent(p.name)}`;
      const img = new Image();
      img.onload = () => {
        animator.icons[p.name] = img;
        resolve();
      };
      img.onerror = () => {
        animator.icons[p.name] = null;
        resolve();
      };
      img.src = iconUrl;
    });
  });
  await Promise.all(promises);
}

export async function preloadPrizeImages(prizes) {
  if (!prizes) return Promise.resolve();
  const newImages = prizes.filter((p) => p && typeof p === 'object' && p.imageUrl && !animator.prizeImages[p.imageUrl]);
  if (newImages.length === 0) return;
  const promises = newImages.map((p) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        animator.prizeImages[p.imageUrl] = img;
        resolve();
      };
      img.onerror = () => {
        animator.prizeImages[p.imageUrl] = null;
        resolve();
      };
      img.src = p.imageUrl;
    });
  });
  await Promise.all(promises);
}

export function handleResize() {
  console.log('[Animation] Resize event detected.');
  if (isAnimationRunning()) {
    console.log('[Animation] Animation is running, resize will be handled by animationLoop.');
    return;
  }

  console.log('[Animation] Animation is NOT running, redrawing static canvas.');
  const adminCanvas = document.getElementById('adminCanvas');
  const participantCanvas = document.getElementById('participantCanvas');
  const participantCanvasStatic = document.getElementById('participantCanvasStatic');

  if (adminCanvas && adminCanvas.offsetParent !== null) {
    console.log('[Animation] Redrawing admin canvas for resize.');
    const hidePrizes = animator.lotteryData?.status !== 'started';
    prepareStepAnimation(adminCanvas.getContext('2d'), hidePrizes, false, true);
  } else if (participantCanvas && participantCanvas.offsetParent !== null) {
    console.log('[Animation] Redrawing participant canvas for resize.');
    const hidePrizes = animator.lotteryData?.displayMode === 'private' && animator.lotteryData?.status !== 'started';
    prepareStepAnimation(participantCanvas.getContext('2d'), hidePrizes, false, true);
  } else if (participantCanvasStatic && participantCanvasStatic.offsetParent !== null) {
    console.log('[Animation] Redrawing static participant canvas for resize.');
    prepareStepAnimation(participantCanvasStatic.getContext('2d'), true, false, true);
  }
}

window.addEventListener('resize', () => {
  clearTimeout(resizeDebounceTimer);
  resizeDebounceTimer = setTimeout(handleResize, 350);
});

export async function prepareStepAnimation(targetCtx: any, hidePrizes = false, showMask = true, isResize = false, storedState: any = null, keepRevealed = false, onlyTracerName: any = null) {
  if (!targetCtx || !animator.lotteryData) {
    console.error('[Animation] Prepare failed: No context or lottery data.');
    return;
  }
  const container = targetCtx.canvas.closest('.canvas-panzoom-container');
  if (!container) return;
  const maskId = targetCtx.canvas.id === 'adminCanvas' ? 'admin-loading-mask' : targetCtx.canvas.id === 'participantCanvas' ? 'participant-loading-mask' : 'participant-loading-mask-static';
  const mask = document.getElementById(maskId);

  if (mask && showMask) mask.style.display = 'flex';
  if (!isResize) {
    if (!keepRevealed) {
      updateRevealedPrizes([]);
    }
    animator.tracers = [];
    animator.icons = {};
    animator.prizeImages = {};
  }
  const allParticipantsWithNames = animator.lotteryData.participants.filter((p) => p.name);
  await preloadPrizeImages(animator.lotteryData.prizes);
  await preloadIcons(allParticipantsWithNames);
  const VIRTUAL_HEIGHT = getTargetHeight(container);

  const allLines = [...(animator.lotteryData.lines || []), ...(animator.lotteryData.doodles || [])];

  const allPaths = calculateAllPaths(animator.lotteryData.participants, allLines, container.clientWidth, VIRTUAL_HEIGHT, container);

  animator.tracers = allParticipantsWithNames.map((p) => {
    const path = allPaths[p.slot];
    const isFinished = animator.revealedPrizes.some((r) => r.participantName === p.name);
    const finalPoint = isFinished ? path[path.length - 1] : path[0];
    return {
      name: p.name,
      slot: p.slot,
      color: p.color || '#333',
      path,
      pathIndex: isFinished ? path.length - 1 : 0,
      x: finalPoint.x,
      y: finalPoint.y,
      isFinished,
      celebrated: isFinished,
    };
  });

  animator.context = targetCtx;
  targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
  const isDarkMode = document.body.classList.contains('dark-mode');
  const baseLineColor = isDarkMode ? '#dcdcdc' : '#333';
  drawLotteryBase(targetCtx, animator.lotteryData, baseLineColor, hidePrizes);

  // onlyTracerName が指定されている場合、その名前のトレーサーの軌跡のみ描画する
  // それ以外のトレーサーはアイコンのみ表示（「他の人の軌跡見る！」ボタン押下前の状態）
  animator.tracers.forEach((tracer) => {
    if (tracer.isFinished) {
      if (!onlyTracerName || tracer.name === onlyTracerName) {
        drawTracerPath(targetCtx, tracer);
      }
    }
    drawTracerIcon(targetCtx, tracer);
  });
  if (animator.revealedPrizes.length > 0) {
    drawRevealedPrizes(targetCtx);
  }

  let currentPanzoom = initializePanzoom(targetCtx.canvas);

  if (storedState && currentPanzoom) {
    currentPanzoom.pan(storedState.pan.x, storedState.pan.y, {animate: false});
    currentPanzoom.zoom(storedState.scale, {animate: false});
  } else if (isResize) {
    setTimeout(() => {
      if (container && currentPanzoom) {
        const panzoomElement = targetCtx.canvas.parentElement;
        const canvasWidth = panzoomElement.offsetWidth;
        const containerWidth = container.clientWidth;
        const scale = Math.min(containerWidth / canvasWidth, 1);
        currentPanzoom.zoom(scale, {animate: false});
        const scaledCanvasWidth = canvasWidth * scale;
        const initialX = (containerWidth - scaledCanvasWidth) / 2;
        currentPanzoom.pan(initialX > 0 ? initialX : 0, 0, {animate: false});
      }
    }, 50);
  }

  if (mask && showMask) {
    setTimeout(() => {
      mask.style.display = 'none';
    }, 50);
  }
}


