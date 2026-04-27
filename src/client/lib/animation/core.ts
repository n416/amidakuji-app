// amidakuji-app/src/client/lib/animation/core.ts
import {calculateAllPaths, getTargetHeight, getVirtualWidth, calculateClientSideResults} from './path';
import {drawLotteryBase, drawRevealedPrizes, drawTracerPath, drawTracerIcon} from './drawing';
import {initializePanzoom, preloadIcons, preloadPrizeImages, adminPanzoom, participantPanzoom} from './setup';
import {createSparks, celebrate, Particle} from './effects';
import {Tracer, LotteryData, Participant, RevealedPrize} from './types';

export interface AnimatorState {
  tracers: Tracer[];
  icons: Record<string, HTMLImageElement | null>;
  prizeImages: Record<string, HTMLImageElement | null>;
  particles: Particle[];
  running: boolean;
  onComplete: (() => void) | null;
  context: CanvasRenderingContext2D | null;
  lastContainerWidth: number;
  lastContainerHeight: number;
  containerElement: HTMLElement | null;
  resizeObserver: ResizeObserver | null;
  lotteryData: LotteryData | null; 
  revealedPrizes: RevealedPrize[];
  setRevealedPrizesCallback: ((prizes: RevealedPrize[]) => void) | null;
  participantId: string | null;
}

export const animator: AnimatorState & { readonly panzoom: ReturnType<typeof import("@panzoom/panzoom").default> | null } = {
  tracers: [],
  icons: {},
  prizeImages: {},
  particles: [],
  running: false,
  onComplete: null,
  context: null,
  lastContainerWidth: 0,
  lastContainerHeight: 0,
  containerElement: null,
  resizeObserver: null,
  get panzoom() {
    if (!this.context) return null;
    return this.context.canvas.id === 'adminCanvas' ? adminPanzoom : participantPanzoom;
  },
  lotteryData: null,
  revealedPrizes: [],
  setRevealedPrizesCallback: null,
  participantId: null,
};

export function setAnimatorState(newState: Partial<AnimatorState>) {
  if (newState.lotteryData !== undefined) animator.lotteryData = newState.lotteryData;
  if (newState.revealedPrizes !== undefined) animator.revealedPrizes = newState.revealedPrizes;
  if (newState.setRevealedPrizesCallback !== undefined) animator.setRevealedPrizesCallback = newState.setRevealedPrizesCallback;
  if (newState.participantId !== undefined) animator.participantId = newState.participantId;
}

export function updateRevealedPrizes(newPrizes: RevealedPrize[]) {
  animator.revealedPrizes = newPrizes;
  if (animator.setRevealedPrizesCallback) animator.setRevealedPrizesCallback(newPrizes);
}

let animationFrameId: number;

function ensureResultsFormat(data: LotteryData) {
  if (!data.results || Object.keys(data.results).length === 0) {
    console.log('[Animation] No results found, calculating on client-side.');
    return calculateClientSideResults(data.participants, data.lines || [], data.prizes, data.doodles || []);
  }

  const firstResult = Object.values(data.results!)[0] as any;
  if (typeof firstResult.prizeIndex !== 'undefined') {
    console.log('[Animation] Results format is up-to-date.');
    return data.results;
  }

  console.warn('[Animation] Outdated results format detected. Recalculating on client-side to add prizeIndex.');
  return calculateClientSideResults(data.participants, data.lines || [], data.prizes, data.doodles || []);
}

export function isAnimationRunning() {
  return animator.running;
}

export function stopAnimation() {
  animator.running = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
}

export function clearAnimationState() {
  stopAnimation();
  if (animator.resizeObserver) {
    animator.resizeObserver.disconnect();
  }
  animator.tracers = [];
  animator.icons = {};
  animator.prizeImages = {};
  animator.particles = [];
  animator.onComplete = null;
  animator.context = null;
  animator.lastContainerWidth = 0;
  animator.lastContainerHeight = 0;
  animator.containerElement = null;
  animator.resizeObserver = null;
}

