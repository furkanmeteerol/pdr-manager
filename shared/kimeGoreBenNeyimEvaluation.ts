export const KGBN_SCALE_METADATA = {
  id: 'srv-kime-gore-ben-neyim',
  slug: 'kime-gore-ben-neyim',
  code: 'KGBN-40',
  formCode: 'B.G.G.6.a',
  version: 'ver-kime-gore-ben-neyim-v1',
  title: 'Kime Göre Ben Neyim?',
  institution: 'T.C. MİLLÎ EĞİTİM BAKANLIĞI • ÖZEL EĞİTİM VE REHBERLİK HİZMETLERİ GENEL MÜDÜRLÜĞÜ',
  purpose: 'Öğrencinin kendisini nasıl algıladığı ve başkalarının gözünde nasıl algılandığını ortaya çıkarmak amacıyla uygulanır.',
  targetLevel: 'İlkokul 4. sınıf, Ortaokulun tüm sınıf düzeyleri, Ortaöğretimin tüm sınıf düzeyleri',
  practitioner: 'Sınıf rehber öğretmenleri, Okul rehberlik öğretmeni',
  applicationTime: 'Eğitim-öğretim süreci içinde ihtiyaç duyulduğunda uygulanır.',
  totalItems: 40,
  perspectiveCount: 6,
  totalCells: 240,
  responseType: 'multi_perspective_checkbox'
};

export type KgbnPerspectiveKey = 'teachers' | 'mother' | 'father' | 'siblings' | 'friends' | 'self';

export interface KgbnPerspectiveMetadata {
  key: KgbnPerspectiveKey;
  label: string;
  orderIndex: number;
  description: string;
}

export const KGBN_PERSPECTIVES: KgbnPerspectiveMetadata[] = [
  { key: 'teachers', label: 'Öğretmenlerime', orderIndex: 1, description: 'Öğretmenlerin öğrenciye yakıştırdığı özellikler' },
  { key: 'mother', label: 'Anneme', orderIndex: 2, description: 'Annesinin öğrenciye yakıştırdığı özellikler' },
  { key: 'father', label: 'Babama', orderIndex: 3, description: 'Babasının öğrenciye yakıştırdığı özellikler' },
  { key: 'siblings', label: 'Kardeşlerime', orderIndex: 4, description: 'Kardeşlerinin öğrenciye yakıştırdığı özellikler' },
  { key: 'friends', label: 'Arkadaşlarıma', orderIndex: 5, description: 'Arkadaşlarının öğrenciye yakıştırdığı özellikler' },
  { key: 'self', label: 'Bana', orderIndex: 6, description: 'Öğrencinin kendisine yakıştırdığı özellikler (Benlik Algısı)' }
];

export interface KgbnDescriptorItem {
  itemNumber: number;
  text: string;
  isOther: boolean;
}

