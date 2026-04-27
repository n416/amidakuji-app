import React, { useEffect, useRef } from 'react';

interface BackgroundGridProps {
  animation: boolean;
}

export const BackgroundGrid: React.FC<BackgroundGridProps> = ({ animation }) => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const animCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    const animationCanvas = animCanvasRef.current;
    if (!gridCanvas || !animationCanvas) return;

    const gridCtx = gridCanvas.getContext('2d');
    const animationCtx = animationCanvas.getContext('2d');
    if (!gridCtx || !animationCtx) return;

    const SCROLL_SPEED = 0.25;
    const CYCLE_COUNT = 5;
    const GRID_SIZE = 50;
    const TURN_CHANCE = 0.3;
    const CYCLE_SPEED = 8;
    const LINE_WIDTH = 1;
    const TAIL_LENGTH = 45;

    // Use light mode theme as default for now
    const currentTheme = { background: '#f4f7f6', cycleColorRGB: '255, 140, 0', gridColor: '#ddd' };

    let scrollX = 0;
    let scrollY = 0;
    let animationId: number;

    const resizeCanvases = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      gridCanvas.width = animationCanvas.width = width;
      gridCanvas.height = animationCanvas.height = height;
    };

    const drawGrid = () => {
      gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
      gridCtx.save();
      gridCtx.translate(scrollX % GRID_SIZE, scrollY % GRID_SIZE);
      gridCtx.strokeStyle = currentTheme.gridColor;
      gridCtx.lineWidth = 1;
      gridCtx.beginPath();
      for (let x = -GRID_SIZE; x < gridCanvas.width + GRID_SIZE; x += GRID_SIZE) {
        gridCtx.moveTo(x, -GRID_SIZE);
        gridCtx.lineTo(x, gridCanvas.height + GRID_SIZE);
      }
      for (let y = -GRID_SIZE; y < gridCanvas.height + GRID_SIZE; y += GRID_SIZE) {
        gridCtx.moveTo(-GRID_SIZE, y);
        gridCtx.lineTo(gridCanvas.width + GRID_SIZE, y);
      }
      gridCtx.stroke();
      gridCtx.restore();
    };

    class LightCycle {
      speed = CYCLE_SPEED;
      colorRGB = currentTheme.cycleColorRGB;
      tail: {x: number, y: number}[] = [];
      x = 0; y = 0; targetX = 0; targetY = 0; dx = 0; dy = 0;

      constructor() {
        this.reset();
      }
      reset() {
        this.tail = [];
        const edge = Math.floor(Math.random() * 4);
        let startX, startY;
        const viewWidth = animationCanvas!.width;
        const viewHeight = animationCanvas!.height;
        if (edge === 0) {
          startX = -scrollX + Math.random() * viewWidth;
          startY = -scrollY;
        } else if (edge === 1) {
          startX = -scrollX + viewWidth;
          startY = -scrollY + Math.random() * viewHeight;
        } else if (edge === 2) {
          startX = -scrollX + Math.random() * viewWidth;
          startY = -scrollY + viewHeight;
        } else {
          startX = -scrollX;
          startY = -scrollY + Math.random() * viewHeight;
        }
        this.x = Math.round(startX / GRID_SIZE) * GRID_SIZE;
        this.y = Math.round(startY / GRID_SIZE) * GRID_SIZE;
        this.targetX = this.x;
        this.targetY = this.y;
        if (edge === 0) { this.dx = 0; this.dy = 1; }
        else if (edge === 1) { this.dx = -1; this.dy = 0; }
        else if (edge === 2) { this.dx = 0; this.dy = -1; }
        else { this.dx = 1; this.dy = 0; }
      }
      update() {
        if (this.x === this.targetX && this.y === this.targetY) {
          if (Math.random() < TURN_CHANCE) {
            const isHorizontal = this.dx !== 0;
            if (isHorizontal) {
              this.dx = 0;
              this.dy = Math.random() < 0.5 ? 1 : -1;
            } else {
              this.dx = Math.random() < 0.5 ? 1 : -1;
              this.dy = 0;
            }
          }
          this.targetX += this.dx * GRID_SIZE;
          this.targetY += this.dy * GRID_SIZE;
        }
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
        if (this.dx > 0) this.x = Math.min(this.x, this.targetX);
        if (this.dx < 0) this.x = Math.max(this.x, this.targetX);
        if (this.dy > 0) this.y = Math.min(this.y, this.targetY);
        if (this.dy < 0) this.y = Math.max(this.y, this.targetY);

        this.tail.unshift({x: this.x, y: this.y});
        if (this.tail.length > TAIL_LENGTH) {
          this.tail.pop();
        }

        const margin = GRID_SIZE * 2;
        const viewLeft = -scrollX - margin;
        const viewRight = -scrollX + animationCanvas!.width + margin;
        const viewTop = -scrollY - margin;
        const viewBottom = -scrollY + animationCanvas!.height + margin;
        if (this.x < viewLeft || this.x > viewRight || this.y < viewTop || this.y > viewBottom) {
          this.reset();
        }
      }
      draw(currentScrollX: number, currentScrollY: number) {
        for (let i = 0; i < this.tail.length - 1; i++) {
          const p1 = this.tail[i];
          const p2 = this.tail[i + 1];
          const alpha = 1.0 - i / this.tail.length;

          animationCtx!.strokeStyle = `rgba(${this.colorRGB}, ${alpha})`;
          animationCtx!.lineWidth = LINE_WIDTH;
          animationCtx!.shadowColor = `rgba(${this.colorRGB}, ${alpha})`;
          animationCtx!.shadowBlur = 15;
          animationCtx!.lineCap = 'round';

          animationCtx!.beginPath();
          animationCtx!.moveTo(p1.x + currentScrollX, p1.y + currentScrollY);
          animationCtx!.lineTo(p2.x + currentScrollX, p2.y + currentScrollY);
          animationCtx!.stroke();
        }
      }
    }

    const cycles: LightCycle[] = [];
    for (let i = 0; i < CYCLE_COUNT; i++) {
      cycles.push(new LightCycle());
    }

    const animate = () => {
      scrollX -= SCROLL_SPEED;
      scrollY -= SCROLL_SPEED;

      drawGrid();

      animationCtx.clearRect(0, 0, animationCanvas.width, animationCanvas.height);
      cycles.forEach((cycle) => {
        cycle.update();
        cycle.draw(scrollX, scrollY);
      });

      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvases);
    resizeCanvases();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvases);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div id="canvas-container" style={{ display: animation ? 'block' : 'none' }}>
      <canvas id="grid-canvas" ref={gridCanvasRef}></canvas>
      <canvas id="animation-canvas" ref={animCanvasRef}></canvas>
    </div>
  );
};
