import { GameState, GameMode, Direction, SnakeSegment, FoodItem, PowerUp } from '../types';
import { getComboMultiplier, POWER_UP_CONFIG, getEatenMessage } from '../utils/constants';

const GRID_SIZE = 20;
const INITIAL_SPEED = 120;
const COMBO_TIMEOUT = 2000;

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onCombo: (combo: number, multiplier: number) => void;
  onFriendEaten: (friendIndex: number, message: string) => void;
  onPowerUp: (type: string) => void;
  onGameOver: (finalState: GameState) => void;
  onAchievement: (type: string) => void;
  playSound: (name: 'eat' | 'combo' | 'powerup' | 'gameover') => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private callbacks: GameCallbacks;
  private animationId: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private playerImage: HTMLImageElement | null = null;
  private friendImages: HTMLImageElement[] = [];
  private friendNames: string[] = [];
  private canvasWidth: number;
  private canvasHeight: number;
  private tileSize: number;
  private tilesX: number;
  private tilesY: number;
  private comboResetTimer: number = 0;
  private gameTime: number = 0;
  private timeAttackRemaining: number = 60;
  private powerUpSpawnTimer: number = 0;
  private shakeTimer: number = 0;
  private messageQueue: { text: string; timer: number; y: number }[] = [];
  private survivalSpeedTimer: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    mode: GameMode,
    callbacks: GameCallbacks
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;

    // Size canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.tileSize = Math.floor(Math.min(this.canvasWidth, this.canvasHeight) / GRID_SIZE);
    this.tilesX = Math.floor(this.canvasWidth / this.tileSize);
    this.tilesY = Math.floor(this.canvasHeight / this.tileSize);

    this.state = this.createInitialState(mode);
  }

  private createInitialState(mode: GameMode): GameState {
    const centerX = Math.floor(this.tilesX / 2);
    const centerY = Math.floor(this.tilesY / 2);
    return {
      snake: [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY },
      ],
      foods: [],
      powerUps: [],
      score: 0,
      combo: 0,
      comboTimer: 0,
      friendsEaten: 0,
      timeSurvived: 0,
      speed: INITIAL_SPEED,
      direction: 'right',
      nextDirection: 'right',
      isRunning: false,
      isGameOver: false,
      isPaused: false,
      mode,
      activePowerUps: [],
      shieldActive: false,
      magnetActive: false,
      doublePointsActive: false,
    };
  }

  setPlayerImage(img: HTMLImageElement) {
    this.playerImage = img;
  }

  setFriendImages(images: HTMLImageElement[], names: string[]) {
    this.friendImages = images;
    this.friendNames = names;
  }

  setDirection(dir: Direction) {
    const opposites: Record<Direction, Direction> = {
      up: 'down', down: 'up', left: 'right', right: 'left',
    };
    if (dir !== opposites[this.state.direction]) {
      this.state.nextDirection = dir;
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  start() {
    if (this.friendImages.length === 0) return;
    this.state.isRunning = true;
    this.state.isGameOver = false;
    this.spawnFood();
    if (this.state.mode === 'chaos') {
      for (let i = 0; i < 4; i++) this.spawnFood();
    }
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  pause() { this.state.isPaused = !this.state.isPaused; }
  
  stop() {
    this.state.isRunning = false;
    cancelAnimationFrame(this.animationId);
  }

  restart() {
    this.stop();
    this.state = this.createInitialState(this.state.mode);
    this.messageQueue = [];
    this.gameTime = 0;
    this.timeAttackRemaining = 60;
    this.powerUpSpawnTimer = 0;
    this.survivalSpeedTimer = 0;
  }

  private loop = (timestamp: number) => {
    if (!this.state.isRunning) return;
    this.animationId = requestAnimationFrame(this.loop);

    if (this.state.isPaused) {
      this.lastTime = timestamp;
      this.draw();
      return;
    }

    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.accumulator += dt;
    this.gameTime += dt;
    this.state.timeSurvived = this.gameTime / 1000;

    // Time Attack countdown
    if (this.state.mode === 'time-attack') {
      this.timeAttackRemaining = 60 - this.gameTime / 1000;
      if (this.timeAttackRemaining <= 0) {
        this.gameOver();
        return;
      }
    }

    // Survival mode speed ramp
    if (this.state.mode === 'survival') {
      this.survivalSpeedTimer += dt;
      if (this.survivalSpeedTimer > 3000) {
        this.state.speed = Math.max(40, this.state.speed - 3);
        this.survivalSpeedTimer = 0;
      }
    }

    // Combo timer
    if (this.state.combo > 0) {
      this.comboResetTimer += dt;
      if (this.comboResetTimer > COMBO_TIMEOUT) {
        this.state.combo = 0;
        this.comboResetTimer = 0;
      }
    }

    // Power-up spawn
    this.powerUpSpawnTimer += dt;
    if (this.powerUpSpawnTimer > 12000 && this.state.powerUps.length < 2) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = 0;
    }

    // Update active power-ups
    this.state.activePowerUps = this.state.activePowerUps
      .map(p => ({ ...p, remainingTime: p.remainingTime - dt }))
      .filter(p => p.remainingTime > 0);
    
    this.state.shieldActive = this.state.activePowerUps.some(p => p.type === 'shield');
    this.state.magnetActive = this.state.activePowerUps.some(p => p.type === 'magnet');
    this.state.doublePointsActive = this.state.activePowerUps.some(p => p.type === 'double');

    // Shake timer
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    // Messages
    this.messageQueue = this.messageQueue
      .map(m => ({ ...m, timer: m.timer - dt, y: m.y - 0.5 }))
      .filter(m => m.timer > 0);

    // AI mode
    if (this.state.mode === 'ai') this.aiMove();

    // Fixed timestep game update
    const effectiveSpeed = this.state.activePowerUps.some(p => p.type === 'speed')
      ? this.state.speed * 0.6
      : this.state.activePowerUps.some(p => p.type === 'freeze')
      ? this.state.speed * 1.5
      : this.state.speed;

    while (this.accumulator >= effectiveSpeed) {
      this.update();
      this.accumulator -= effectiveSpeed;
    }

    this.draw();
  };

  private update() {
    this.state.direction = this.state.nextDirection;
    const head = this.state.snake[0];
    const dx: Record<Direction, number> = { up: 0, down: 0, left: -1, right: 1 };
    const dy: Record<Direction, number> = { up: -1, down: 1, left: 0, right: 0 };
    const newHead: SnakeSegment = {
      x: head.x + dx[this.state.direction],
      y: head.y + dy[this.state.direction],
    };

    // Magnet: attract food
    if (this.state.magnetActive) {
      this.state.foods.forEach(food => {
        const fdx = head.x - food.x;
        const fdy = head.y - food.y;
        if (Math.abs(fdx) <= 5 && Math.abs(fdy) <= 5) {
          food.x += Math.sign(fdx);
          food.y += Math.sign(fdy);
        }
      });
    }

    // Wall collision
    if (newHead.x < 0 || newHead.x >= this.tilesX || newHead.y < 0 || newHead.y >= this.tilesY) {
      if (this.state.mode === 'wrap') {
        newHead.x = (newHead.x + this.tilesX) % this.tilesX;
        newHead.y = (newHead.y + this.tilesY) % this.tilesY;
      } else if (this.state.shieldActive) {
        this.state.activePowerUps = this.state.activePowerUps.filter(p => p.type !== 'shield');
        this.state.shieldActive = false;
        // Wrap around instead
        newHead.x = (newHead.x + this.tilesX) % this.tilesX;
        newHead.y = (newHead.y + this.tilesY) % this.tilesY;
      } else {
        this.gameOver();
        return;
      }
    }

    // Self collision
    for (let i = 0; i < this.state.snake.length; i++) {
      if (newHead.x === this.state.snake[i].x && newHead.y === this.state.snake[i].y) {
        if (this.state.shieldActive) {
          this.state.activePowerUps = this.state.activePowerUps.filter(p => p.type !== 'shield');
          this.state.shieldActive = false;
        } else {
          this.gameOver();
          return;
        }
      }
    }

    this.state.snake.unshift(newHead);

    // Food collision
    let ate = false;
    this.state.foods = this.state.foods.filter(food => {
      if (newHead.x === food.x && newHead.y === food.y) {
        ate = true;
        this.state.friendsEaten++;
        this.state.combo++;
        this.comboResetTimer = 0;

        const comboData = getComboMultiplier(this.state.combo);
        const basePoints = 10;
        const points = basePoints * comboData.multiplier * (this.state.doublePointsActive ? 2 : 1);
        this.state.score += points;

        const msg = getEatenMessage(this.friendNames[food.friendIndex]);
        this.messageQueue.push({
          text: msg,
          timer: 2000,
          y: food.y * this.tileSize,
        });

        this.callbacks.onScoreChange(this.state.score);
        this.callbacks.onFriendEaten(food.friendIndex, msg);
        this.callbacks.playSound('eat');

        if (this.state.combo >= 2) {
          this.callbacks.onCombo(this.state.combo, comboData.multiplier);
          this.callbacks.playSound('combo');
          this.shakeTimer = 300;
        }

        // Speed up slightly
        if (this.state.mode === 'classic') {
          this.state.speed = Math.max(50, this.state.speed - 1);
        }

        return false;
      }
      return true;
    });

    if (!ate) {
      this.state.snake.pop();
    } else {
      this.spawnFood();
      if (this.state.mode === 'chaos') this.spawnFood();
    }

    // Power-up collision
    this.state.powerUps = this.state.powerUps.filter(pu => {
      if (newHead.x === pu.x && newHead.y === pu.y) {
        this.activatePowerUp(pu);
        return false;
      }
      return true;
    });
  }

  private activatePowerUp(pu: PowerUp) {
    const config = POWER_UP_CONFIG[pu.type];
    this.state.activePowerUps.push({
      type: pu.type,
      remainingTime: config.duration,
    });
    this.callbacks.onPowerUp(config.name);
    this.callbacks.playSound('powerup');
  }

  private spawnFood() {
    if (this.friendImages.length === 0) return;
    let x: number, y: number;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * this.tilesX);
      y = Math.floor(Math.random() * this.tilesY);
      attempts++;
    } while (
      attempts < 100 &&
      (this.state.snake.some(s => s.x === x && s.y === y) ||
       this.state.foods.some(f => f.x === x && f.y === y))
    );

    const friendIndex = Math.floor(Math.random() * this.friendImages.length);
    this.state.foods.push({ x, y, friendIndex });
  }

  private spawnPowerUp() {
    let x: number, y: number;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * this.tilesX);
      y = Math.floor(Math.random() * this.tilesY);
      attempts++;
    } while (
      attempts < 100 &&
      (this.state.snake.some(s => s.x === x && s.y === y) ||
       this.state.foods.some(f => f.x === x && f.y === y))
    );

    const types: PowerUp['type'][] = ['speed', 'double', 'magnet', 'shield', 'freeze'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWER_UP_CONFIG[type];
    this.state.powerUps.push({
      type, x, y, active: false, duration: config.duration,
      icon: config.icon, color: config.color,
    });
  }

  private aiMove() {
    if (this.state.foods.length === 0) return;
    const head = this.state.snake[0];
    const target = this.state.foods[0];
    const dx = target.x - head.x;
    const dy = target.y - head.y;

    let preferred: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      preferred = dx > 0 ? 'right' : 'left';
    } else {
      preferred = dy > 0 ? 'down' : 'up';
    }

    const opposites: Record<Direction, Direction> = {
      up: 'down', down: 'up', left: 'right', right: 'left',
    };
    if (preferred !== opposites[this.state.direction]) {
      this.state.nextDirection = preferred;
    } else {
      // Choose a perpendicular direction
      const perps: Direction[] = this.state.direction === 'up' || this.state.direction === 'down'
        ? ['left', 'right'] : ['up', 'down'];
      this.state.nextDirection = perps[Math.floor(Math.random() * 2)];
    }
  }

  private gameOver() {
    this.state.isGameOver = true;
    this.state.isRunning = false;
    cancelAnimationFrame(this.animationId);
    this.callbacks.playSound('gameover');
    this.callbacks.onGameOver(this.state);
  }

  // ===== DRAWING =====
  private draw() {
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    // Shake effect
    ctx.save();
    if (this.shakeTimer > 0) {
      const intensity = 4;
      ctx.translate(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
    }

    // Background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(108, 99, 255, 0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.tilesX; i++) {
      ctx.beginPath();
      ctx.moveTo(i * this.tileSize, 0);
      ctx.lineTo(i * this.tileSize, h);
      ctx.stroke();
    }
    for (let j = 0; j <= this.tilesY; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * this.tileSize);
      ctx.lineTo(w, j * this.tileSize);
      ctx.stroke();
    }

    this.drawFoods();
    this.drawPowerUps();
    this.drawSnake();
    this.drawMessages();

    // Time Attack overlay
    if (this.state.mode === 'time-attack') {
      ctx.fillStyle = this.timeAttackRemaining < 10 ? '#FF4D8D' : '#00E5FF';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${Math.ceil(this.timeAttackRemaining)}s`,
        w / 2, 30
      );
    }

    // Pause overlay
    if (this.state.isPaused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', w / 2, h / 2);
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Tap or press Space to resume', w / 2, h / 2 + 35);
    }

    ctx.restore();
  }

  private drawSnake() {
    const ctx = this.ctx;
    const ts = this.tileSize;
    const padding = 2;

    // Draw body segments (backwards so head is on top)
    for (let i = this.state.snake.length - 1; i >= 0; i--) {
      const seg = this.state.snake[i];
      const x = seg.x * ts;
      const y = seg.y * ts;
      const size = ts - padding * 2;

      if (i === 0 && this.playerImage) {
        // HEAD — draw circular cropped player image
        ctx.save();
        
        // Glow
        ctx.shadowColor = this.state.shieldActive ? '#6C63FF' : '#00E5FF';
        ctx.shadowBlur = this.state.shieldActive ? 25 : 15;

        ctx.beginPath();
        ctx.arc(x + ts / 2, y + ts / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(this.playerImage, x + padding, y + padding, size, size);
        ctx.restore();

        // Border ring
        ctx.beginPath();
        ctx.arc(x + ts / 2, y + ts / 2, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = this.state.shieldActive ? '#6C63FF' : '#00E5FF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shield indicator
        if (this.state.shieldActive) {
          ctx.beginPath();
          ctx.arc(x + ts / 2, y + ts / 2, size / 2 + 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(108, 99, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        // BODY segments — smaller circles with gradient
        const bodyRatio = 1 - (i / this.state.snake.length) * 0.3;
        const bodySize = size * bodyRatio;
        const cx = x + ts / 2;
        const cy = y + ts / 2;

        if (this.playerImage && i <= 3) {
          // First few body segments also use player image (smaller)
          ctx.save();
          ctx.globalAlpha = 0.7 - i * 0.1;
          ctx.beginPath();
          ctx.arc(cx, cy, bodySize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(this.playerImage, cx - bodySize / 2, cy - bodySize / 2, bodySize, bodySize);
          ctx.restore();
        } else {
          // Gradient body
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bodySize / 2);
          grad.addColorStop(0, `rgba(108, 99, 255, ${0.6 - i * 0.02})`);
          grad.addColorStop(1, `rgba(108, 99, 255, ${0.2 - i * 0.01})`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, bodySize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private drawFoods() {
    const ctx = this.ctx;
    const ts = this.tileSize;
    const time = this.gameTime / 1000;

    this.state.foods.forEach(food => {
      const x = food.x * ts;
      const y = food.y * ts;
      const img = this.friendImages[food.friendIndex];
      const bounce = Math.sin(time * 3 + food.x) * 2;
      const padding = 2;
      const size = ts - padding * 2;

      if (img) {
        ctx.save();
        // Glow
        ctx.shadowColor = '#FF4D8D';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(x + ts / 2, y + ts / 2 + bounce, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x + padding, y + padding + bounce, size, size);
        ctx.restore();

        // Pink border
        ctx.beginPath();
        ctx.arc(x + ts / 2, y + ts / 2 + bounce, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#FF4D8D';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Fallback colored circle
        ctx.fillStyle = '#FF4D8D';
        ctx.beginPath();
        ctx.arc(x + ts / 2, y + ts / 2 + bounce, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  private drawPowerUps() {
    const ctx = this.ctx;
    const ts = this.tileSize;
    const time = this.gameTime / 1000;

    this.state.powerUps.forEach(pu => {
      const x = pu.x * ts;
      const y = pu.y * ts;
      const bounce = Math.sin(time * 4) * 3;
      const cx = x + ts / 2;
      const cy = y + ts / 2 + bounce;

      // Glow ring
      ctx.beginPath();
      ctx.arc(cx, cy, ts / 2 + 2, 0, Math.PI * 2);
      ctx.strokeStyle = pu.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = pu.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.arc(cx, cy, ts / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Icon
      ctx.font = `${ts * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pu.icon, cx, cy);
    });
  }

  private drawMessages() {
    const ctx = this.ctx;
    this.messageQueue.forEach(msg => {
      const alpha = Math.min(1, msg.timer / 500);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(msg.text, this.canvasWidth / 2, msg.y);
    });
  }

  destroy() {
    this.stop();
    cancelAnimationFrame(this.animationId);
  }
}
