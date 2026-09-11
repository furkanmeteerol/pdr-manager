import Database from 'better-sqlite3';
import { DEVAMSIZLIK_NEDENLERI_ANKETI, RealSurveyDefinition } from './definitions/devamsizlikNedenleriAnketi';
import { SINAV_KAYGISI_OLCEGI } from './definitions/sinavKaygisiOlcegi';
import { WESTSIDE_SINAV_KAYGISI_OLCEGI } from './definitions/westsideSinavKaygisiOlcegi';
import { HOLLAND_MESLEKI_TERCIH_ENVANTERI } from './definitions/hollandMeslekiTercihEnvanteri';
import { HOLLAND_KISA_MESLEKI_TARAMA_ENVANTERI } from './definitions/hollandKisaMeslekiTarama';
import { MESLEK_DEGERI_ENVANTERI } from './definitions/meslekDegeriEnvanteri';
import { AKADEMIK_ERTELEME_OLCEGI } from './definitions/academicProcrastination';
import { BURDON_DIKKAT_TESTI } from './definitions/burdonDikkatTesti';
import { OTOMATIK_DUSUNCELER_OLCEGI } from './definitions/automaticThoughts';
import { BASARISIZLIK_NEDENLERI_ANKETI } from './definitions/basarisizlikNedenleriAnketi';
import { CALISMA_DAVRANISINI_DEGERLENDIRME_OLCEGI } from './definitions/calismaDavranisi';
import { PROBLEM_TARAMA_LISTESI } from './definitions/problemTaramaListesi';
import { ROSENBERG_BENLIK_SAYGISI } from './definitions/rosenbergBenlikSaygisi';
import { KIME_GORE_BEN_NEYIM } from './definitions/kimeGoreBenNeyim';
import { AKADEMIK_BENLIK_ALGISI_OLCEGI } from './definitions/akademikBenlikAlgisi';
import { logger } from '../logger/Logger';

/**
 * Built-in Official System Catalog Registry
 * Extensible for all standard MEB surveys, scales, and psychological counseling inventories.
 */
export const SYSTEM_CATALOG_REGISTRY: RealSurveyDefinition[] = [
  DEVAMSIZLIK_NEDENLERI_ANKETI,
  SINAV_KAYGISI_OLCEGI,
  WESTSIDE_SINAV_KAYGISI_OLCEGI,
  HOLLAND_MESLEKI_TERCIH_ENVANTERI,
  HOLLAND_KISA_MESLEKI_TARAMA_ENVANTERI,
  MESLEK_DEGERI_ENVANTERI,
  AKADEMIK_ERTELEME_OLCEGI,
  BURDON_DIKKAT_TESTI,
  OTOMATIK_DUSUNCELER_OLCEGI,
  BASARISIZLIK_NEDENLERI_ANKETI,
  CALISMA_DAVRANISINI_DEGERLENDIRME_OLCEGI,
  PROBLEM_TARAMA_LISTESI,
  ROSENBERG_BENLIK_SAYGISI,
  KIME_GORE_BEN_NEYIM,
  AKADEMIK_BENLIK_ALGISI_OLCEGI
];

export class SystemCatalogService {
  /**
   * Returns all registered built-in official survey definitions.
   */
  public static getBuiltinSurveys(): RealSurveyDefinition[] {
    return SYSTEM_CATALOG_REGISTRY;
  }