export const KGBN_DESCRIPTORS: KgbnDescriptorItem[] = [
  { itemNumber: 1, text: 'Hareketliyim', isOther: false },
  { itemNumber: 2, text: 'Kavgacıyım', isOther: false },
  { itemNumber: 3, text: 'Plansızım', isOther: false },
  { itemNumber: 4, text: 'Uysalım', isOther: false },
  { itemNumber: 5, text: 'Yeterince akıllı değilim', isOther: false },
  { itemNumber: 6, text: 'Zekiyim', isOther: false },
  { itemNumber: 7, text: 'Cesaretsizim', isOther: false },
  { itemNumber: 8, text: 'Ezberciyim', isOther: false },
  { itemNumber: 9, text: 'Somurtkanım', isOther: false },
  { itemNumber: 10, text: 'Beceriksizim', isOther: false },
  { itemNumber: 11, text: 'Ciddiyim', isOther: false },
  { itemNumber: 12, text: 'Pasaklıyım', isOther: false },
  { itemNumber: 13, text: 'Neşeliyim', isOther: false },
  { itemNumber: 14, text: 'Yakışıklıyım/Güzelim', isOther: false },
  { itemNumber: 15, text: 'Cana yakınım', isOther: false },
  { itemNumber: 16, text: 'Haylazım', isOther: false },
  { itemNumber: 17, text: 'Güçlüyüm', isOther: false },
  { itemNumber: 18, text: 'Hayalperestim', isOther: false },
  { itemNumber: 19, text: 'Her zaman hastayım', isOther: false },
  { itemNumber: 20, text: 'Sportmenim', isOther: false },
  { itemNumber: 21, text: 'Kıskancım', isOther: false },
  { itemNumber: 22, text: 'İlgisizim', isOther: false },
  { itemNumber: 23, text: 'Saygısızım', isOther: false },
  { itemNumber: 24, text: 'Talihsizim', isOther: false },
  { itemNumber: 25, text: 'Şımarığım', isOther: false },
  { itemNumber: 26, text: 'Yetenekliyim', isOther: false },
  { itemNumber: 27, text: 'Zavallının biriyim', isOther: false },
  { itemNumber: 28, text: 'Uyumsuzum', isOther: false },
  { itemNumber: 29, text: 'Mutlu değilim', isOther: false },
  { itemNumber: 30, text: 'Başarılıyım', isOther: false },
  { itemNumber: 31, text: 'Kötümserim', isOther: false },
  { itemNumber: 32, text: 'Sevilen biriyim', isOther: false },
  { itemNumber: 33, text: 'Sakarım', isOther: false },
  { itemNumber: 34, text: 'Tembelim', isOther: false },
  { itemNumber: 35, text: 'Çok konuşuyorum', isOther: false },
  { itemNumber: 36, text: 'Dürüstüm', isOther: false },
  { itemNumber: 37, text: 'Paylaşımcıyım', isOther: false },
  { itemNumber: 38, text: 'Kararlıyım', isOther: false },
  { itemNumber: 39, text: 'Popülerim', isOther: false },
  { itemNumber: 40, text: '………….. (Diğer)', isOther: true }
];

export const KGBN_DESCRIPTORS_TEXTS = KGBN_DESCRIPTORS.map(d => d.text);

export interface KgbnCustomItem {
  id?: string;
  itemNumber?: number; // 41, 42, ...
  text: string;
  selections: Record<KgbnPerspectiveKey, boolean>;
}

export interface KgbnItemDetail {
  itemNumber: number;
  text: string;
  isOther: boolean;
  selections: Record<KgbnPerspectiveKey, boolean>;
  markedPerspectivesCount: number;
  markedPerspectiveLabels: string[];
}

export interface KgbnPerspectiveResult {
  key: KgbnPerspectiveKey;
  label: string;
  orderIndex: number;
  markedCount: number;
  markedItems: Array<{
    itemNumber: number;
    text: string;
    isOther: boolean;
  }>;
}

export interface KgbnComparisonResult {
  selfOnly: KgbnItemDetail[];
  othersOnly: KgbnItemDetail[];
  sharedWithOthers: KgbnItemDetail[];
  unmarkedAnywhere: KgbnItemDetail[];
}

export interface KgbnEvaluationResult {
  totalItems: number; // 40 + customCharacteristics.length
  totalPossibleCells: number; // totalItems * 6
  selectedCellCount: number;
  otherText: string;
  otherSelections: Record<KgbnPerspectiveKey, boolean>;
  customCharacteristics: KgbnCustomItem[];
  perspectives: Record<KgbnPerspectiveKey, KgbnPerspectiveResult>;
  comparisons: KgbnComparisonResult;
  allItemDetails: KgbnItemDetail[];
  leastPerspectives: Array<{ key: KgbnPerspectiveKey; label: string; count: number }>;
  leastPerspectiveLabel: string;
}

function createEmptySelections(): Record<KgbnPerspectiveKey, boolean> {
  return {
    teachers: false,
    mother: false,
    father: false,
    siblings: false,
    friends: false,
    self: false
  };
}

/**
 * Normalizes and evaluates student answers for "Kime Göre Ben Neyim?".
 * Supports standard 40 items + unlimited dynamic custom "Diğer" characteristics.
 */
