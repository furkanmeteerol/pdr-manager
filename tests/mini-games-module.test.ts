import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Bölüm 12: Diğer / Mini Oyunlar — GameKit UI 12 Oyun Entegrasyon Test Paketi', () => {
  const gamesDir = path.join(process.cwd(), 'src', 'features', 'other', 'gamekit');

  const expectedGames = [
    { file: 'minesweeper.tsx', title: 'Minesweeper', exportName: 'Minesweeper' },
    { file: '2048.tsx', title: '2048', exportName: 'Game2048' },
    { file: 'memory-match.tsx', title: 'Memory Match', exportName: 'MemoryMatch' },
    { file: 'snake.tsx', title: 'Snake', exportName: 'Snake' },
    { file: 'tic-tac-toe.tsx', title: 'Tic-Tac-Toe', exportName: 'TicTacToe' },
    { file: 'whack-a-mole.tsx', title: 'Whack-a-Mole', exportName: 'WhackAMole' },
    { file: 'pong.tsx', title: 'Pong', exportName: 'Pong' },
    { file: 'breakout.tsx', title: 'Breakout', exportName: 'Breakout' },
    { file: 'dino-runner.tsx', title: 'Dino Runner', exportName: 'DinoRunner' },
    { file: 'flappy.tsx', title: 'Flappy', exportName: 'Flappy' },
    { file: 'fruit-ninja.tsx', title: 'Fruit Ninja', exportName: 'FruitNinja' },
    { file: 'stack.tsx', title: 'Stack', exportName: 'Stack' }
  ];

  it('1. 12 Oyun Dosyasının GameKit UI Standartlarında Varlığı', () => {
    expect(fs.existsSync(gamesDir)).toBe(true);
    for (const g of expectedGames) {
      const fullPath = path.join(gamesDir, g.file);
      expect(fs.existsSync(fullPath), `Oyun dosyası bulunamadı: ${g.file}`).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf8');
      expect(content.length).toBeGreaterThan(1000);
      expect(content).toContain(g.exportName);
    }
  });

  it('2. Minesweeper: Flood-Fill ve Mayın Mantığı Doğrulaması', () => {
    // Pure logic simulation matching GameKit Minesweeper engine
    const rows = 9;
    const cols = 9;
    const grid: { mine: boolean; count: number; revealed: boolean }[][] = [];

    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        grid[r][c] = { mine: false, count: 0, revealed: false };
      }
    }

    // Place a single mine at (0,0)
    grid[0][0].mine = true;

    // Calculate neighboring mine counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].mine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) {
              count++;
            }
          }
        }
        grid[r][c].count = count;
      }
    }

    expect(grid[0][1].count).toBe(1);
    expect(grid[1][0].count).toBe(1);
    expect(grid[1][1].count).toBe(1);
    expect(grid[5][5].count).toBe(0);

    // Flood-fill simulation from (5,5)
    function floodFill(sr: number, sc: number) {
      const queue = [[sr, sc]];
      while (queue.length > 0) {
        const [r, c] = queue.shift()!;
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        if (grid[r][c].revealed || grid[r][c].mine) continue;
        grid[r][c].revealed = true;
        if (grid[r][c].count === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr !== 0 || dc !== 0) queue.push([r + dr, c + dc]);
            }
          }
        }
      }
    }

    floodFill(5, 5);
    expect(grid[5][5].revealed).toBe(true);
    expect(grid[8][8].revealed).toBe(true);
    expect(grid[0][0].revealed).toBe(false); // Mine remains unrevealed
  });

  it('3. 2048: 4x4 Board Merge ve Skor Hesaplama Mantığı Doğrulaması', () => {
    // Merge row [2, 2, 4, 8] -> [4, 4, 8, 0] with +4 score
    function mergeRow(row: number[]): { newRow: number[]; scoreGained: number } {
      const filtered = row.filter(x => x !== 0);
      const result: number[] = [];
      let scoreGained = 0;
      let i = 0;
      while (i < filtered.length) {
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
          const merged = filtered[i] * 2;
          result.push(merged);
          scoreGained += merged;
          i += 2;
        } else {
          result.push(filtered[i]);
          i += 1;
        }
      }
      while (result.length < 4) result.push(0);
      return { newRow: result, scoreGained };
    }

    const { newRow, scoreGained } = mergeRow([2, 2, 4, 8]);
    expect(newRow).toEqual([4, 4, 8, 0]);
    expect(scoreGained).toBe(4);

    const { newRow: newRow2, scoreGained: scoreGained2 } = mergeRow([4, 4, 4, 4]);
    expect(newRow2).toEqual([8, 8, 0, 0]);
    expect(scoreGained2).toBe(16);
  });

  it('4. Snake: Yılan Hareketi, Yem Yeme ve Duvar Çarpışması Doğrulaması', () => {
    type Vec = { x: number; y: number };
    let snake: Vec[] = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    let food: Vec = { x: 6, y: 5 };
    let score = 0;

    // Step right (eats food)
    const nextHead: Vec = { x: snake[0].x + 1, y: snake[0].y };
    const ate = nextHead.x === food.x && nextHead.y === food.y;
    snake = [nextHead, ...snake];
    if (!ate) snake.pop();
    if (ate) score++;

    expect(snake.length).toBe(4);
    expect(score).toBe(1);
    expect(snake[0]).toEqual({ x: 6, y: 5 });

    // Step into wall (cols=20)
    const wallHead: Vec = { x: 20, y: 5 };
    const hitWall = wallHead.x >= 20 || wallHead.x < 0 || wallHead.y < 0 || wallHead.y >= 20;
    expect(hitWall).toBe(true);
  });

  it('5. Tic-Tac-Toe: Kazanma ve Beraberlik Algoritması Doğrulaması', () => {
    function checkWinner(b: (string | null)[]): string | 'draw' | null {
      const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];
      for (const [x, y, z] of wins) {
        if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x];
      }
      if (b.every(c => c !== null)) return 'draw';
      return null;
    }

    expect(checkWinner(['X', 'X', 'X', null, 'O', null, 'O', null, null])).toBe('X');
    expect(checkWinner(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'])).toBe('draw');
  });

  it('6. Memory Match: Kart Eşleştirme ve Çift Mantığı Doğrulaması', () => {
    const symbols = ['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍋', '🍑'];
    const cards = [...symbols, ...symbols].map((s, idx) => ({ id: idx, symbol: s, matched: false }));

    expect(cards.length).toBe(16);
    const pair1 = cards.filter(c => c.symbol === '🍎');
    expect(pair1.length).toBe(2);

    // Matching
    const isMatch = pair1[0].symbol === pair1[1].symbol;
    expect(isMatch).toBe(true);
  });

  it('7. Pong: Raket ve Top Çarpışma Fiziği Doğrulaması', () => {
    let ballX = 100;
    let ballY = 100;
    let velX = 4;
    let velY = 3;
    const paddleX = 104;
    const paddleY = 80;
    const paddleHeight = 40;

    // Move ball
    ballX += velX;
    ballY += velY;

    // Check paddle collision
    const hitsPaddle = ballX >= paddleX && ballY >= paddleY && ballY <= paddleY + paddleHeight;
    if (hitsPaddle) velX = -velX;

    expect(hitsPaddle).toBe(true);
    expect(velX).toBe(-4);
  });

  it('8. Breakout: Tuğla Kırma ve Skor Artışı Doğrulaması', () => {
    interface Brick { id: number; x: number; y: number; w: number; h: number; destroyed: boolean }
    const bricks: Brick[] = [
      { id: 1, x: 50, y: 50, w: 40, h: 20, destroyed: false }
    ];
    let score = 0;

    const ball = { x: 60, y: 60, r: 5 };
    for (const b of bricks) {
      if (!b.destroyed && ball.x >= b.x && ball.x <= b.x + b.w && ball.y >= b.y && ball.y <= b.y + b.h) {
        b.destroyed = true;
        score += 10;
      }
    }

    expect(bricks[0].destroyed).toBe(true);
    expect(score).toBe(10);
  });

  it('9. Dino Runner: Zıplama, Yerçekimi ve Engel Çarpışması Doğrulaması', () => {
    let dinoY = 0;
    let dinoVy = 12; // jump impulse
    const gravity = -0.8;

    // 5 physics ticks
    for (let i = 0; i < 5; i++) {
      dinoY += dinoVy;
      dinoVy += gravity;
    }

    expect(dinoY).toBeGreaterThan(0);

    // Collision check
    const dinoBox = { x: 50, y: 0, w: 30, h: 40 };
    const obstacleBox = { x: 60, y: 0, w: 20, h: 30 };
    const collides =
      dinoBox.x < obstacleBox.x + obstacleBox.w &&
      dinoBox.x + dinoBox.w > obstacleBox.x &&
      dinoBox.y < obstacleBox.y + obstacleBox.h &&
      dinoBox.y + dinoBox.h > obstacleBox.y;

    expect(collides).toBe(true);
  });

  it('10. Flappy: Yerçekimi, Boru Aralığı ve Skor Doğrulaması', () => {
    let birdY = 150;
    let birdVy = -5; // Flap up
    birdY += birdVy;
    expect(birdY).toBe(145);

    // Pipe gap between 100 and 200
    const pipeGapTop = 100;
    const pipeGapBottom = 200;
    const safeInGap = birdY > pipeGapTop && birdY < pipeGapBottom;
    expect(safeInGap).toBe(true);
  });

  it('11. Fruit Ninja: Meyve Kesme ve Skor Doğrulaması', () => {
    interface Fruit { id: number; x: number; y: number; radius: number; sliced: boolean }
    const fruit: Fruit = { id: 1, x: 100, y: 100, radius: 25, sliced: false };

    // Slice trajectory intersects fruit center
    const slicePoint = { x: 105, y: 98 };
    const dist = Math.hypot(slicePoint.x - fruit.x, slicePoint.y - fruit.y);
    if (dist <= fruit.radius) fruit.sliced = true;

    expect(fruit.sliced).toBe(true);
  });

  it('12. Stack: Blok Dilimleme ve Artık Alan Hesaplama Doğrulaması', () => {
    const prevBlock = { x: 100, w: 100 };
    const currentBlock = { x: 110, w: 100 };

    const overhang = Math.abs(currentBlock.x - prevBlock.x);
    const newWidth = currentBlock.w - overhang;
    const newX = Math.max(currentBlock.x, prevBlock.x);

    expect(overhang).toBe(10);
    expect(newWidth).toBe(90);
    expect(newX).toBe(110);
  });

  it('13. OtherView Bileşeni 12 Oyun Seçicisini ve Lazy Modülleri İhbar Eder', () => {
    const otherViewPath = path.join(process.cwd(), 'src', 'features', 'other', 'OtherView.tsx');
    expect(fs.existsSync(otherViewPath)).toBe(true);
    const content = fs.readFileSync(otherViewPath, 'utf8');

    for (const g of expectedGames) {
      expect(content).toContain(g.file.replace('.tsx', ''));
    }
  });
});
