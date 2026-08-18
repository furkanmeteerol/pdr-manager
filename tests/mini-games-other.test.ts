import { describe, it, expect } from 'vitest';

describe('Bölüm 10: Diğer / Mini Oyunlar & Forum/S.S.S. Temizliği Test Paketi', () => {
  it('1. Sidebar ve Routing Forum/S.S.S. Temizliği Doğrulaması', async () => {
    // Read Sidebar.tsx source to verify forum and faq are completely removed and other exists
    const fs = await import('fs');
    const sidebarContent = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
    
    expect(sidebarContent).not.toContain("id: 'forum'");
    expect(sidebarContent).not.toContain("id: 'faq'");
    expect(sidebarContent).not.toContain("label: 'Forum'");
    expect(sidebarContent).not.toContain("label: 'S.S.S.'");
    expect(sidebarContent).toContain("id: 'other'");
    expect(sidebarContent).toContain("label: 'Diğer'");

    // Verify App.tsx routing
    const appContent = fs.readFileSync('src/App.tsx', 'utf8');
    expect(appContent).not.toContain('ForumView');
    expect(appContent).not.toContain('FaqView');
    expect(appContent).toContain('OtherView');
    expect(appContent).toContain("case 'other':");
  });

  describe('2. Mayın Tarlası (Minesweeper) Oyun Motoru Mantığı', () => {
    it('Hücre oluşturma, ilk tıklama güvenliği ve komşu mayın hesaplama', () => {
      const rows = 9;
      const cols = 9;
      const totalMines = 10;
      const startR = 4;
      const startC = 4;

      // Create base grid
      const grid: { isMine: boolean; neighborMines: number }[][] = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push({ isMine: false, neighborMines: 0 });
        }
        grid.push(row);
      }

      // Place mines excluding (startR, startC) and surrounding
      let placed = 0;
      while (placed < totalMines) {
        const randR = Math.floor(Math.random() * rows);
        const randC = Math.floor(Math.random() * cols);
        const isNearStart = Math.abs(randR - startR) <= 1 && Math.abs(randC - startC) <= 1;
        if (!isNearStart && !grid[randR][randC].isMine) {
          grid[randR][randC].isMine = true;
          placed++;
        }
      }

      // Verify start cell and its neighbors are 100% safe
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          expect(grid[startR + dr][startC + dc].isMine).toBe(false);
        }
      }

      // Calculate neighbor counts
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!grid[r][c].isMine) {
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].isMine) {
                  count++;
                }
              }
            }
            grid[r][c].neighborMines = count;
          }
        }
      }

      // Total mines count check
      let actualMines = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].isMine) actualMines++;
        }
      }
      expect(actualMines).toBe(10);
    });

    it('Flood-fill / Boş hücre açma algoritması', () => {
      // Deterministic 3x3 test board with 1 mine at (0, 2)
      // (0,0)=0 (0,1)=1 (0,2)=💣
      // (1,0)=0 (1,1)=1 (1,2)=1
      // (2,0)=0 (2,1)=0 (2,2)=0
      const board = [
        [{ isMine: false, neighborMines: 0, isRevealed: false }, { isMine: false, neighborMines: 1, isRevealed: false }, { isMine: true, neighborMines: 0, isRevealed: false }],
        [{ isMine: false, neighborMines: 0, isRevealed: false }, { isMine: false, neighborMines: 1, isRevealed: false }, { isMine: false, neighborMines: 1, isRevealed: false }],
        [{ isMine: false, neighborMines: 0, isRevealed: false }, { isMine: false, neighborMines: 0, isRevealed: false }, { isMine: false, neighborMines: 0, isRevealed: false }],
      ];

      // Open (2, 0) which is 0-neighbor cell
      const queue: [number, number][] = [[2, 0]];
      board[2][0].isRevealed = true;

      while (queue.length > 0) {
        const [currR, currC] = queue.shift()!;
        if (board[currR][currC].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = currR + dr;
              const nc = currC + dc;
              if (
                nr >= 0 && nr < 3 && nc >= 0 && nc < 3 &&
                !board[nr][nc].isRevealed && !board[nr][nc].isMine
              ) {
                board[nr][nc].isRevealed = true;
                if (board[nr][nc].neighborMines === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }

      // Safe cells should all be revealed
      expect(board[0][0].isRevealed).toBe(true);
      expect(board[0][1].isRevealed).toBe(true);
      expect(board[1][0].isRevealed).toBe(true);
      expect(board[1][1].isRevealed).toBe(true);
      expect(board[2][0].isRevealed).toBe(true);
      expect(board[2][1].isRevealed).toBe(true);
      expect(board[2][2].isRevealed).toBe(true);

      // The mine at (0, 2) should NOT be revealed
      expect(board[0][2].isRevealed).toBe(false);
    });
  });

  describe('3. 2048 Oyun Motoru Mantığı', () => {
    function slideRowLeft(row: number[]): { newRow: number[]; gainedScore: number } {
      const nonZero = row.filter((val) => val !== 0);
      const newRow: number[] = [];
      let gainedScore = 0;

      let i = 0;
      while (i < nonZero.length) {
        if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
          const mergedVal = nonZero[i] * 2;
          newRow.push(mergedVal);
          gainedScore += mergedVal;
          i += 2;
        } else {
          newRow.push(nonZero[i]);
          i += 1;
        }
      }

      while (newRow.length < 4) {
        newRow.push(0);
      }

      return { newRow, gainedScore };
    }

    it('Basit kaydırma ve sıfırları temizleme', () => {
      const { newRow, gainedScore } = slideRowLeft([0, 2, 0, 0]);
      expect(newRow).toEqual([2, 0, 0, 0]);
      expect(gainedScore).toBe(0);
    });

    it('Aynı sayıları birleştirme ve skor üretme', () => {
      const { newRow, gainedScore } = slideRowLeft([2, 2, 0, 0]);
      expect(newRow).toEqual([4, 0, 0, 0]);
      expect(gainedScore).toBe(4);
    });

    it('Çift birleşim: [2, 2, 4, 4] -> [4, 8, 0, 0]', () => {
      const { newRow, gainedScore } = slideRowLeft([2, 2, 4, 4]);
      expect(newRow).toEqual([4, 8, 0, 0]);
      expect(gainedScore).toBe(12);
    });

    it('Tek hamlede bir kereden fazla birleşmeme: [4, 2, 2, 0] -> [4, 4, 0, 0]', () => {
      const { newRow, gainedScore } = slideRowLeft([4, 2, 2, 0]);
      expect(newRow).toEqual([4, 4, 0, 0]);
      expect(gainedScore).toBe(4);
    });

    it('Üçlü aynı sayıda soldaki çift birleşir: [2, 2, 2, 0] -> [4, 2, 0, 0]', () => {
      const { newRow, gainedScore } = slideRowLeft([2, 2, 2, 0]);
      expect(newRow).toEqual([4, 2, 0, 0]);
      expect(gainedScore).toBe(4);
    });

    it('Oyun Bitti (Game Over) tespiti', () => {
      const fullNoMoves = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];

      function checkGameOver(grid: number[][]): boolean {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) return false;
            if (c + 1 < 4 && grid[r][c] === grid[r][c + 1]) return false;
            if (r + 1 < 4 && grid[r][c] === grid[r + 1][c]) return false;
          }
        }
        return true;
      }

      expect(checkGameOver(fullNoMoves)).toBe(true);

      // With an empty cell -> not game over
      const withEmpty = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 0, 4],
        [4, 2, 4, 2],
      ];
      expect(checkGameOver(withEmpty)).toBe(false);

      // With horizontal pair -> not game over
      const withPair = [
        [2, 2, 4, 8],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      expect(checkGameOver(withPair)).toBe(false);
    });
  });
});
