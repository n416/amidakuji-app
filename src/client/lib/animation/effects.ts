// パーティクルや紙吹雪などの視覚効果に関するロジック
import confetti from 'canvas-confetti';
import { animator } from './core';

export class Particle {
  x: number;
  y: number;
  color: string;
  type: string;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  life: number;

  constructor(x: number, y: number, color: string, type: string = 'trail') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.type = type;
    this.size = Math.random() * 2 + 1;
    this.alpha = 1;
    if (type === 'spark') {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = 30;
    } else {
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.life = 50;
    }
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.life < 20) {
      this.alpha = this.life / 20;
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export function createSparks(x: number, y: number, color: string) {
  for (let i = 0; i < 20; i++) {
    animator.particles.push(new Particle(x, y, color, 'spark'));
  }
}

export function celebrate(originX: number, color: string) {
  const container = animator.context?.canvas.closest('.canvas-panzoom-container');
  if (!container) return;

  const panzoom = animator.panzoom;
  if (!panzoom) return;

  const rect = container.getBoundingClientRect();
  const scale = panzoom.getScale();
  const pan = panzoom.getPan();

  // 仮想キャンバス上の座標を画面上の座標に変換
  const screenX = rect.left + originX * scale + pan.x;

  // 画面上の座標をビューポートの割合(0~1)に正規化
  const x = screenX / window.innerWidth;

  confetti({ particleCount: 100, spread: 70, origin: { x: x, y: 0.8 }, colors: [color, '#ffffff'] });
}