export function evaluateKimeGoreBenNeyim(
  rawAnswers: any,
  otherTextParam?: string,
  customCharacteristicsParam?: KgbnCustomItem[]
): KgbnEvaluationResult {
  const parsedMap: Record<number, Record<KgbnPerspectiveKey, boolean>> = {};
  let otherText = '';
  let otherSelections: Record<KgbnPerspectiveKey, boolean> = createEmptySelections();
  const rawCustomItems: KgbnCustomItem[] = [];

  if (otherTextParam && typeof otherTextParam === 'string' && otherTextParam.trim()) {
    otherText = otherTextParam.trim();
  }

  if (Array.isArray(customCharacteristicsParam)) {
    customCharacteristicsParam.forEach(ci => {
      if (ci && typeof ci === 'object') {
        const itemText = (ci.text || '').trim();
        if (itemText) {
          const sel = createEmptySelections();
          if (ci.selections && typeof ci.selections === 'object') {
            KGBN_PERSPECTIVES.forEach(p => {
              if (ci.selections[p.key] !== undefined) sel[p.key] = Boolean(ci.selections[p.key]);
            });
          }
          rawCustomItems.push({
            id: ci.id,
            itemNumber: ci.itemNumber,
            text: itemText,
            selections: sel
          });
        }
      }
    });
  }

  for (let i = 1; i <= 40; i++) {
    parsedMap[i] = createEmptySelections();
  }

  // Handle polymorphic application wrapper (e.g. SurveyApplicationDto passed directly)
  let payload = rawAnswers;
  if (rawAnswers && typeof rawAnswers === 'object') {
    if (rawAnswers.resultSnapshot?.kgbnEvaluation) {
      const snapEval = rawAnswers.resultSnapshot.kgbnEvaluation;
      if (snapEval.totalItems && snapEval.perspectives && snapEval.comparisons) {
        return snapEval;
      }
    }
    if (rawAnswers.answers_json && typeof rawAnswers.answers_json === 'string') {
      try { payload = JSON.parse(rawAnswers.answers_json); } catch {}
    } else if (rawAnswers.answers) {
      payload = rawAnswers.answers;
    }
  }

  if (payload && typeof payload === 'object') {
    // 1. Check customCharacteristics or customItems array directly
    const directCustom = payload.customCharacteristics || payload.customItems || payload.otherItems;
    if (Array.isArray(directCustom)) {
      directCustom.forEach((ci: any) => {
        if (ci && typeof ci === 'object') {
          const itemText = (ci.text || ci.questionText || ci.label || '').trim();
          if (itemText) {
            const sel = createEmptySelections();
            if (ci.selections && typeof ci.selections === 'object') {
              KGBN_PERSPECTIVES.forEach(p => {
                if (ci.selections[p.key] !== undefined) {
                  sel[p.key] = Boolean(ci.selections[p.key]);
                }
              });
            }
            rawCustomItems.push({
              id: ci.id,
              itemNumber: ci.itemNumber,
              text: itemText,
              selections: sel
            });
          }
        }
      });
    }

    // 2. Array of items format e.g. { items: [...], otherText: '...', otherSelections: {...} }
    if (Array.isArray(payload.items)) {
      payload.items.forEach((it: any) => {
        const num = it.itemNumber || it.orderIndex || it.questionNumber;
        if (num >= 1 && num <= 40 && it.selections && typeof it.selections === 'object') {
          KGBN_PERSPECTIVES.forEach(p => {
            if (it.selections[p.key] !== undefined) {
              parsedMap[num][p.key] = Boolean(it.selections[p.key]);
            }
          });
        } else if (num > 40 && it.text) {
          const sel = createEmptySelections();
          if (it.selections && typeof it.selections === 'object') {
            KGBN_PERSPECTIVES.forEach(p => {
              if (it.selections[p.key] !== undefined) sel[p.key] = Boolean(it.selections[p.key]);
            });
          }
          rawCustomItems.push({
            id: it.id,
            itemNumber: num,
            text: String(it.text).trim(),
            selections: sel
          });
        }
      });
    }

    // 3. Array of answer objects from database/DTO e.g. [{ questionOrder: 1, answerValue: '...' }]
    if (Array.isArray(payload)) {
      payload.forEach((ans: any, idx: number) => {
        const qId = String(ans.questionId || '');
        let num = ans.questionOrder;
        if (!num && typeof qId === 'string') {
          const match = qId.match(/(\d+)/);
          if (match) num = parseInt(match[1], 10);
        }
        if (!num) num = idx + 1;
        const val = ans.answerValue || ans.value || ans.selectedOptionValue;

        // Dedicated custom items JSON container
        if (qId === 'kgbn_custom_items' || qId === 'customCharacteristics' || qId === 'custom_items') {
          if (typeof val === 'string' && val.trim().startsWith('[')) {
            try {
              const arr = JSON.parse(val);
              if (Array.isArray(arr)) {
                arr.forEach((ci: any) => {
                  const itemText = (ci.text || ci.questionText || ci.label || '').trim();
                  if (itemText) {
                    const sel = createEmptySelections();
                    if (ci.selections && typeof ci.selections === 'object') {
                      KGBN_PERSPECTIVES.forEach(p => {
                        if (ci.selections[p.key] !== undefined) sel[p.key] = Boolean(ci.selections[p.key]);
                      });
                    }
                    rawCustomItems.push({
                      id: ci.id,
                      itemNumber: ci.itemNumber,
                      text: itemText,
                      selections: sel
                    });
                  }
                });
              }
            } catch {}
          }
          return;
        }

        if (num >= 1 && num <= 40) {
          if (typeof val === 'string' && val.trim().startsWith('{')) {
            try {
              const obj = JSON.parse(val);
              KGBN_PERSPECTIVES.forEach(p => {
                if (obj[p.key] !== undefined) parsedMap[num][p.key] = Boolean(obj[p.key]);
              });
              if (num === 40 && obj.otherText) otherText = String(obj.otherText).trim();
            } catch {}
          } else if (typeof val === 'object' && val !== null) {
            KGBN_PERSPECTIVES.forEach(p => {
              if (val[p.key] !== undefined) parsedMap[num][p.key] = Boolean(val[p.key]);
            });
            if (num === 40 && val.otherText) otherText = String(val.otherText).trim();
          }
        } else if (num > 40 || qId.startsWith('custom_')) {
          let itemText = (ans.questionText || ans.text || '').trim();
          const sel = createEmptySelections();

          if (typeof val === 'string' && val.trim().startsWith('{')) {
            try {
              const obj = JSON.parse(val);
              KGBN_PERSPECTIVES.forEach(p => {
                if (obj[p.key] !== undefined) sel[p.key] = Boolean(obj[p.key]);
              });
              if (obj.text) itemText = String(obj.text).trim();
            } catch {}
          } else if (typeof val === 'object' && val !== null) {
            KGBN_PERSPECTIVES.forEach(p => {
              if (val[p.key] !== undefined) sel[p.key] = Boolean(val[p.key]);
            });
            if (val.text) itemText = String(val.text).trim();
          }

          if (itemText) {
            rawCustomItems.push({
              id: ans.questionId || `custom-${num}`,
              itemNumber: num,
              text: itemText,
              selections: sel
            });
          }
        }
      });
    }

    // 4. Flat or nested object keys e.g. payload['q1'], payload['1'], payload['q40_otherText']
    KGBN_DESCRIPTORS.forEach(desc => {
      const num = desc.itemNumber;
      const candidates = [
        payload[`q${num}`],
        payload[`item_${num}`],
        payload[String(num)],
        payload[`item${num}`]
      ];

      for (const cand of candidates) {
        if (cand !== undefined && cand !== null) {
          if (typeof cand === 'string' && cand.trim().startsWith('{')) {
            try {
              const obj = JSON.parse(cand);
              KGBN_PERSPECTIVES.forEach(p => {
                if (obj[p.key] !== undefined) parsedMap[num][p.key] = Boolean(obj[p.key]);
              });
              if (num === 40 && obj.otherText) otherText = String(obj.otherText).trim();
            } catch {}
          } else if (typeof cand === 'object') {
            KGBN_PERSPECTIVES.forEach(p => {
              if (cand[p.key] !== undefined) parsedMap[num][p.key] = Boolean(cand[p.key]);
            });
            if (num === 40 && cand.otherText) otherText = String(cand.otherText).trim();
          }
          break;
        }
      }

      // Flat keys check like payload['q1_teachers']
      KGBN_PERSPECTIVES.forEach(p => {
        const flatKey1 = `q${num}_${p.key}`;
        const flatKey2 = `${num}_${p.key}`;
        if (payload[flatKey1] !== undefined) parsedMap[num][p.key] = Boolean(payload[flatKey1]);
        if (payload[flatKey2] !== undefined) parsedMap[num][p.key] = Boolean(payload[flatKey2]);
      });
    });

    if (payload.otherText && typeof payload.otherText === 'string') {
      otherText = payload.otherText.trim();
    }
    if (payload.otherSelections && typeof payload.otherSelections === 'object') {
      KGBN_PERSPECTIVES.forEach(p => {
        if (payload.otherSelections[p.key] !== undefined) {
          otherSelections[p.key] = Boolean(payload.otherSelections[p.key]);
          parsedMap[40][p.key] = Boolean(payload.otherSelections[p.key]);
        }
      });
    }
  }

  // Deduplicate and normalize custom items
  const customCharacteristics: KgbnCustomItem[] = [];
  const seenTexts = new Set<string>();
  rawCustomItems.forEach((ci, idx) => {
    const cleanText = ci.text.trim();
    if (cleanText && !seenTexts.has(cleanText.toLowerCase())) {
      seenTexts.add(cleanText.toLowerCase());
      customCharacteristics.push({
        id: ci.id || `custom-${41 + idx}`,
        itemNumber: 41 + customCharacteristics.length,
        text: cleanText,
        selections: { ...ci.selections }
      });
    }
  });

  // Sync otherSelections with parsedMap[40]
  KGBN_PERSPECTIVES.forEach(p => {
    otherSelections[p.key] = parsedMap[40][p.key];
  });

  // Calculate perspectives & items details
  let selectedCellCount = 0;
  const perspectivesResult: Record<KgbnPerspectiveKey, KgbnPerspectiveResult> = {
    teachers: { key: 'teachers', label: 'Öğretmenlerime', orderIndex: 1, markedCount: 0, markedItems: [] },
    mother: { key: 'mother', label: 'Anneme', orderIndex: 2, markedCount: 0, markedItems: [] },
    father: { key: 'father', label: 'Babama', orderIndex: 3, markedCount: 0, markedItems: [] },
    siblings: { key: 'siblings', label: 'Kardeşlerime', orderIndex: 4, markedCount: 0, markedItems: [] },
    friends: { key: 'friends', label: 'Arkadaşlarıma', orderIndex: 5, markedCount: 0, markedItems: [] },
    self: { key: 'self', label: 'Bana', orderIndex: 6, markedCount: 0, markedItems: [] }
  };

  const allItemDetails: KgbnItemDetail[] = [];
  const selfOnly: KgbnItemDetail[] = [];
  const othersOnly: KgbnItemDetail[] = [];
  const sharedWithOthers: KgbnItemDetail[] = [];
  const unmarkedAnywhere: KgbnItemDetail[] = [];

  // 1. Process 40 standard descriptors
  KGBN_DESCRIPTORS.forEach(desc => {
    const num = desc.itemNumber;
    const selections = parsedMap[num];
    const isOther = desc.isOther;
    const displayText = isOther && otherText ? `${otherText} (Diğer)` : desc.text;

    let markedPerspectivesCount = 0;
    const markedPerspectiveLabels: string[] = [];

    KGBN_PERSPECTIVES.forEach(p => {
      if (selections[p.key]) {
        selectedCellCount++;
        markedPerspectivesCount++;
        markedPerspectiveLabels.push(p.label);

        perspectivesResult[p.key].markedCount++;
        perspectivesResult[p.key].markedItems.push({
          itemNumber: num,
          text: displayText,
          isOther
        });
      }
    });

    const isMarkedInSelf = Boolean(selections.self);
    const isMarkedInOthers = Boolean(
      selections.teachers || selections.mother || selections.father || selections.siblings || selections.friends
    );

    const itemDetail: KgbnItemDetail = {
      itemNumber: num,
      text: displayText,
      isOther,
      selections: { ...selections },
      markedPerspectivesCount,
      markedPerspectiveLabels
    };

    allItemDetails.push(itemDetail);

    if (isMarkedInSelf && !isMarkedInOthers) {
      selfOnly.push(itemDetail);
    } else if (!isMarkedInSelf && isMarkedInOthers) {
      othersOnly.push(itemDetail);
    } else if (isMarkedInSelf && isMarkedInOthers) {
      sharedWithOthers.push(itemDetail);
    } else {
      unmarkedAnywhere.push(itemDetail);
    }
  });

  // 2. Process custom characteristics (items 41+)
  customCharacteristics.forEach(ci => {
    const num = ci.itemNumber || (40 + allItemDetails.length - 39);
    const selections = ci.selections;
    const displayText = ci.text;

    let markedPerspectivesCount = 0;
    const markedPerspectiveLabels: string[] = [];

    KGBN_PERSPECTIVES.forEach(p => {
      if (selections[p.key]) {
        selectedCellCount++;
        markedPerspectivesCount++;
        markedPerspectiveLabels.push(p.label);

        perspectivesResult[p.key].markedCount++;
        perspectivesResult[p.key].markedItems.push({
          itemNumber: num,
          text: displayText,
          isOther: true
        });
      }
    });

    const isMarkedInSelf = Boolean(selections.self);
    const isMarkedInOthers = Boolean(
      selections.teachers || selections.mother || selections.father || selections.siblings || selections.friends
    );

    const itemDetail: KgbnItemDetail = {
      itemNumber: num,
      text: displayText,
      isOther: true,
      selections: { ...selections },
      markedPerspectivesCount,
      markedPerspectiveLabels
    };

    allItemDetails.push(itemDetail);

    if (isMarkedInSelf && !isMarkedInOthers) {
      selfOnly.push(itemDetail);
    } else if (!isMarkedInSelf && isMarkedInOthers) {
      othersOnly.push(itemDetail);
    } else if (isMarkedInSelf && isMarkedInOthers) {
      sharedWithOthers.push(itemDetail);
    } else {
      unmarkedAnywhere.push(itemDetail);
    }
  });

  const totalItems = 40 + customCharacteristics.length;
  const totalPossibleCells = totalItems * 6;

  // Calculate Least Perspective
  const perspectiveCounts = KGBN_PERSPECTIVES.map(p => ({
    key: p.key,
    label: p.label,
    count: perspectivesResult[p.key].markedCount
  }));
  const minCount = Math.min(...perspectiveCounts.map(p => p.count));
  const leastPerspectives = perspectiveCounts.filter(p => p.count === minCount);
  const leastPerspectiveLabel = leastPerspectives.length > 0
    ? `${leastPerspectives.map(p => p.label).join(', ')} (${minCount})`
    : 'Yok';

  return {
    totalItems,
    totalPossibleCells,
    selectedCellCount,
    otherText,
    otherSelections,
    customCharacteristics,
    perspectives: perspectivesResult,
    comparisons: {
      selfOnly,
      othersOnly,
      sharedWithOthers,
      unmarkedAnywhere
    },
    allItemDetails,
    leastPerspectives,
    leastPerspectiveLabel
  };
}

