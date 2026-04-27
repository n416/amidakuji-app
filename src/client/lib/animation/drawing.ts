

import {animator, isAnimationRunning, stopAnimation, updateRevealedPrizes} from './core';
import {calculateAllPaths, getTargetHeight, getVirtualWidth, getNameAreaHeight, calculatePrizeAreaHeight} from './path';
import {preloadIcons} from './setup';
import {Participant, Prize, Doodle, Line, Tracer, LotteryData, RevealedPrize} from './types';

export function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, lineLength: number, lineHeight: number) {
  if (!text) return;
  let currentY = y;
  for (let i = 0; i < text.length; i += lineLength) {
    const line = text.substring(i, i + lineLength);
    context.fillText(line, x, currentY);
    currentY += lineHeight;
  }
}

export function drawLotteryBase(targetCtx: CanvasRenderingContext2D, data: LotteryData, lineColor = '#ccc', hidePrizes = false) {
  if (!targetCtx || !targetCtx.canvas || !data || !data.participants || data.participants.length === 0) return;
  const container = targetCtx.canvas.closest('.canvas-panzoom-container');
  if (!container) return;
  const panzoomElement = targetCtx.canvas.parentElement;
  const {participants, prizes, lines, doodles} = data; // doodles を受け取る
  const numParticipants = participants.length;
  const containerWidth = container.clientWidth || 800;
  const VIRTUAL_WIDTH = getVirtualWidth(numParticipants, containerWidth);
  const VIRTUAL_HEIGHT = getTargetHeight(container);
  const canvas = targetCtx.canvas;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = VIRTUAL_WIDTH * dpr;
  canvas.height = VIRTUAL_HEIGHT * dpr;
  canvas.style.width = `${VIRTUAL_WIDTH}px`;
  canvas.style.height = `${VIRTUAL_HEIGHT}px`;
  targetCtx.scale(dpr, dpr);
  if (panzoomElement) {
    panzoomElement.style.width = `${VIRTUAL_WIDTH}px`;
    panzoomElement.style.height = `${VIRTUAL_HEIGHT}px`;
  }
  const participantSpacing = VIRTUAL_WIDTH / (numParticipants + 1);
  targetCtx.font = '14px Arial';
  targetCtx.textAlign = 'center';

  const isDarkMode = document.body.classList.contains('dark-mode');
  const mainTextColor = isDarkMode ? '#e0e0e0' : '#000';
  const subTextColor = isDarkMode ? '#888' : '#888';
  const prizeTextColor = isDarkMode ? '#e0e0e0' : '#333';

  const nameAreaHeight = getNameAreaHeight(container);
  const prizeAreaHeight = calculatePrizeAreaHeight(prizes);
  const lineTopY = nameAreaHeight;
  const lineBottomY = VIRTUAL_HEIGHT - prizeAreaHeight;
  const nameY = lineTopY / 2;

  participants.forEach((p: Participant, i: number) => {
    const x = participantSpacing * (i + 1);

    const isAdminView = targetCtx.canvas.id === 'adminCanvas';
    const displayName = p.name || `（参加枠 ${p.slot + 1}）`;

    targetCtx.fillStyle = p.name ? mainTextColor : subTextColor;
    targetCtx.fillText(displayName, x, nameY);
    const isRevealed = animator.revealedPrizes.some((r) => r.prizeIndex === i);
    if (prizes && prizes[i] && !isRevealed) {
      const prize = prizes[i];
      const actualPrizeName = typeof prize === 'object' ? prize.name : prize;
      const prizeName = hidePrizes ? '？？？' : actualPrizeName || '';
      const prizeImage = !hidePrizes && typeof prize === 'object' && (prize.imageUrl || prize.newImageFile) ? animator.prizeImages[prize.imageUrl!] : null;

      const prizeImageHeight = 35;
      const prizeAreaTopMargin = 30;
      const imageTextGap = 15;
      let prizeTextY;

      if (prizeImage && prizeImage.complete) {
        const prizeImageY = lineBottomY + prizeAreaTopMargin + prizeImageHeight / 2;
        prizeTextY = prizeImageY + prizeImageHeight / 2 + imageTextGap;
        targetCtx.drawImage(prizeImage, x - prizeImageHeight / 2, prizeImageY - prizeImageHeight / 2, prizeImageHeight, prizeImageHeight);
      } else {
        prizeTextY = lineBottomY + prizeAreaTopMargin + 18; // Adjust Y for text-only prizes
      }
      targetCtx.fillStyle = prizeTextColor;
      const lineHeight = 18;
      const maxLineLength = 5;
      wrapText(targetCtx, prizeName, x, prizeTextY, maxLineLength, lineHeight);
    }
  });

  targetCtx.strokeStyle = lineColor;
  targetCtx.lineWidth = 1.5;
  for (let i = 0; i < numParticipants; i++) {
    const x = participantSpacing * (i + 1);
    targetCtx.beginPath();
    targetCtx.moveTo(x, lineTopY);
    targetCtx.lineTo(x, lineBottomY);
    targetCtx.stroke();
  }

  const allLines = [...(lines || []), ...(doodles || [])]; // doodlesを結合

  if (allLines.length > 0) {
    const amidaDrawableHeight = lineBottomY - lineTopY;
    const sourceLineRange = 330 - 70;
    allLines.forEach((line: Line | Doodle) => {
      if (sourceLineRange <= 0) return;
      const startX = participantSpacing * (line.fromIndex + 1);
      const endX = participantSpacing * (line.toIndex + 1);
      const lineY = lineTopY + ((line.y - 70) / sourceLineRange) * amidaDrawableHeight;

      if ((line as Doodle).memberId) {
        // doodleの場合
        const participant = participants.find((p: Participant) => p.memberId === (line as Doodle).memberId);
        targetCtx.strokeStyle = participant?.color || '#ff00ff';
        targetCtx.lineWidth = 3;
      } else {
        // 通常の線
        targetCtx.strokeStyle = lineColor;
        targetCtx.lineWidth = 1.5;
      }

      targetCtx.beginPath();
      targetCtx.moveTo(startX, lineY);
      targetCtx.lineTo(endX, lineY);
      targetCtx.stroke();
    });
  }
}

