export interface BNAItemState {
  itemNumber: number;
  itemText: string;
  isSelected: boolean;
  rawAnswer: any;
}

export interface BNAIndividualEvaluationResult {
  selectedReasonCount: number;
  totalReasons: number;
  subjectText: string;
  itemStates: BNAItemState[];
  sourceInstruction: string;
  sourceDisclaimer: string;
}

export interface BNAItemStat {
  itemNumber: number;
  itemText: string;
  markedCount: number;
  totalStudents: number;
  percentage: number | null; // null if totalStudents === 0 (Veri yok / Hesaplanamıyor)
  percentageFormatted: string; // e.g. "%33,33" or "Hesaplanamıyor"
}

export interface BNAStudentMatrixRow {
  studentId: string;
  studentName: string;
  studentNumber: string;
  className: string;
  attemptNumber?: number;
  completedAt?: string | number;
  marks: Record<number, boolean>;
  totalMarked: number;
}

export interface BNATopReason {
  itemNumber: number;
  itemText: string;
  markedCount: number;
  totalStudents: number;
  percentage: number;
  percentageFormatted: string;
}

export interface BNACollectiveEvaluationResult {
  scope: 'latest' | 'all';
  classFilter?: string;
  totalStudents: number;
  totalApplications: number;
  totalMarkedReasons?: number;
  itemStats: BNAItemStat[];
  topReasons: BNATopReason[];
  studentMatrix: BNAStudentMatrixRow[];
  mostMarkedSummary: string;
}

export const BNA_SCALE_METADATA = {
  name: "Başarısızlık Nedenleri Anketi",
  code: "BNA-44",
  slug: "basarisizlik-nedenleri-anketi",
  id: "srv-basarisizlik-nedenleri-anketi",
  version: "ver-basarisizlik-nedenleri-anketi-v1",
  itemCount: 44,
  scaleType: "Binary (İşaretlendi / İşaretlenmedi)",
  scoring: "Çetele ve Yüzde Değerlendirmesi",
  targetAudience: "İlköğretim 4, 5, 6, 7, 8 ve Ortaöğretim Kademesi",
  purpose: "Öğrencilerin başarısız olmasına yol açan nedenleri öğrenmek ve bu nedenlerin ortadan kaldırılmasına yönelik rehberlik çalışmasına yardımcı olmak."
};

export const BNA_OPTIONS = [
  { label: 'İşaretledim', value: '1', score: 1 },
  { label: 'İşaretlemedim', value: '0', score: 0 }
];

export const BNA_QUESTIONS: string[] = [
  "Ailem çok kalabalık.",
  "Annem derslerimde bana yardımcı olmuyor.",
  "Babam derslerimde bana yardımcı olmuyor.",
  "Ayrı bir çalışma odam yok.",
  "Ailemden ayrı kalıyorum.",
  "Ailem bana kardeşlerimden farklı bir muamelede bulunuyor.",
  "Babam beni sık sık döver.",
  "Ailem ders çalışmam için gereksiz baskı yapıyor.",
  "Ailem beni küçük bir çocukmuşum gibi görüyor.",
  "Ailem fazla otoriter, istediğim gibi hareket etmeme izin vermiyorlar.",
  "Ailem beni fazla ihmal ediyor, benimle fazla ilgilenmiyorlar.",
  "Kardeşlerim sık sık kavga ediyor, ben de bu durumdan etkileniyorum.",
  "Ailem ile akrabalarım arasında sık sık kavga olur bu da beni etkiliyor.",
  "Öğretmenimin anlattıklarını anlamıyorum.",
  "Dikkatimi devamlı olarak derse veremiyorum.",
  "Sınıfta öğreniyorum fakat hemen unutuyorum.",
  "Öğrendiklerimi uygulamaya imkan bulamıyorum.",
  "Okuduğumu anlamıyorum.",
  "Bildiklerimi yazı ile anlatamıyorum. Yazılılardan devamlı olarak zayıf alıyorum.",
  "Bildiklerimi sözle anlatamıyorum. Sözlülerden devamlı olarak zayıf alıyorum.",
  "Başarılı olduğum zaman mükafatımı (ödülümü) alamıyorum.",
  "Bu derslere ilgi duymuyorum.",
  "Arkadaşlarımla iyi geçinemiyorum.",
  "Sınıfımız çok kalabalık bu yüzden dersleri iyi takip edemiyorum.",
  "Kendime iyi bir arkadaş bulamadım.",
  "Bu derste verilen bilgiler benim işime yaramıyor.",
  "Çalışmaya fazla zaman ayıramıyorum.",
  "Oyun oynamayı çok seviyorum.",
  "Ailemin verdiği işleri yapmaktan ders çalışmaya vakit bulamıyorum.",
  "Sağlığım pek iyi değil.",
  "Araştırma yapmak için yeterli kaynak bulamıyorum.",
  "Kaynakları nereden bulabileceğimi bilemiyorum.",
  "Öğretmenlerim çok fazla ödev veriyorlar yetiştiremiyorum.",
  "Ödevlerim çok ağır geliyor.",
  "Ders çalışırken başka şeyler düşündüğümden dolayı kendimi derse veremiyorum.",
  "Öğrendiğimi sanıyorum fakat sınavlarda sorulara cevap veremiyorum.",
  "Sınıfta oturduğum yer dersleri takip etmemde uygun bir yer değil.",
  "Öğretmenimden gerekli ilgiyi göremiyorum.",
  "Ders çalışmayı sevmiyorum.",
  "Derslerde iyi not tutamıyorum.",
  "Derslere beraber çalışacağım arkadaş grubum yok.",
  "Maddi durumumuz iyi değil bu durum derslerime yansıyor.",
  "Arkadaşlarımla beraber devamlı olarak gezip ve eğleniyoruz.",
  "Okul dışında gittiğim spor faaliyetleri (herhangi bir faaliyet) beni etkiliyor."
];