export interface KgbnCollectiveStudentRow {
  studentId: string;
  studentName: string;
  studentNumber: string;
  className: string;
  attemptNumber: number;
  completedAt: string;
  selectedCellCount: number;
  totalPossibleCells: number;
  perspectiveMarkCounts: Record<KgbnPerspectiveKey, number>;
  leastPerspectiveLabel: string;
  otherText: string;
  customCharacteristics: KgbnCustomItem[];
  customCharacteristicsSummary: string;
  marks: Record<number, Record<KgbnPerspectiveKey, boolean>>;
}

export interface KgbnItemSummary {
  itemNumber: number;
  text: string;
  isOther: boolean;
  perspectiveStats: Record<KgbnPerspectiveKey, {
    count: number;
    percentage: number;
    percentageFormatted: string;
  }>;
  totalMarkedAnyPerspectiveCount: number;
  percentageAnyPerspective: number;
  percentageAnyPerspectiveFormatted: string;
}

export interface KgbnCollectiveEvaluationResult {
  totalEvaluated: number;
  totalApplications: number;
  uniqueStudentsCount: number;
  scope: 'latest' | 'all';
  selectedClassFilter?: string;
  studentMatrix: KgbnCollectiveStudentRow[];
  itemSummaries: KgbnItemSummary[];
  perspectiveTotals: Record<KgbnPerspectiveKey, {
    totalMarksCount: number;
    averageMarksPerStudent: number;
  }>;
}