function drawDoodleLine(targetCtx: CanvasRenderingContext2D, doodle: Doodle, color: string, isDashed = true) {
  if (!doodle || !animator.lotteryData) return;
  const {participants} = animator.lotteryData!;
  const numParticipants = participants.length;
  const container = targetCtx.canvas.closest('.canvas-panzoom-container');
  if (!container) return;
  const VIRTUAL_WIDTH = getVirtualWidth(numParticipants, container.clientWidth);
  const participantSpacing = VIRTUAL_WIDTH / (numParticipants + 1);

  targetCtx.strokeStyle = color;
  targetCtx.lineWidth = 3;
  if (isDashed) {
    targetCtx.setLineDash([5, 5]);
  }

  const nameAreaHeight = getNameAreaHeight(container);
  const prizeAreaHeight = calculatePrizeAreaHeight(animator.lotteryData.prizes);
  const lineTopY = nameAreaHeight;
  const lineBottomY = getTargetHeight(container) - prizeAreaHeight;
  const amidaDrawableHeight = lineBottomY - lineTopY;
  const sourceLineRange = 330 - 70;

  const startX = participantSpacing * (doodle.fromIndex + 1);
  const endX = participantSpacing * (doodle.toIndex + 1);
  const lineY = lineTopY + ((doodle.y - 70) / sourceLineRange) * amidaDrawableHeight;

  targetCtx.beginPath();
  targetCtx.moveTo(startX, lineY);
  targetCtx.lineTo(endX, lineY);
  targetCtx.stroke();

  if (isDashed) {
    targetCtx.setLineDash([]);
  }
}