export const BNA_INSTRUCTION_TEXT = "Bu liste; derslerinizden düşük not alma sebeplerinizi tespit ederek sizlere yardımcı olabilmek amacıyla hazırlanmıştır. Sizden aşağıdaki ifadelerden ders notlarınızın düşük olmasına sebep olanları ve ders çalışmanızı engelleyen nedenleri işaretlemeniz istenmektedir.";
export const BNA_DISCLAIMER_TEXT = "Bu anket bir test veya klinik tanı ölçeği değildir. Elde edilen sonuçlar öğrencinin kendi ifadesiyle belirlediği başarısızlık nedenleridir ve rehberlik çalışmalarına yol gösterici betimsel bilgi sağlar.";

export function isBNAMarked(val: any): boolean {
  if (val === true || val === 1 || val === '1' || val === 'evet' || val === 'true' || val === 'İşaretledim' || val === 'isaretledim') {
    return true;
  }
  return false;
}

/**
 * Extracts normalized answers and subjectText from any BNA application, snapshot, array, or object format.
 */
export function extractBNAAnswersMap(input: any): { answers: Record<string, any>; subjectText: string } {
  if (!input) return { answers: {}, subjectText: '' };
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return extractBNAAnswersMap(parsed);
    } catch {
      return { answers: {}, subjectText: '' };
    }
  }

  let subjectText = '';
  const answers: Record<string, any> = {};

  if (typeof input === 'object') {
    subjectText = (
      input.subjectText ||
      input.resultSnapshot?.subjectText ||
      input.resultSnapshot?.bnaEvaluation?.subjectText ||
      input.resultSnapshot?.rawMetrics?.subjectText ||
      input.rawMetrics?.subjectText ||
      input.dersler ||
      input.ders_adi ||
      input.subject ||
      ''
    ).toString().trim();

    const evalObj = input.bnaEvaluation || input.resultSnapshot?.bnaEvaluation || input.rawMetrics?.bnaEvaluation;
    if (evalObj?.itemStates && Array.isArray(evalObj.itemStates) && evalObj.itemStates.length > 0) {
      evalObj.itemStates.forEach((it: any) => {
        const num = it.itemNumber;
        if (num) {
          answers[`q${num}`] = it.isSelected ? '1' : (it.rawAnswer ?? '0');
        }
      });
      if (evalObj.subjectText && !subjectText) {
        subjectText = evalObj.subjectText.toString().trim();
      }
      return { answers, subjectText };
    }

    if (input.resultSnapshot?.rawMetrics?.answers) {
      const sub = extractBNAAnswersMap(input.resultSnapshot.rawMetrics.answers);
      return { answers: sub.answers, subjectText: subjectText || sub.subjectText };
    }
    if (input.resultSnapshot?.answers) {
      const sub = extractBNAAnswersMap(input.resultSnapshot.answers);
      return { answers: sub.answers, subjectText: subjectText || sub.subjectText };
    }
    if (input.rawMetrics?.answers) {
      const sub = extractBNAAnswersMap(input.rawMetrics.answers);
      return { answers: sub.answers, subjectText: subjectText || sub.subjectText };
    }
    if (input.answersJson) {
      const sub = extractBNAAnswersMap(input.answersJson);
      return { answers: sub.answers, subjectText: subjectText || sub.subjectText };
    }
    if (input.answers_json) {
      const sub = extractBNAAnswersMap(input.answers_json);
      return { answers: sub.answers, subjectText: subjectText || sub.subjectText };
    }
    if (Array.isArray(input.answers)) {
      const sub = extractBNAAnswersMap(input.answers);
      return { answers: sub.answers, subjectText: subjectText || sub.subjectText };
    }
    if (input.answers && typeof input.answers === 'object') {
      const sub = extractBNAAnswersMap(input.answers);
      return { answers: sub.answers, subjectText: subjectText || sub.subjectText };
    }
    if (Array.isArray(input)) {
      input.forEach((a: any, idx: number) => {
        if (a.questionId === 'subjectText' || a.questionId === 'dersler' || a.questionId === 'ders_adi' || a.questionId === 'q0') {
          if (!subjectText) {
            subjectText = (a.answerValue ?? a.value ?? a.selectedOptionLabel ?? '').toString().trim();
          }
          return;
        }
        const qNum = a.questionOrder || a.itemNumber || a.order || idx + 1;
        const val = a.answerValue ?? a.selectedOptionLabel ?? a.selectedOptionValue ?? a.value ?? a.rawAnswer ?? '';
        answers[`q${qNum}`] = val;
        if (a.questionId) answers[a.questionId] = val;
      });
      return { answers, subjectText };
    }
  }
  return { answers: input || {}, subjectText };
}