function updateTracerPosition(tracer: Tracer, speed: number) {
  const lotteryData = animator.lotteryData!;
  const revealPrize = () => {
    const targetCanvasId = animator.context!.canvas.id;

    if (targetCanvasId === 'adminCanvas') {
      const resultExists = animator.revealedPrizes.some((r) => r.participantName === tracer.name);
      if (!resultExists) {
        const result = lotteryData.results?.[tracer.name];
        if (result) {
          const prizeIndex = result.prizeIndex;
          const realPrize = lotteryData.prizes[prizeIndex];
          if (typeof prizeIndex !== 'undefined' && prizeIndex > -1 && realPrize) {
            updateRevealedPrizes([...animator.revealedPrizes, {participantName: tracer.name, prize: realPrize, prizeIndex, revealProgress: 0}]);
          }
        }
      }
    } else if (targetCanvasId === 'participantCanvas') {
      if (animator.revealedPrizes.length === 0) {
        const allPrizes = lotteryData.prizes;
        const allResults = lotteryData.results || {};

        const newRevealedPrizes = allPrizes.map((prize, index: number) => {
          const winnerEntry = Object.entries(allResults).find(([name, result]: [string, any]) => result.prizeIndex === index);
          const winnerName = winnerEntry ? winnerEntry[0] : null;

          return {
            participantName: winnerName,
            prize: prize,
            prizeIndex: index,
            revealProgress: 0,
          };
        });

        if (newRevealedPrizes.length > 0) {
          updateRevealedPrizes(newRevealedPrizes);
        }
      }
    }
  };

  // 指定された停止位置 (stopY) に到達した場合の処理
  if (tracer.stopY && tracer.y >= tracer.stopY) {
    tracer.y = tracer.stopY; 
    tracer.isFinished = true; 
    const finalY = tracer.path[tracer.path.length - 1].y;
    // 最終ゴール地点に到達した場合
    if (tracer.stopY >= finalY) {
      if (!tracer.celebrated) {
        tracer.x = tracer.path[tracer.path.length - 1].x;
        tracer.y = tracer.path[tracer.path.length - 1].y;
        const result = lotteryData.results?.[tracer.name];
        if (result && result.prize.rank !== 'miss') {
          celebrate(tracer.x, tracer.color);
        }
        tracer.celebrated = true;
        revealPrize();
      }
    }

    delete tracer.stopY;
    return;
  }

  const target = tracer.path[tracer.pathIndex + 1];

  // 目標地点が見つからない場合は終了扱いとする
  if (!target) {
    tracer.isFinished = true;
    if (!tracer.celebrated) {
      const result = lotteryData.results?.[tracer.name];
      if (result && result.prize.rank !== 'miss') {
        celebrate(tracer.x, tracer.color);
      }
      tracer.celebrated = true;
      revealPrize();
    }
    return;
  }

  const dx = target.x - tracer.x;
  const dy = target.y - tracer.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // ターゲット座標への移動処理（距離が速度未満なら到達判定）
  if (distance < speed) {
    tracer.x = target.x;
    tracer.y = target.y;
    tracer.pathIndex++;
    if (tracer.path[tracer.pathIndex] && tracer.path[tracer.pathIndex - 1] && tracer.path[tracer.pathIndex].y === tracer.path[tracer.pathIndex - 1].y) {
      createSparks(tracer.x, tracer.y, tracer.color);
    }
  } else {
    tracer.x += (dx / distance) * speed;
    tracer.y += (dy / distance) * speed;
  }
}

function animationLoop() {
  if (!animator.running) {
    return;
  }
  const targetCtx = animator.context;
  if (!targetCtx || !targetCtx.canvas) {
    stopAnimation();
    return;
  }
  const numParticipants = animator.lotteryData!.participants.length;
  const baseSpeed = 4;
  const reductionFactor = Math.min(0.5, Math.floor(Math.max(0, numParticipants - 10) / 10) * 0.1);
  const dynamicSpeed = baseSpeed * (1 - reductionFactor);
  targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
  const isDarkMode = document.body.classList.contains('dark-mode');
  const baseLineColor = isDarkMode ? '#dcdcdc' : '#333';
  const isParticipantView = animator.context!.canvas.id === 'participantCanvas';
  const hidePrizes = isParticipantView ? animator.revealedPrizes.length === 0 : true;
  drawLotteryBase(targetCtx, animator.lotteryData!, baseLineColor, hidePrizes);
  drawRevealedPrizes(targetCtx);
  animator.particles = animator.particles.filter((p: Particle) => p.life > 0);
  animator.particles.forEach((p: Particle) => {
    p.update();
    p.draw(targetCtx);
  });
  let allTracersFinished = true;

  // 1. 各トレーサーの現在地を更新し、軌跡を描画する
  animator.tracers.forEach((tracer: Tracer) => {
    if (tracer.isFinished) {
      drawTracerPath(targetCtx, tracer);
    } else {
      allTracersFinished = false; 
      updateTracerPosition(tracer, dynamicSpeed);
      drawTracerPath(targetCtx, tracer);
      if (Math.random() > 0.5) {
        animator.particles.push(new Particle(tracer.x, tracer.y, tracer.color));
      }
    }
  });

  // 2. すべてのトレーサーのアイコンを描画する
  animator.tracers.forEach((tracer: Tracer) => {
    drawTracerIcon(targetCtx, tracer);
  });

  const isRevealingPrizes = animator.revealedPrizes.some((p) => p.revealProgress < 15);
  const particlesRemaining = animator.particles.length > 0;

  if (allTracersFinished && !isRevealingPrizes && !particlesRemaining) {
    if (animator.running) {
      console.log('%c[DEBUG] Animation finished. Calling onComplete callback.', 'color: green; font-weight: bold;');
      animator.running = false; 
      if (animator.onComplete) {
        animator.onComplete();
        animator.onComplete = null; 
      }
    }
    return;
  }

  animationFrameId = requestAnimationFrame(animationLoop);
}

