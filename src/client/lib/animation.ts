// @ts-nocheck
import {startAnimation, stopAnimation, isAnimationRunning, resetAnimation, advanceLineByLine, clearAnimationState, animator, setAnimatorState} from './animation/core';
import {drawLotteryBase, drawTracerPath, drawTracerIcon, drawRevealedPrizes, wrapText, showAllTracersInstantly} from './animation/drawing';
import {calculatePath, getVirtualWidth, getTargetHeight, calculatePrizeAreaHeight, getNameAreaHeight, calculateClientSideResults} from './animation/path';
import {prepareStepAnimation, initializePanzoom, preloadIcons, preloadPrizeImages, handleResize, adminPanzoom, participantPanzoom} from './animation/setup';
import {Particle, createSparks, celebrate} from './animation/effects';

let prizeFadeAnimationId;
let currentPrizeAlpha = 0;

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★★★ ここからが修正点 ★★★
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★
function drawPrizesOnly(targetCtx, hidePrizes) {
  if (!targetCtx || !targetCtx.canvas || !animator.lotteryData) return;

  const {participants, prizes} = animator.lotteryData;
  const container = targetCtx.canvas.closest('.canvas-panzoom-container');
  if (!container) return;
  const numParticipants = participants.length;
  const VIRTUAL_WIDTH = getVirtualWidth(numParticipants, container.clientWidth);
  const VIRTUAL_HEIGHT = getTargetHeight(container);
  const participantSpacing = VIRTUAL_WIDTH / (numParticipants + 1);
  const prizeAreaHeight = calculatePrizeAreaHeight(prizes);
  const lineBottomY = VIRTUAL_HEIGHT - prizeAreaHeight;
  const isDarkMode = document.body.classList.contains('dark-mode');
  const prizeTextColor = isDarkMode ? '#e0e0e0' : '#333';

  // Clear only the prize area
  targetCtx.clearRect(0, lineBottomY, VIRTUAL_WIDTH, prizeAreaHeight);

  // Redraw prizes
  prizes.forEach((prize, i) => {
    const isRevealed = animator.revealedPrizes.some((r) => r.prizeIndex === i);
    if (!isRevealed) {
      const x = participantSpacing * (i + 1);
      const actualPrizeName = typeof prize === 'object' ? prize.name : prize;
      const prizeName = hidePrizes ? '？？？' : actualPrizeName || '';
      const prizeImage = !hidePrizes && typeof prize === 'object' && prize.imageUrl ? animator.prizeImages[prize.imageUrl] : null;

      const prizeImageHeight = 35;
      const prizeAreaTopMargin = 30;
      const imageTextGap = 15;
      let prizeTextY;

      if (prizeImage && prizeImage.complete) {
        const prizeImageY = lineBottomY + prizeAreaTopMargin + prizeImageHeight / 2;
        prizeTextY = prizeImageY + prizeImageHeight / 2 + imageTextGap;
        targetCtx.drawImage(prizeImage, x - prizeImageHeight / 2, prizeImageY - prizeImageHeight / 2, prizeImageHeight, prizeImageHeight);
      } else {
        prizeTextY = lineBottomY + prizeAreaTopMargin + 18;
      }
      targetCtx.fillStyle = prizeTextColor;
      wrapText(targetCtx, prizeName, x, prizeTextY, 5, 18);
    }
  });

  // Redraw any revealed prizes that might be in this area
  drawRevealedPrizes(targetCtx);
}

export function fadePrizes(targetCtx, show) {
  if (!targetCtx || !targetCtx.canvas) return;
  cancelAnimationFrame(prizeFadeAnimationId);

  const duration = 200;
  let start = null;
  const startAlpha = currentPrizeAlpha;
  const endAlpha = show ? 1 : 0;

  if (startAlpha === endAlpha) {
    if (!show) drawPrizesOnly(targetCtx, true);
    return;
  }

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const ratio = Math.min(progress / duration, 1);

    const alpha = startAlpha + (endAlpha - startAlpha) * ratio;
    currentPrizeAlpha = alpha;

    targetCtx.globalAlpha = alpha;
    drawPrizesOnly(targetCtx, false); // Always draw names when fading in/out
    targetCtx.globalAlpha = 1;

    if (progress < duration) {
      prizeFadeAnimationId = requestAnimationFrame(step);
    } else {
      currentPrizeAlpha = endAlpha;
      // Ensure final state is drawn correctly
      if (!show) {
        drawPrizesOnly(targetCtx, true);
      }
    }
  }

  prizeFadeAnimationId = requestAnimationFrame(step);
}

export {startAnimation, stopAnimation, isAnimationRunning, resetAnimation, advanceLineByLine, clearAnimationState, prepareStepAnimation, showAllTracersInstantly, adminPanzoom, participantPanzoom, setAnimatorState};