  /**
   * Seeds or updates all official system catalog surveys into SQLite database.
   * This is system metadata and MUST NEVER be deleted by user data resets.
   */
  public static seedAllCatalogs(sqlite: Database.Database, deviceId: string = 'system-device'): void {
    if (!sqlite) return;

    const now = Date.now();
    logger.info(`Seeding ${SYSTEM_CATALOG_REGISTRY.length} official system survey catalogs...`);

    const seedTx = sqlite.transaction(() => {
      for (const surveyDef of SYSTEM_CATALOG_REGISTRY) {
        const surveyId = surveyDef.id;
        const versionId = `ver-${surveyDef.slug}-v1`;

        // 1. Insert or Update Survey Record
        sqlite.prepare(`
          INSERT INTO surveys (
            id, slug, title, description, type, repeat_policy, 
            is_active, current_version_number, scoring_method, 
            created_at, updated_at, version, last_modified_device_id
          ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, 1, ?)
          ON CONFLICT(id) DO UPDATE SET
            slug = excluded.slug,
            title = excluded.title,
            description = excluded.description,
            type = excluded.type,
            repeat_policy = excluded.repeat_policy,
            is_active = 1,
            current_version_number = 1,
            scoring_method = excluded.scoring_method,
            updated_at = excluded.updated_at,
            deleted_at = NULL
        `).run(
          surveyId,
          surveyDef.slug,
          surveyDef.title,
          surveyDef.description || null,
          surveyDef.type,
          surveyDef.repeatPolicy,
          surveyDef.scoringType.toLowerCase(),
          now,
          now,
          deviceId
        );

        // 2. Insert or Update Survey Version
        sqlite.prepare(`
          INSERT INTO survey_versions (
            id, survey_id, version_number, title_snapshot, description_snapshot, 
            scoring_type, is_published, published_at, 
            created_at, updated_at, version, last_modified_device_id
          ) VALUES (?, ?, 1, ?, ?, ?, 1, ?, ?, ?, 1, ?)
          ON CONFLICT(id) DO UPDATE SET
            title_snapshot = excluded.title_snapshot,
            description_snapshot = excluded.description_snapshot,
            scoring_type = excluded.scoring_type,
            is_published = 1,
            updated_at = excluded.updated_at,
            deleted_at = NULL
        `).run(
          versionId,
          surveyId,
          surveyDef.title,
          surveyDef.description || null,
          surveyDef.scoringType,
          now,
          now,
          now,
          deviceId
        );

        // 3. Insert or Update Subscales
        const subscaleIdMap = new Map<string, string>();
        if (surveyDef.subscales && surveyDef.subscales.length > 0) {
          const upsertSubscale = sqlite.prepare(`
            INSERT INTO survey_subscales (
              id, survey_version_id, code, title, description, calculation_method, order_index, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              code = excluded.code,
              title = excluded.title,
              description = excluded.description,
              calculation_method = excluded.calculation_method,
              order_index = excluded.order_index,
              updated_at = excluded.updated_at
          `);

          for (let i = 0; i < surveyDef.subscales.length; i++) {
            const sub = surveyDef.subscales[i];
            const subId = `sub-${surveyDef.slug}-${sub.code.toLowerCase()}`;
            subscaleIdMap.set(sub.code, subId);

            upsertSubscale.run(
              subId,
              versionId,
              sub.code,
              sub.title,
              sub.description || null,
              sub.calculationMethod,
              sub.orderIndex || (i + 1),
              now,
              now
            );
          }
        }

        // 4. Insert or Update Interpretations
        if (surveyDef.interpretations && surveyDef.interpretations.length > 0) {
          const upsertInterp = sqlite.prepare(`
            INSERT INTO survey_interpretations (
              id, survey_version_id, subscale_id, min_score, max_score, label, description, color_code, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              subscale_id = excluded.subscale_id,
              min_score = excluded.min_score,
              max_score = excluded.max_score,
              label = excluded.label,
              description = excluded.description,
              color_code = excluded.color_code,
              updated_at = excluded.updated_at
          `);

          for (let i = 0; i < surveyDef.interpretations.length; i++) {
            const interp = surveyDef.interpretations[i];
            const interpId = `int-${surveyDef.slug}-${i + 1}`;
            const targetSubscaleId = interp.subscaleCode ? subscaleIdMap.get(interp.subscaleCode) || null : null;

            upsertInterp.run(
              interpId,
              versionId,
              targetSubscaleId,
              interp.minScore,
              interp.maxScore,
              interp.label,
              interp.description || null,
              interp.colorCode || 'blue',
              now,
              now
            );
          }
        }

        // 5. Insert or Update Questions and Options
        const upsertQuestion = sqlite.prepare(`
          INSERT INTO survey_questions (
            id, survey_id, survey_version_id, question_order, question_text, question_type, subscale_id, is_reverse_scored, required, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            question_order = excluded.question_order,
            question_text = excluded.question_text,
            question_type = excluded.question_type,
            subscale_id = excluded.subscale_id,
            is_reverse_scored = excluded.is_reverse_scored,
            required = excluded.required,
            updated_at = excluded.updated_at
        `);

        const upsertOption = sqlite.prepare(`
          INSERT INTO survey_options (
            id, question_id, option_order, option_text, option_label, option_value, score, score_value, reverse_score_value
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            option_order = excluded.option_order,
            option_text = excluded.option_text,
            option_label = excluded.option_label,
            option_value = excluded.option_value,
            score = excluded.score,
            score_value = excluded.score_value,
            reverse_score_value = excluded.reverse_score_value
        `);

        for (let qIdx = 0; qIdx < surveyDef.questions.length; qIdx++) {
          const q = surveyDef.questions[qIdx];
          const qId = `q-${surveyDef.slug}-${q.orderIndex || qIdx + 1}`;
          const assignedSubscaleId = q.subscaleCode ? subscaleIdMap.get(q.subscaleCode) || null : null;

          upsertQuestion.run(
            qId,
            surveyId,
            versionId,
            q.orderIndex || (qIdx + 1),
            q.text,
            q.type,
            assignedSubscaleId,
            q.isReverseScored ? 1 : 0,
            q.required !== false ? 1 : 0,
            now,
            now
          );

          if (q.options && q.options.length > 0) {
            for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
              const opt = q.options[oIdx];
              const optId = `opt-${surveyDef.slug}-${q.orderIndex || qIdx + 1}-${oIdx + 1}`;

              upsertOption.run(
                optId,
                qId,
                oIdx + 1,
                opt.label,
                opt.label,
                opt.value || opt.label.toLowerCase(),
                opt.score,
                opt.score,
                opt.reverseScore ?? (6 - opt.score)
              );
            }
          }
        }

        logger.info(`Registered system catalog survey: ${surveyDef.title} (${surveyDef.questions.length} questions, ${surveyDef.subscales.length} subscales)`);
      }
    });

    seedTx();
  }
}