export async function startAnimation(targetCtx: CanvasRenderingContext2D, userNames: string[] = [], onComplete: (() => void) | null = null, panToName: string | null = null) {
  console.log('[Animation] startAnimation called with userNames:', userNames);
  if (!targetCtx || !animator.lotteryData) {
    console.error('[Animation] Start failed: No context or lottery data.');
    return;
  }
  console.log('[Animation] Ensuring results format without mutating frozen React state...');
  animator.lotteryData = {
    ...animator.lotteryData,
    results: ensureResultsFormat(animator.lotteryData)
  };
  console.log('[Animation] lotteryData updated safely.');
  let currentPanzoom = initializePanzoom(targetCtx.canvas);
  if (!currentPanzoom) {
    console.error('[Animation] Panzoom initialization failed.');
    return;
  }
  const namesToAnimate = userNames || [];
  const participantsToAnimate = animator.lotteryData.participants.filter((p: Participant) => p && p.name && namesToAnimate.includes(p.name));
  console.log('[Animation] participantsToAnimate:', participantsToAnimate);
  await preloadPrizeImages(animator.lotteryData.prizes);
  await preloadIcons(participantsToAnimate);
  const container = targetCtx.canvas.closest('.canvas-panzoom-container') as HTMLElement;
  if (!container) return;

  animator.containerElement = container;
  if (animator.resizeObserver) {
    animator.resizeObserver.disconnect();
  }
  animator.resizeObserver = new ResizeObserver(() => {
    if (!animator.containerElement || !animator.lotteryData) return;
    const newWidth = animator.containerElement.clientWidth;
    const newHeight = getTargetHeight(animator.containerElement);
    
    if (newWidth !== animator.lastContainerWidth || newHeight !== animator.lastContainerHeight) {
      const allLines = [...(animator.lotteryData.lines || []), ...(animator.lotteryData.doodles || [])];
      const allPaths = calculateAllPaths(animator.lotteryData.participants, allLines, newWidth, newHeight, animator.containerElement);

      animator.tracers.forEach((tracer: Tracer) => {
        const newPath = allPaths[tracer.slot];
        if (newPath) {
          tracer.path = newPath;
          if (tracer.isFinished) {
            const finalPoint = newPath[newPath.length - 1];
            tracer.x = finalPoint.x;
            tracer.y = finalPoint.y;
          }
        }
      });
      animator.lastContainerWidth = newWidth;
      animator.lastContainerHeight = newHeight;
    }
  });
  animator.resizeObserver.observe(container);

  const VIRTUAL_HEIGHT = getTargetHeight(container);
  const numParticipants = animator.lotteryData.participants.length;
  const allParticipantsWithNames = animator.lotteryData!.participants.filter((p: Participant) => p.name);
  const allLines = [...(animator.lotteryData!.lines || []), ...(animator.lotteryData!.doodles || [])];

  const allPaths = calculateAllPaths(animator.lotteryData!.participants, allLines, container.clientWidth, VIRTUAL_HEIGHT, container);

  const newTracers = participantsToAnimate.map((p: Participant) => {
    const path = allPaths[p.slot];
    console.log('[Animation] Creating tracer for', p.name, 'with path:', path);
    return {name: p.name!, slot: p.slot, color: p.color || '#333', path, pathIndex: 0, progress: 0, x: path[0].x, y: path[0].y, isFinished: false, celebrated: false};
  });
  const finishedTracers = animator.tracers.filter((t: Tracer) => t.isFinished);
  const uniqueFinishedTracers = finishedTracers.filter((t: Tracer) => !namesToAnimate.includes(t.name));
  animator.tracers = [...uniqueFinishedTracers, ...newTracers];
  animator.particles = [];
  animator.context = targetCtx;
  animator.onComplete = onComplete;
  animator.lastContainerWidth = container.clientWidth;
  animator.lastContainerHeight = VIRTUAL_HEIGHT;
  setTimeout(() => {
    const panzoomElement = targetCtx.canvas.parentElement!;
    const canvasWidth = panzoomElement.offsetWidth;
    const containerWidth = container.clientWidth;
    const scale = currentPanzoom.getScale();
    const currentPan = currentPanzoom.getPan();
    let finalX = currentPan.x;
    if (panToName) {
      const participant = animator.lotteryData!.participants.find((p: Participant) => p.name === panToName);
      if (participant) {
        const VIRTUAL_WIDTH = getVirtualWidth(numParticipants, containerWidth);
        const participantSpacing = VIRTUAL_WIDTH / (numParticipants + 1);
        const targetXOnCanvas = participantSpacing * (participant.slot + 1);
        let desiredX = containerWidth / 2 - targetXOnCanvas * scale;
        const scaledCanvasWidth = canvasWidth * scale;
        if (scaledCanvasWidth > containerWidth) {
          const minX = containerWidth - scaledCanvasWidth;
          finalX = Math.max(minX, Math.min(0, desiredX));
        } else {
          finalX = (containerWidth - scaledCanvasWidth) / 2;
        }
      }
    }
    currentPanzoom.pan(finalX, currentPan.y, {animate: true, duration: 600});
  }, 100);
  animator.running = true;
  animationLoop();
}

