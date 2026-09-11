export const BURDON_RAW_ROWS: string[] = [
  "a e p z n z s u a h v k l a s l b f o u o e",
  "r v b p m i b i r b s m n t d a u f e f k a",
  "e k ü h s e y p h b k s d g y z d v r l f g",
  "y d a e o y e r z h e z s e g m k f z d n y",
  "f s v y i b t d h m l n i e m t g t e d f u",
  "k e d e k o k o s t l u z u g m a f l v u t",
  "i z i f o u d v h y p n b p m v h n n g r y",
  "p v r l n t y o r z n e p h t e m z i o i m",
  "r a k y g s o i v a i n a r e h o d b f p h",
  "k u ı s y g u e m k l l e g v g r l p e t e",

  "e i t e l r n z f u d b m s h d k u f d s m",
  "s l v e t e p l n g v g e t l r n e u g y s",
  "b o k e h b u k r g f u d o h o r a n i a v",
  "i o s g y l a r o i f b z m e l h p z n z r",
  "o ş k h a m v ğ l m g v n h v m p b n p y h",
  "v d u o f r h i y u v l u a m f a e u l t s",
  "o k o k e i e k t f s b t g t m e i n l z h",
  "d t d i y a s e u n d z f k m g e s z e h z",
  "r e n o e v d y g f l r v d z y g d z p b e",
  "p y e a a s e g e a h t n m p r r i b i k p",

  "a f n p v d m t o y m i l g d e o t o e n t",
  "l u p z n k r h p u e y o y g u d v y a o l",
  "s z o a p f f t e v k i r b p m m e r g e s",
  "b a h v i h s e k z r f b r a e g y n m h y",
  "t d s v e g z y f m p t r o y e u u b b y h",
  "i u a n y a d u m f a p y z e b k d b o l z",
  "e l z h e a d z t e l p r y f m s n v i e v",
  "s b i v m z g p s m r k b k r e h e u v m s",
  "f l s l e i o l g l k t h z o k t d e a r h",
  "s m i u e f t i m s g k n k n p h r h g u i"
];

export const BURDON_TARGET_LETTERS = new Set(['a', 'b', 'd', 'g']);

export interface BurdonCellInfo {
  cellId: string; // "r1_c1" (1-indexed)
  rowNumber: number; // 1..30
  colNumber: number; // 1..22 (or row length)
  char: string;
  isTarget: boolean;
  sectionNumber: 1 | 2 | 3;
}

export interface BurdonRowPerformance {
  rowNumber: number;
  sectionNumber: 1 | 2 | 3;
  totalChars: number;
  targetCount: number;
  correctCount: number;
  omittedCount: number;
  incorrectCount: number;
  totalMarked: number;
  accuracyRate: number; // 0..100
  targetDetails: {
    a: { total: number; correct: number; omitted: number };
    b: { total: number; correct: number; omitted: number };
    d: { total: number; correct: number; omitted: number };
    g: { total: number; correct: number; omitted: number };
  };
}

export interface BurdonSectionPerformance {
  sectionNumber: 1 | 2 | 3;
  sectionName: string; // "1. Bölüm (Satır 1-10)"
  sectionLabel: string; // "1. Bölüm"
  rowsRange: string; // "Satır 1-10"
  totalChars: number;
  targetCount: number;
  correctCount: number;
  omittedCount: number;
  incorrectCount: number;
  totalMarked: number;
  accuracyRate: number;
  letterBreakdown: {
    a: { total: number; correct: number; omitted: number };
    b: { total: number; correct: number; omitted: number };
    d: { total: number; correct: number; omitted: number };
    g: { total: number; correct: number; omitted: number };
  };
}

export interface BurdonPatternAnalysis {
  code: 'FATIGUE_DROP' | 'WARMUP_IMPROVEMENT' | 'MID_DROP' | 'VARIABLE' | 'BALANCED' | 'LOW_ATTEMPT';
  title: string;
  description: string;
  neutralGuidance: string;
}