export function evaluateIndividualBNA(
  input: any,
  subjectTextOverride?: string
): BNAIndividualEvaluationResult {
  const extracted = extractBNAAnswersMap(input);
  const answers = extracted.answers;
  const itemStates: BNAItemState[] = [];
  let selectedReasonCount = 0;

  const subjectText = (
    subjectTextOverride ||
    extracted.subjectText ||
    answers['subjectText'] ||
    answers['dersler'] ||
    answers['ders_adi'] ||
    answers['q0'] ||
    answers['subject'] ||
    ''
  ).toString().trim();

  for (let i = 1; i <= 44; i++) {
    const rawVal =
      answers[`q${i}`] ??
      answers[`m${i}`] ??
      answers[String(i)] ??
      answers[`q-basarisizlik-nedenleri-anketi-${i}`] ??
      answers[`item_${i}`];

    const isSelected = isBNAMarked(rawVal);
    if (isSelected) {
      selectedReasonCount++;
    }

    itemStates.push({
      itemNumber: i,
      itemText: BNA_QUESTIONS[i - 1] || `Madde ${i}`,
      isSelected,
      rawAnswer: rawVal
    });
  }

  return {
    selectedReasonCount,
    totalReasons: 44,
    subjectText,
    itemStates,
    sourceInstruction: BNA_INSTRUCTION_TEXT,
    sourceDisclaimer: BNA_DISCLAIMER_TEXT
  };
}

export interface BNAApplicationData {
  id: string;
  studentId: string;
  studentName?: string;
  studentNumber?: string;
  className?: string;
  attemptNumber?: number;
  completedAt?: string | number;
  answers: Record<string, any>;
  resultSnapshot?: any;
  bnaEvaluation?: BNAIndividualEvaluationResult;
  rawMetrics?: any;
}