export function advanceLineByLine(onComplete: (() => void) | null = null) {
  if (animator.tracers.length === 0 || animator.running) return;

  // 全員が最終地点（ゴール）にいるかどうかの判定
  const allAtFinalDestination = animator.tracers.every((t: Tracer) => t.pathIndex >= t.path.length - 1);

  if (allAtFinalDestination) {
    // 全員ゴール済みの場合は初期位置にリセットする
    updateRevealedPrizes([]);
    animator.tracers.forEach((tracer: Tracer) => {
      tracer.pathIndex = 0;
      tracer.x = tracer.path[0].x;
      tracer.y = tracer.path[0].y;
      tracer.isFinished = false;
      tracer.celebrated = false;
      delete tracer.stopY;
    });
  }

  animator.onComplete = onComplete;
  let animationShouldStart = false;
  animator.tracers.forEach((tracer: Tracer) => {
    // まだゴールしていない場合、次の横線まで進める
    if (tracer.pathIndex < tracer.path.length - 1) {
      tracer.isFinished = false; 
      animationShouldStart = true;
      let nextYForThisTracer = Infinity;
      // 現在のパスインデックスから次の水平移動（Y座標の変更）を探す
      for (let i = tracer.pathIndex + 1; i < tracer.path.length; i++) {
        if (tracer.path[i].y > tracer.y + 0.1) {
          nextYForThisTracer = tracer.path[i].y;
          break;
        }
      }

      if (nextYForThisTracer !== Infinity) {
        // 次の横線を停止位置として設定
        tracer.stopY = nextYForThisTracer;
      } else {
        // 次の横線がない場合は一番下のゴール地点を停止位置とする
        tracer.stopY = tracer.path[tracer.path.length - 1].y;
      }
    } else {
      // 既にゴールしている場合は何もしない
      tracer.isFinished = true;
    }
  });

  if (animationShouldStart) {
    animator.running = true;
    animationLoop();
  } else if (onComplete) {
    onComplete();
  }
}

export async function resetAnimation(onComplete: (() => void) | null = null) {
  if (isAnimationRunning()) return;
  animator.onComplete = onComplete;
  updateRevealedPrizes([]);
  const container = animator.containerElement || (animator.context!.canvas.closest('.canvas-panzoom-container') as HTMLElement);
  if (!container) return;
  const VIRTUAL_HEIGHT = getTargetHeight(container);
  const allParticipantsWithNames = animator.lotteryData!.participants.filter((p: any) => p.name);
  await preloadIcons(allParticipantsWithNames);
  const allLines = [...(animator.lotteryData!.lines || []), ...(animator.lotteryData!.doodles || [])];

  const allPaths = calculateAllPaths(animator.lotteryData!.participants, allLines, container.clientWidth, VIRTUAL_HEIGHT, container);

  animator.tracers = allParticipantsWithNames.map((p: Participant) => {
    const path = allPaths[p.slot];
    return {
      name: p.name!,
      slot: p.slot,
      color: p.color || '#333',
      path,
      pathIndex: 0,
      x: path[0].x,
      y: path[0].y,
      isFinished: false,
      celebrated: false,
    };
  });
  animator.particles = [];
  animator.running = true;
  animationLoop();
}