export interface BurdonEvaluationResult {
  totalCells: number; // 660
  totalTargets: number; // 114
  correctMarkings: number;
  omittedTargets: number;
  incorrectMarkings: number;
  totalMarkings: number;
  accuracyPercentage: number; // 0..100
  elapsedSeconds: number;
  configuredDurationSeconds: number;
  isEarlyFinished: boolean;
  rowStats: BurdonRowPerformance[];
  sectionStats: [BurdonSectionPerformance, BurdonSectionPerformance, BurdonSectionPerformance];
  pattern: BurdonPatternAnalysis;
  markedCellIds: string[];
}

// Build the global cell map once
export const BURDON_GRID_CELLS: BurdonCellInfo[] = [];
export const BURDON_CELL_MAP = new Map<string, BurdonCellInfo>();

BURDON_RAW_ROWS.forEach((rowStr, rowIndex) => {
  const chars = rowStr.trim().split(/\s+/);
  const rowNumber = rowIndex + 1;
  const sectionNumber = (rowNumber <= 10 ? 1 : rowNumber <= 20 ? 2 : 3) as 1 | 2 | 3;

  chars.forEach((char, colIndex) => {
    const colNumber = colIndex + 1;
    const cellId = `r${rowNumber}_c${colNumber}`;
    const isTarget = BURDON_TARGET_LETTERS.has(char.toLowerCase());

    const cellInfo: BurdonCellInfo = {
      cellId,
      rowNumber,
      colNumber,
      char,
      isTarget,
      sectionNumber
    };

    BURDON_GRID_CELLS.push(cellInfo);
    BURDON_CELL_MAP.set(cellId, cellInfo);
  });
});

export function getBurdonMatrixCells(): BurdonCellInfo[] {
  return BURDON_GRID_CELLS;
}

/**
 * Evaluates Burdon Dikkat Testi results from raw marked cell IDs or answer payloads.
 * Accepts:
 * - string[]: Array of cell IDs ("r1_c1", etc.)
 * - Array<{ questionId: string; answerValue?: string }>: Raw answer rows
 * - Object: Application payload / snapshot
 */