export function drawDoodlePreview(targetCtx: CanvasRenderingContext2D, doodle: Doodle) {
  const myParticipant = animator.lotteryData!.participants.find((p: Participant) => p.memberId === animator.participantId);
  const color = myParticipant?.color || '#ff00ff';
  drawDoodleLine(targetCtx, doodle, color, true);
}

export function drawDoodleHoverPreview(targetCtx: CanvasRenderingContext2D, doodle: Doodle) {
  const color = '#cccccc';
  drawDoodleLine(targetCtx, doodle, color, true);
}

export function drawTracerPath(targetCtx: CanvasRenderingContext2D, tracer: Tracer) {
  targetCtx.strokeStyle = tracer.color;
  targetCtx.lineWidth = 4;
  targetCtx.lineCap = 'round';
  targetCtx.shadowColor = tracer.color;
  targetCtx.shadowBlur = 15;
  targetCtx.beginPath();
  targetCtx.moveTo(tracer.path[0].x, tracer.path[0].y);
  for (let i = 1; i <= tracer.pathIndex; i++) {
    targetCtx.lineTo(tracer.path[i].x, tracer.path[i].y);
  }
  targetCtx.lineTo(tracer.x, tracer.y);
  targetCtx.stroke();
  targetCtx.shadowColor = 'transparent';
  targetCtx.shadowBlur = 0;
}

export function drawTracerIcon(targetCtx: CanvasRenderingContext2D, tracer: Tracer) {
  const container = targetCtx.canvas.closest('.canvas-panzoom-container');
  if (!container) return;
  const VIRTUAL_HEIGHT = getTargetHeight(container);
  const iconSize = Math.min(VIRTUAL_HEIGHT * 0.06, 30);
  const icon = animator.icons[tracer.name];
  targetCtx.save();
  targetCtx.beginPath();
  targetCtx.arc(tracer.x, tracer.y, iconSize / 2 + 2, 0, Math.PI * 2, true);
  targetCtx.fillStyle = 'white';
  targetCtx.fill();
  targetCtx.lineWidth = 2;
  targetCtx.strokeStyle = tracer.color;
  targetCtx.stroke();
  targetCtx.clip();
  if (icon) {
    targetCtx.drawImage(icon, tracer.x - iconSize / 2, tracer.y - iconSize / 2, iconSize, iconSize);
  } else {
    targetCtx.beginPath();
    targetCtx.arc(tracer.x, tracer.y, iconSize / 2, 0, Math.PI * 2, true);
    targetCtx.fillStyle = tracer.color;
    targetCtx.fill();
  }
  targetCtx.restore();
}

export function drawRevealedPrizes(targetCtx: CanvasRenderingContext2D) {
  const container = targetCtx.canvas.closest('.canvas-panzoom-container');
  if (!container) return;
  const VIRTUAL_HEIGHT = getTargetHeight(container);
  const numParticipants = animator.lotteryData!.participants.length;
  const VIRTUAL_WIDTH = getVirtualWidth(numParticipants, container.clientWidth);
  const participantSpacing = VIRTUAL_WIDTH / (numParticipants + 1);
  const isDarkMode = document.body.classList.contains('dark-mode');
  targetCtx.fillStyle = isDarkMode ? '#e0e0e0' : '#333';
  const prizeAreaHeight = calculatePrizeAreaHeight(animator.lotteryData?.prizes);
  const lineBottomY = VIRTUAL_HEIGHT - prizeAreaHeight;
  animator.revealedPrizes.forEach((result) => {
    const prize = result.prize;
    const actualPrizeName = typeof prize === 'object' ? prize.name : prize;
    const prizeName = actualPrizeName || '';
    const prizeImage = typeof prize === 'object' && prize.imageUrl ? animator.prizeImages[prize.imageUrl!] : null;
    const x = participantSpacing * (result.prizeIndex + 1);

    const prizeImageHeight = 35;
    const prizeAreaTopMargin = 30;
    const imageTextGap = 15;
    let prizeTextY;

    const REVEAL_DURATION = 15;
    let scale = 1.0;
    if (result.revealProgress < REVEAL_DURATION) {
      result.revealProgress++;
      const t = result.revealProgress / REVEAL_DURATION;
      scale = 1.0 + 0.5 * Math.sin(t * Math.PI);
    }
    const imageSize = prizeImageHeight * scale;

    if (prizeImage && prizeImage.complete) {
      const prizeImageY = lineBottomY + prizeAreaTopMargin + prizeImageHeight / 2;
      prizeTextY = prizeImageY + prizeImageHeight / 2 + imageTextGap;
      targetCtx.drawImage(prizeImage, x - imageSize / 2, prizeImageY - imageSize / 2, imageSize, imageSize);
    } else {
      prizeTextY = lineBottomY + prizeAreaTopMargin + 18; // Adjust Y for text-only prizes
    }
    wrapText(targetCtx, prizeName, x, prizeTextY, 5, 18);
  });
}

