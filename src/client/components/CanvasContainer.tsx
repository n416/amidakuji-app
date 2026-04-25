import React, { useRef, useEffect } from 'react';

export const CanvasContainer: React.FC = () => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationCanvasRef = useRef<HTMLCanvasElement>(null);

  // キャンバスの初期化とネイティブイベントのバインディング（ドラッグ操作用）
  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    const animCanvas = animationCanvasRef.current;
    if (!gridCanvas || !animCanvas) return;

    // TODO: 後続フェーズで、既存の animation.js や drag 操作のロジックをここに移植します
    // 例: animCanvas.addEventListener('pointerdown', handlePointerDown);
    
    // ウィンドウリサイズ時のキャンバスサイズ調整などのネイティブ処理もここに実装します。
    // Reactの再レンダリングサイクルの外で管理することで、パフォーマンスを最大化します。

    return () => {
      // クリーンアップ処理
    };
  }, []);

  return (
    <div id="canvas-container">
      <canvas id="grid-canvas" ref={gridCanvasRef}></canvas>
      <canvas id="animation-canvas" ref={animationCanvasRef}></canvas>
    </div>
  );
};