export function evaluateBurdonTest(
  rawInput: any,
  elapsedSeconds?: number,
  configuredDurationSeconds?: number
): BurdonEvaluationResult {
  const selectedSet = new Set<string>();
  let finalElapsed = elapsedSeconds ?? 300;
  let finalDuration = configuredDurationSeconds ?? 300;

  // Helper to process answer values
  const processAnswerItem = (item: any) => {
    if (!item) return;
    if (typeof item === 'string') {
      if (item.startsWith('r') && item.includes('_c')) {
        selectedSet.add(item);
      } else if (item.startsWith('{') || item.startsWith('[')) {
        try {
          const parsed = JSON.parse(item);
          processAnswerItem(parsed);
        } catch {}
      }
    } else if (typeof item === 'object') {
      // Check if it has burdon_data inside
      if (item.burdon_data) {
        processAnswerItem(item.burdon_data);
      }
      if (item.selectedCellIds && Array.isArray(item.selectedCellIds)) {
        item.selectedCellIds.forEach((id: string) => selectedSet.add(id));
      }
      if (item.markedCellIds && Array.isArray(item.markedCellIds)) {
        item.markedCellIds.forEach((id: string) => selectedSet.add(id));
      }
      if (item.elapsedSeconds !== undefined) {
        finalElapsed = item.elapsedSeconds;
      }
      if (item.configuredDurationSeconds !== undefined) {
        finalDuration = item.configuredDurationSeconds;
      }

      // If it's a SurveyAnswerDto { questionId: 'r1_c1', ... }
      if (item.questionId) {
        if (item.questionId.startsWith('r') && item.questionId.includes('_c')) {
          if (item.answerValue === '1' || item.answerValue === 'marked' || item.answerValue === 'true' || item.answerValue === undefined) {
            selectedSet.add(item.questionId);
          }
        } else if (item.questionId === 'burdon_data' && item.answerValue) {
          try {
            const parsed = JSON.parse(item.answerValue);
            processAnswerItem(parsed);
          } catch {}
        }
      }

      // If it's a grid cell { rowIndex: 0, cellIndex: 0, character: 'a' }
      if (item.rowIndex !== undefined && item.cellIndex !== undefined) {
        const cellId = `r${item.rowIndex + 1}_c${item.cellIndex + 1}`;
        selectedSet.add(cellId);
      }

      // If it's a SurveyApplicationDto with answers or resultSnapshot
      if (Array.isArray(item.answers)) {
        item.answers.forEach((ans: any) => processAnswerItem(ans));
      }
      if (item.resultSnapshot) {
        if (item.resultSnapshot.burdonEvaluation) {
          processAnswerItem(item.resultSnapshot.burdonEvaluation);
        }
        if (item.resultSnapshot.rawMetrics?.burdonEvaluation) {
          processAnswerItem(item.resultSnapshot.rawMetrics.burdonEvaluation);
        }
        if (item.resultSnapshot.rawMetrics?.burdonAnswers) {
          processAnswerItem(item.resultSnapshot.rawMetrics.burdonAnswers);
        }
        if (item.resultSnapshot.rawMetrics?.elapsedSeconds !== undefined) {
          finalElapsed = item.resultSnapshot.rawMetrics.elapsedSeconds;
        }
        if (item.resultSnapshot.rawMetrics?.configuredDurationSeconds !== undefined) {
          finalDuration = item.resultSnapshot.rawMetrics.configuredDurationSeconds;
        }
        if (item.resultSnapshot.elapsedSeconds !== undefined) {
          finalElapsed = item.resultSnapshot.elapsedSeconds;
        }
      }
      if (item.burdonEvaluation) {
        processAnswerItem(item.burdonEvaluation);
      }
      if (item.rawMetrics?.burdonEvaluation) {
        processAnswerItem(item.rawMetrics.burdonEvaluation);
      }
      if (item.rawMetrics?.burdonAnswers) {
        processAnswerItem(item.rawMetrics.burdonAnswers);
      }
      if (item.answers_json && typeof item.answers_json === 'string') {
        try {
          const parsed = JSON.parse(item.answers_json);
          processAnswerItem(parsed);
        } catch {}
      }
    }
  };

  if (Array.isArray(rawInput)) {
    rawInput.forEach(item => processAnswerItem(item));
  } else if (rawInput) {
    processAnswerItem(rawInput);
  }

  // Calculate row by row stats
  const rowStats: BurdonRowPerformance[] = [];
  let totalTargets = 0;
  let correctMarkings = 0;
  let omittedTargets = 0;
  let incorrectMarkings = 0;
  let totalMarkings = 0;

  // Track marked targets
  for (let r = 1; r <= 30; r++) {
    const sectionNumber = (r <= 10 ? 1 : r <= 20 ? 2 : 3) as 1 | 2 | 3;
    const rowCells = BURDON_GRID_CELLS.filter(c => c.rowNumber === r);
    
    let rowTargets = 0;
    let rowCorrect = 0;
    let rowOmitted = 0;
    let rowIncorrect = 0;
    let rowTotalMarked = 0;

    const targetDetails = {
      a: { total: 0, correct: 0, omitted: 0 },
      b: { total: 0, correct: 0, omitted: 0 },
      d: { total: 0, correct: 0, omitted: 0 },
      g: { total: 0, correct: 0, omitted: 0 }
    };

    rowCells.forEach(cell => {
      const charLower = cell.char.toLowerCase() as 'a' | 'b' | 'd' | 'g';
      const isMarked = selectedSet.has(cell.cellId);

      if (cell.isTarget) {
        rowTargets++;
        if (targetDetails[charLower]) {
          targetDetails[charLower].total++;
        }

        if (isMarked) {
          rowCorrect++;
          rowTotalMarked++;
          if (targetDetails[charLower]) {
            targetDetails[charLower].correct++;
          }
        } else {
          rowOmitted++;
          if (targetDetails[charLower]) {
            targetDetails[charLower].omitted++;
          }
        }
      } else {
        if (isMarked) {
          rowIncorrect++;
          rowTotalMarked++;
        }
      }
    });

    const accuracyRate = rowTargets > 0 ? Math.round((rowCorrect / rowTargets) * 1000) / 10 : 0;

    rowStats.push({
      rowNumber: r,
      sectionNumber,
      totalChars: rowCells.length,
      targetCount: rowTargets,
      correctCount: rowCorrect,
      omittedCount: rowOmitted,
      incorrectCount: rowIncorrect,
      totalMarked: rowTotalMarked,
      accuracyRate,
      targetDetails
    });

    totalTargets += rowTargets;
    correctMarkings += rowCorrect;
    omittedTargets += rowOmitted;
    incorrectMarkings += rowIncorrect;
    totalMarkings += rowTotalMarked;
  }

  // Calculate Section Stats
  const sectionStats: [BurdonSectionPerformance, BurdonSectionPerformance, BurdonSectionPerformance] = [
    {
      sectionNumber: 1,
      sectionName: '1. Bölüm (Satır 1-10)',
      sectionLabel: '1. Bölüm',
      rowsRange: 'Satır 1-10',
      totalChars: 0,
      targetCount: 0,
      correctCount: 0,
      omittedCount: 0,
      incorrectCount: 0,
      totalMarked: 0,
      accuracyRate: 0,
      letterBreakdown: {
        a: { total: 0, correct: 0, omitted: 0 },
        b: { total: 0, correct: 0, omitted: 0 },
        d: { total: 0, correct: 0, omitted: 0 },
        g: { total: 0, correct: 0, omitted: 0 }
      }
    },
    {
      sectionNumber: 2,
      sectionName: '2. Bölüm (Satır 11-20)',
      sectionLabel: '2. Bölüm',
      rowsRange: 'Satır 11-20',
      totalChars: 0,
      targetCount: 0,
      correctCount: 0,
      omittedCount: 0,
      incorrectCount: 0,
      totalMarked: 0,
      accuracyRate: 0,
      letterBreakdown: {
        a: { total: 0, correct: 0, omitted: 0 },
        b: { total: 0, correct: 0, omitted: 0 },
        d: { total: 0, correct: 0, omitted: 0 },
        g: { total: 0, correct: 0, omitted: 0 }
      }
    },
    {
      sectionNumber: 3,
      sectionName: '3. Bölüm (Satır 21-30)',
      sectionLabel: '3. Bölüm',
      rowsRange: 'Satır 21-30',
      totalChars: 0,
      targetCount: 0,
      correctCount: 0,
      omittedCount: 0,
      incorrectCount: 0,
      totalMarked: 0,
      accuracyRate: 0,
      letterBreakdown: {
        a: { total: 0, correct: 0, omitted: 0 },
        b: { total: 0, correct: 0, omitted: 0 },
        d: { total: 0, correct: 0, omitted: 0 },
        g: { total: 0, correct: 0, omitted: 0 }
      }
    }
  ];

  rowStats.forEach(row => {
    const sec = sectionStats[row.sectionNumber - 1];
    sec.totalChars += row.totalChars;
    sec.targetCount += row.targetCount;
    sec.correctCount += row.correctCount;
    sec.omittedCount += row.omittedCount;
    sec.incorrectCount += row.incorrectCount;
    sec.totalMarked += row.totalMarked;

    (['a', 'b', 'd', 'g'] as const).forEach(letter => {
      sec.letterBreakdown[letter].total += row.targetDetails[letter].total;
      sec.letterBreakdown[letter].correct += row.targetDetails[letter].correct;
      sec.letterBreakdown[letter].omitted += row.targetDetails[letter].omitted;
    });
  });

  sectionStats.forEach(sec => {
    sec.accuracyRate = sec.targetCount > 0 ? Math.round((sec.correctCount / sec.targetCount) * 1000) / 10 : 0;
  });

  const totalCells = BURDON_GRID_CELLS.length; // 660
  const accuracyPercentage = totalTargets > 0 ? Math.round((correctMarkings / totalTargets) * 1000) / 10 : 0;

  // Pattern Detection across 3 sections
  const s1Acc = sectionStats[0].accuracyRate;
  const s2Acc = sectionStats[1].accuracyRate;
  const s3Acc = sectionStats[2].accuracyRate;

  let pattern: BurdonPatternAnalysis;

  if (totalMarkings === 0) {
    pattern = {
      code: 'LOW_ATTEMPT',
      title: 'İşaretleme Bulunmayan / Düşük Katılımlı Uygulama',
      description: 'Test sayfası üzerinde işaretleme yapılmamış veya çok sınırlı işaretleme gerçekleştirilmiştir.',
      neutralGuidance: 'Öğrencinin test yönergesini anlayıp anlamadığı kontrol edilebilir ve gerekirse uygulama tekrar planlanabilir.'
    };
  } else if (s1Acc > s2Acc + 10 && s2Acc > s3Acc + 5) {
    pattern = {
      code: 'FATIGUE_DROP',
      title: 'Zamanla Azalan Dikkat / Yorulma Eğilimi',
      description: 'Testin başlangıcında (1. Bölüm) yüksek olan doğruluk oranı, test ilerledikçe (2. ve 3. Bölüm) belirgin bir düşüş göstermiştir.',
      neutralGuidance: 'Öğrencinin uzun süreli zihinsel çaba gerektiren görevlerde zamanla odaklanma kaybı yaşayabileceği göz önünde bulundurulmalıdır. Çalışma seanslarının kısa aralıklarla bölünmesi ve mola stratejileri yararlı olabilir.'
    };
  } else if (s3Acc > s2Acc + 5 && s2Acc > s1Acc + 10) {
    pattern = {
      code: 'WARMUP_IMPROVEMENT',
      title: 'Isınma ve Alışma Sonrası Artan Dikkat',
      description: 'Testin ilk bölümünde daha düşük olan doğruluk oranı, testin orta ve son bölümlerinde belirgin şekilde artmıştır.',
      neutralGuidance: 'Öğrencinin yeni bir göreve başlarken adaptasyon süresine ihtiyaç duyabileceği, tempoyu buldukça dikkat performansının yükseldiği görülmektedir.'
    };
  } else if (s1Acc > s2Acc + 15 && s3Acc > s2Acc + 10) {
    pattern = {
      code: 'MID_DROP',
      title: 'Orta Bölümde Dikkat Dalgalanması',
      description: 'Testin orta bölümünde (Satır 11-20) doğruluk oranında geçici bir düşüş ve hata artışı gözlenmiştir.',
      neutralGuidance: 'Görev ortasında kısa süreli odaklanma kopmaları yaşanabilmektedir. Kendini izleme ve odak tazeleme teknikleri destekleyici olabilir.'
    };
  } else if (Math.max(s1Acc, s2Acc, s3Acc) - Math.min(s1Acc, s2Acc, s3Acc) > 20) {
    pattern = {
      code: 'VARIABLE',
      title: 'Değişken / Dalgalı Dikkat Performansı',
      description: 'Test bölümleri arasında doğruluk ve hata oranlarında belirgin dalgalanmalar gözlemlenmiştir.',
      neutralGuidance: 'Dikkat sürekliliğinin çevresel veya içsel faktörlere duyarlı olabileceği değerlendirilebilir.'
    };
  } else {
    pattern = {
      code: 'BALANCED',
      title: 'Bölümler Arası Dengeli Performans Örüntüsü',
      description: 'Testin başlangıç, gelişme ve sonuç bölümlerindeki doğru işaretleme ve hata oranları büyük ölçüde tutarlı ve dengelidir.',
      neutralGuidance: 'Öğrencinin dikkat ve odaklanma performansı 5 dakikalık uygulama süresi boyunca belirgin bir dalgalanma göstermeden sürdürülmüştür.'
    };
  }

  return {
    totalCells,
    totalTargets,
    correctMarkings,
    omittedTargets,
    incorrectMarkings,
    totalMarkings,
    accuracyPercentage,
    elapsedSeconds: finalElapsed,
    configuredDurationSeconds: finalDuration,
    isEarlyFinished: finalElapsed < finalDuration,
    rowStats,
    sectionStats,
    pattern,
    markedCellIds: Array.from(selectedSet)
  };
}