export async function showAllTracersInstantly() {
  if (isAnimationRunning()) stopAnimation();
  const targetCtx = animator.context;
  if (!targetCtx || !animator.lotteryData) return;

  const container = targetCtx.canvas.closest('.canvas-panzoom-container');
  if (!container) return;
  const allParticipantsWithNames = animator.lotteryData.participants.filter((p: Participant) => p.name);

  await preloadIcons(allParticipantsWithNames);

  const VIRTUAL_HEIGHT = getTargetHeight(container);
  const numParticipants = animator.lotteryData.participants.length;
  const allResults = animator.lotteryData.results;
  const allPrizes = animator.lotteryData.prizes;
  if (allResults && allPrizes) {
    const allRevealedPrizes = Object.keys(allResults)
      .map((participantName: string) => {
        const result = allResults[participantName];
        if (!result) return null;
        const prizeIndex = result.prizeIndex;
        const realPrize = allPrizes[prizeIndex];
        if (typeof prizeIndex !== 'undefined' && prizeIndex > -1 && realPrize) {
          return {
            participantName,
            prize: realPrize,
            prizeIndex,
            revealProgress: 15,
          } as RevealedPrize;
        }
        return null;
      })
      .filter((item): item is RevealedPrize => item !== null);
    updateRevealedPrizes(allRevealedPrizes);
  }
  const allLines = [...(animator.lotteryData.lines || []), ...(animator.lotteryData.doodles || [])];
  const allPaths = calculateAllPaths(animator.lotteryData.participants, allLines, container.clientWidth, VIRTUAL_HEIGHT, container);
  animator.tracers = allParticipantsWithNames.map((p: Participant) => {
    const path = allPaths[p.slot];
    const finalPoint = path[path.length - 1];
    return {
      name: p.name!,
      slot: p.slot,
      color: p.color || '#333',
      path,
      pathIndex: path.length - 1,
      x: finalPoint.x,
      y: finalPoint.y,
      isFinished: true,
      celebrated: true,
    };
  });

  targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
  const isDarkMode = document.body.classList.contains('dark-mode');
  const baseLineColor = isDarkMode ? '#dcdcdc' : '#333';
  const hidePrizes = animator.lotteryData.displayMode === 'private' && animator.lotteryData.status !== 'started';
  drawLotteryBase(targetCtx, animator.lotteryData, baseLineColor, hidePrizes);

  // ▼▼▼ ここからが今回の修正点です ▼▼▼

  // 1. まず、すべてのトレーサーの軌跡（パス）を描画します
  animator.tracers.forEach((tracer: Tracer) => {
    drawTracerPath(targetCtx, tracer);
  });

  // 2. 次に、すべてのトレーサーのアイコンを描画します
  animator.tracers.forEach((tracer: Tracer) => {
    drawTracerIcon(targetCtx, tracer);
  });

  // ▲▲▲ ここまでが修正点です ▲▲▲

  drawRevealedPrizes(targetCtx);
}