export function evaluateCollectiveKimeGoreBenNeyim(
  applications: Array<{
    id: string;
    studentId: string;
    studentName?: string;
    studentNumber?: string;
    className?: string;
    attemptNumber?: number;
    completedAt?: string | number;
    createdAt?: string | number;
    answers?: any;
    answers_json?: string;
    resultSnapshot?: any;
  }>,
  scopeOrOptions?: 'latest' | 'all' | { scope?: 'latest' | 'all'; classFilter?: string },
  classFilterArg?: string
): KgbnCollectiveEvaluationResult {
  let scope: 'latest' | 'all' = 'latest';
  let classFilter: string | undefined = undefined;

  if (typeof scopeOrOptions === 'string') {
    scope = scopeOrOptions;
    classFilter = classFilterArg;
  } else if (scopeOrOptions && typeof scopeOrOptions === 'object') {
    scope = scopeOrOptions.scope || 'latest';
    classFilter = scopeOrOptions.classFilter || classFilterArg;
  }

  let filtered = applications || [];
  if (classFilter && classFilter !== 'ALL' && classFilter !== 'Tümü' && classFilter.trim() !== '') {
    filtered = filtered.filter(a => (a.className || '').trim() === classFilter.trim());
  }

  let targetApps = filtered;
  if (scope === 'latest') {
    const studentLatestMap = new Map<string, any>();
    for (const app of filtered) {
      const sId = app.studentId || app.studentNumber || app.id;
      const existing = studentLatestMap.get(sId);
      if (!existing) {
        studentLatestMap.set(sId, app);
      } else {
        const existingTime = new Date(existing.completedAt || existing.createdAt || 0).getTime();
        const appTime = new Date(app.completedAt || app.createdAt || 0).getTime();
        const existingAttempt = existing.attemptNumber || 1;
        const appAttempt = app.attemptNumber || 1;

        if (appTime > existingTime || (appTime === existingTime && appAttempt > existingAttempt)) {
          studentLatestMap.set(sId, app);
        }
      }
    }
    targetApps = Array.from(studentLatestMap.values());
  }

  const totalEvaluated = targetApps.length;
  const uniqueStudentsCount = new Set(targetApps.map(a => a.studentId || a.studentNumber)).size;

  // Initialize accumulators for 40 items + any custom items
  const itemCounts: Record<number, Record<KgbnPerspectiveKey, number>> = {};
  const itemAnyCounts: Record<number, number> = {};
  const itemNamesMap: Record<number, { text: string; isOther: boolean }> = {};

  for (let i = 1; i <= 40; i++) {
    itemCounts[i] = {
      teachers: 0,
      mother: 0,
      father: 0,
      siblings: 0,
      friends: 0,
      self: 0
    };
    itemAnyCounts[i] = 0;
    itemNamesMap[i] = {
      text: KGBN_DESCRIPTORS[i - 1]?.text || `Madde ${i}`,
      isOther: i === 40
    };
  }

  const perspectiveTotals: Record<KgbnPerspectiveKey, { totalMarksCount: number; averageMarksPerStudent: number }> = {
    teachers: { totalMarksCount: 0, averageMarksPerStudent: 0 },
    mother: { totalMarksCount: 0, averageMarksPerStudent: 0 },
    father: { totalMarksCount: 0, averageMarksPerStudent: 0 },
    siblings: { totalMarksCount: 0, averageMarksPerStudent: 0 },
    friends: { totalMarksCount: 0, averageMarksPerStudent: 0 },
    self: { totalMarksCount: 0, averageMarksPerStudent: 0 }
  };

  const studentMatrix: KgbnCollectiveStudentRow[] = targetApps.map(app => {
    let evaluated: KgbnEvaluationResult;
    if (app.resultSnapshot?.kgbnEvaluation && app.resultSnapshot.kgbnEvaluation.perspectives) {
      evaluated = app.resultSnapshot.kgbnEvaluation;
    } else {
      let rawAnswers: any = {};
      if (typeof app.answers_json === 'string') {
        try { rawAnswers = JSON.parse(app.answers_json); } catch {}
      } else if (app.answers) {
        rawAnswers = app.answers;
      } else if (app.resultSnapshot?.rawMetrics?.answers) {
        rawAnswers = app.resultSnapshot.rawMetrics.answers;
      }
      evaluated = evaluateKimeGoreBenNeyim(rawAnswers);
    }

    const perspectiveMarkCounts: Record<KgbnPerspectiveKey, number> = {
      teachers: evaluated.perspectives.teachers.markedCount,
      mother: evaluated.perspectives.mother.markedCount,
      father: evaluated.perspectives.father.markedCount,
      siblings: evaluated.perspectives.siblings.markedCount,
      friends: evaluated.perspectives.friends.markedCount,
      self: evaluated.perspectives.self.markedCount
    };

    KGBN_PERSPECTIVES.forEach(p => {
      perspectiveTotals[p.key].totalMarksCount += perspectiveMarkCounts[p.key];
    });

    const marks: Record<number, Record<KgbnPerspectiveKey, boolean>> = {};

    evaluated.allItemDetails.forEach(item => {
      const num = item.itemNumber;
      marks[num] = { ...item.selections };

      if (!itemCounts[num]) {
        itemCounts[num] = {
          teachers: 0,
          mother: 0,
          father: 0,
          siblings: 0,
          friends: 0,
          self: 0
        };
        itemAnyCounts[num] = 0;
        itemNamesMap[num] = { text: item.text, isOther: true };
      }

      let isAny = false;
      KGBN_PERSPECTIVES.forEach(p => {
        if (item.selections[p.key]) {
          itemCounts[num][p.key]++;
          isAny = true;
        }
      });
      if (isAny) {
        itemAnyCounts[num]++;
      }
    });

    const customSummary = evaluated.customCharacteristics.length > 0
      ? evaluated.customCharacteristics.map(c => c.text).join(', ')
      : evaluated.otherText || '';

    return {
      studentId: app.studentId,
      studentName: app.studentName || 'Öğrenci',
      studentNumber: app.studentNumber || '—',
      className: app.className || '—',
      attemptNumber: app.attemptNumber || 1,
      completedAt: app.completedAt ? String(app.completedAt) : new Date().toISOString(),
      selectedCellCount: evaluated.selectedCellCount,
      totalPossibleCells: evaluated.totalPossibleCells,
      perspectiveMarkCounts,
      leastPerspectiveLabel: evaluated.leastPerspectiveLabel,
      otherText: evaluated.otherText,
      customCharacteristics: evaluated.customCharacteristics,
      customCharacteristicsSummary: customSummary,
      marks
    };
  });

  KGBN_PERSPECTIVES.forEach(p => {
    perspectiveTotals[p.key].averageMarksPerStudent = totalEvaluated > 0
      ? Math.round((perspectiveTotals[p.key].totalMarksCount / totalEvaluated) * 10) / 10
      : 0;
  });

  // Build item summaries for all registered items
  const allItemNumbers = Object.keys(itemCounts).map(Number).sort((a, b) => a - b);
  const itemSummaries: KgbnItemSummary[] = allItemNumbers.map(num => {
    const meta = itemNamesMap[num] || { text: `Madde ${num}`, isOther: num >= 40 };
    const stats: Record<KgbnPerspectiveKey, { count: number; percentage: number; percentageFormatted: string }> = {} as any;

    KGBN_PERSPECTIVES.forEach(p => {
      const c = itemCounts[num][p.key] || 0;
      const pct = totalEvaluated > 0 ? Math.round((c / totalEvaluated) * 100) : 0;
      stats[p.key] = {
        count: c,
        percentage: pct,
        percentageFormatted: totalEvaluated > 0 ? `%${pct}` : 'Veri yok'
      };
    });

    const anyCount = itemAnyCounts[num] || 0;
    const anyPct = totalEvaluated > 0 ? Math.round((anyCount / totalEvaluated) * 100) : 0;

    return {
      itemNumber: num,
      text: meta.text,
      isOther: meta.isOther,
      perspectiveStats: stats,
      totalMarkedAnyPerspectiveCount: anyCount,
      percentageAnyPerspective: anyPct,
      percentageAnyPerspectiveFormatted: totalEvaluated > 0 ? `%${anyPct}` : 'Veri yok'
    };
  });

  return {
    totalEvaluated,
    totalApplications: applications.length,
    uniqueStudentsCount,
    scope,
    selectedClassFilter: classFilter,
    studentMatrix,
    itemSummaries,
    perspectiveTotals
  };
}