export function evaluateCollectiveBNA(
  applications: BNAApplicationData[],
  scope: 'latest' | 'all' = 'latest',
  classFilter?: string
): BNACollectiveEvaluationResult {
  let filtered = applications.filter(app => {
    if (!classFilter || classFilter === 'all') return true;
    return app.className === classFilter;
  });

  const totalApplications = filtered.length;

  let validApps: BNAApplicationData[] = [];
  if (scope === 'latest') {
    const byStudent = new Map<string, BNAApplicationData>();
    for (const app of filtered) {
      const existing = byStudent.get(app.studentId);
      if (!existing) {
        byStudent.set(app.studentId, app);
      } else {
        const existingAttempt = existing.attemptNumber ?? 0;
        const currentAttempt = app.attemptNumber ?? 0;
        const existingTime = existing.completedAt ? new Date(existing.completedAt).getTime() : 0;
        const currentTime = app.completedAt ? new Date(app.completedAt).getTime() : 0;

        if (currentAttempt > existingAttempt || (currentAttempt === existingAttempt && currentTime >= existingTime)) {
          byStudent.set(app.studentId, app);
        }
      }
    }
    validApps = Array.from(byStudent.values());
  } else {
    validApps = [...filtered];
  }

  const totalStudents = validApps.length;
  const itemCounts = new Array(45).fill(0);
  const studentMatrix: BNAStudentMatrixRow[] = [];

  for (const app of validApps) {
    const evalRes = (app.bnaEvaluation?.itemStates?.length === 44)
      ? app.bnaEvaluation
      : (app.resultSnapshot?.bnaEvaluation?.itemStates?.length === 44)
        ? app.resultSnapshot.bnaEvaluation
        : (app.resultSnapshot?.rawMetrics?.bnaEvaluation?.itemStates?.length === 44)
          ? app.resultSnapshot.rawMetrics.bnaEvaluation
          : evaluateIndividualBNA(app, app.resultSnapshot?.subjectText || (app as any).subjectText);
    const marks: Record<number, boolean> = {};

    for (const item of evalRes.itemStates) {
      marks[item.itemNumber] = item.isSelected;
      if (item.isSelected) {
        itemCounts[item.itemNumber]++;
      }
    }

    studentMatrix.push({
      studentId: app.studentId,
      studentName: app.studentName || 'Bilinmeyen Öğrenci',
      studentNumber: app.studentNumber || '-',
      className: app.className || '-',
      attemptNumber: app.attemptNumber,
      completedAt: app.completedAt,
      marks,
      totalMarked: evalRes.selectedReasonCount
    });
  }

  const itemStats: BNAItemStat[] = [];
  for (let i = 1; i <= 44; i++) {
    const marked = itemCounts[i];
    let percentage: number | null = null;
    let percentageFormatted = 'Hesaplanamıyor';

    if (totalStudents > 0) {
      const p = (marked / totalStudents) * 100;
      percentage = parseFloat(p.toFixed(2));
      percentageFormatted = `%${percentage.toFixed(2).replace('.', ',')}`;
    }

    itemStats.push({
      itemNumber: i,
      itemText: BNA_QUESTIONS[i - 1] || `Madde ${i}`,
      markedCount: marked,
      totalStudents,
      percentage,
      percentageFormatted
    });
  }

  const topReasons: BNATopReason[] = itemStats
    .filter(stat => stat.percentage !== null && stat.markedCount > 0)
    .map(stat => ({
      itemNumber: stat.itemNumber,
      itemText: stat.itemText,
      markedCount: stat.markedCount,
      totalStudents: stat.totalStudents,
      percentage: stat.percentage as number,
      percentageFormatted: stat.percentageFormatted
    }))
    .sort((a, b) => b.percentage - a.percentage || a.itemNumber - b.itemNumber)
    .slice(0, 5);

  let mostMarkedSummary = 'Henüz veri bulunmamaktadır.';
  if (totalStudents === 0) {
    mostMarkedSummary = 'Seçilen kapsamda değerlendirilecek öğrenci verisi bulunmamaktadır.';
  } else if (topReasons.length > 0) {
    const top = topReasons[0];
    mostMarkedSummary = `Grupta en yüksek işaretleme oranına sahip neden "${top.itemText}" olmuştur (${top.percentageFormatted}; ${top.markedCount}/${top.totalStudents} öğrenci).`;
  } else {
    mostMarkedSummary = `Seçilen ${totalStudents} öğrencinin hiçbiri başarısızlık nedeni işaretlememiştir.`;
  }

  return {
    scope,
    classFilter,
    totalStudents,
    totalApplications,
    totalMarkedReasons: studentMatrix.reduce((acc, s) => acc + s.totalMarked, 0),
    itemStats,
    topReasons,
    studentMatrix,
    mostMarkedSummary
  };
}
