import { useEffect, useCallback, useRef } from 'react';
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

  const prepareStep = useCallback((canvasRef: React.RefObject<HTMLCanvasElement | null>, hidePrizes = false, showMask = true, isResize = false, storedState: any = null, keepRevealed = false, onlyTracerName: any = null) => {
    if (canvasRef.current) {
      return prepareStepAnimation(canvasRef.current.getContext('2d'), hidePrizes, showMask, isResize, storedState, keepRevealed, onlyTracerName);
    }
    return Promise.resolve();
  }, []);

  const start = useCallback((canvasRef: React.RefObject<HTMLCanvasElement | null>, userNames: string[], onComplete?: () => void, panToName?: string) => {
    if (canvasRef.current) {
      return startAnimation(canvasRef.current.getContext('2d'), userNames, onComplete, panToName);
    }
    return Promise.resolve();
  }, []);

  const fadePrizesEffect = useCallback((canvasRef: React.RefObject<HTMLCanvasElement | null>, show: boolean) => {
    if (canvasRef.current) {
      fadePrizes(canvasRef.current.getContext('2d'), show);
    }
  }, []);

  return { 
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
