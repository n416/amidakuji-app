import { useEffect, useCallback, useRef, useState } from 'react';
import { 
  startAnimation, 
  stopAnimation, 
  resetAnimation, 
  advanceLineByLine, 
  clearAnimationState, 
  isAnimationRunning, 
  setAnimatorState, 
  fadePrizes 
} from '../lib/animation';
import { prepareStepAnimation } from '../lib/animation/setup';

export interface UseAmidaAnimationProps {
  lotteryData: any;
  onRevealedPrizesChange?: (prizes: any[]) => void;
}

export function useAmidaAnimation(props: UseAmidaAnimationProps) {
  const { lotteryData, onRevealedPrizesChange } = props;
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    setAnimatorState({ 
      lotteryData,
      setRevealedPrizesCallback: onRevealedPrizesChange 
    });
  }, [lotteryData, onRevealedPrizesChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAnimation();
      clearAnimationState();
    };
  }, []);

  const prepareStep = useCallback(async (canvasRef: React.RefObject<HTMLCanvasElement | null>, hidePrizes = false, showMask = true, isResize = false, storedState: any = null, keepRevealed = false, onlyTracerName: any = null) => {
    if (showMask && !isResize) setIsPreparing(true);
    if (canvasRef.current) {
      await prepareStepAnimation(canvasRef.current.getContext('2d')!, hidePrizes, showMask, isResize, storedState, keepRevealed, onlyTracerName);
    }
    if (showMask && !isResize) {
      setTimeout(() => setIsPreparing(false), 50);
    }
  }, []);

  const start = useCallback((canvasRef: React.RefObject<HTMLCanvasElement | null>, userNames: string[], onComplete?: () => void, panToName?: string) => {
    if (canvasRef.current) {
      return startAnimation(canvasRef.current.getContext('2d')!, userNames, onComplete, panToName);
    }
    return Promise.resolve();
  }, []);

  const fadePrizesEffect = useCallback((canvasRef: React.RefObject<HTMLCanvasElement | null>, show: boolean) => {
    if (canvasRef.current) {
      fadePrizes(canvasRef.current.getContext('2d')!, show);
    }
  }, []);

  return { 
    isPreparing,
    prepareStep,
    start, 
    stop: stopAnimation, 
    reset: resetAnimation, 
    advanceLine: advanceLineByLine,
    isRunning: isAnimationRunning,
    fadePrizes: fadePrizesEffect,
    clear: clearAnimationState,
    updateData: (data: any) => setAnimatorState({ lotteryData: data }),
    setAnimatorState
  };
}
