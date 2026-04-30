/* Hookah Mixology Engine Pro — v33 scoring-engine.js
   Scoring split module. Loaded AFTER app.js and BEFORE mixology-engine.js.
   Active scoring/calibration entrypoints live here.
*/
(function () {
  'use strict';

  const ScoringEngine = {
    version: 'v33-scoring-engine-split',

    clamp(value, min, max) {
      return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
    },

    compatibilityLabel(score) {
      if (score >= 90) return 'excellent';
      if (score >= 82) return 'good';
      if (score >= 72) return 'mid';
      if (score >= 56) return 'risky';
      return 'bad';
    },

    hashDelta(text, range) {
      let hash = 0;
      const s = String(text || '');
      for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
      const span = range * 2 + 1;
      return Math.abs(hash) % span - range;
    },

    safeAnalysis(item) {
      return (item && item.analysis) || {};
    },

    safeTraits(item) {
      return this.safeAnalysis(item).traits || {};
    },

    category(item) {
      return this.safeAnalysis(item).category || 'fruit';
    },

    roleSuit(item, role) {
      const a = this.safeAnalysis(item);
      return Number(a.roleSuit && a.roleSuit[role] || 0);
    },

    scorePair(app, a, b) {
      if (!a || !b) return { score: 0, shared: 0, conflict: 0 };

      const tA = this.safeTraits(a);
      const tB = this.safeTraits(b);
      const catA = this.category(a);
      const catB = this.category(b);

      let catScore = 1.6;
      if (typeof app.pairCategoryScore === 'function') {
        catScore = Number(app.pairCategoryScore(catA, catB) || 0);
      }

      const shared = ['berry','citrus','tropical','green','tea','woody','juicy','candy'].reduce((sum, key) => {
        return sum + Math.min(Number(tA[key] || 0), Number(tB[key] || 0));
      }, 0) / 11;

      const contrastGood =
        (Math.abs(Number(tA.acidity || 0) - Number(tB.sweetness || 0)) < 4 ? 1 : 0) +
        (Math.abs(Number(tA.creaminess || 0) - Number(tB.acidity || 0)) > 3 ? 1 : 0) +
        (Math.abs(Number(tA.depth || 0) - Number(tB.brightness || 0)) > 2 ? 1 : 0);

      const conflict =
        ((Number(tA.cooling || 0) >= 7 && Number(tB.spicy || 0) >= 6) || (Number(tB.cooling || 0) >= 7 && Number(tA.spicy || 0) >= 6) ? 3 : 0) +
        ((Number(tA.floral || 0) >= 7 && Number(tB.woody || 0) >= 6) || (Number(tB.floral || 0) >= 7 && Number(tA.woody || 0) >= 6) ? 3 : 0) +
        ((Number(tA.cooling || 0) >= 7 && Number(tB.creaminess || 0) >= 7) || (Number(tB.cooling || 0) >= 7 && Number(tA.creaminess || 0) >= 7) ? 1 : 0);

      return { score: catScore + shared + contrastGood - conflict, shared, conflict };
    },

    detectScoringRisks(app, result, style) {
      const items = Array.isArray(result.items) ? result.items : [];
      const body = items.find(i => i.role === 'body') || items[0];
      const cooler = items.find(i => i.role === 'cooler');
      const risks = Array.isArray(result.risks) ? result.risks.slice() : [];

      const bodySuit = this.roleSuit(body, 'body');
      const bodyCat = this.category(body);
      const bodyTraits = this.safeTraits(body);

      if (bodySuit < 5.5 && !risks.some(r => String(r.text || '').includes('роль центра'))) {
        risks.push({
          level: 'medium',
          text: 'Тело выбрано спорно: вкус слабоват для роли центра, лучше использовать его как поддержку или акцент.'
        });
      }

      if (app.isCandyNotCoolingV27 && app.isCandyNotCoolingV27(body) && bodyCat === 'candy' && style !== 'dessert' && !risks.some(r => String(r.text || '').includes('конфетное тело'))) {
        risks.push({
          level: 'medium',
          text: 'Конфетное тело может звучать слишком сладко и плоско. Лучше держать его в поддержке или округлителе.'
        });
      }

      if (cooler) {
        const pct = Number(cooler.percent || 0);
        if (pct >= 12 && !risks.some(r => String(r.text || '').includes('яркий холод'))) {
          risks.push({
            level: 'medium',
            text: 'Яркий холод может съесть тело микса. Контролируй жар и не перегревай чашу.'
          });
        }
      }

      if (style === 'dessert' && Number(bodyTraits.acidity || 0) >= 6 && Number(bodyTraits.creaminess || 0) < 4 && !risks.some(r => String(r.text || '').includes('десертного'))) {
        risks.push({
          level: 'medium',
          text: 'Для десертного сценария тело слишком кислое или сухое. Лучше добавить мягкий округлитель.'
        });
      }

      return risks;
    },

    calibrateMixScore(app, result, meta = {}) {
      if (!result) return result;

      const style = meta.style || result.style || 'universal';
      const items = Array.isArray(result.items) ? result.items.map(item => {
        return app.applyCandyCoolingCorrectionV27 ? app.applyCandyCoolingCorrectionV27(item) : item;
      }) : [];

      result.items = items;

      const body = items.find(i => i.role === 'body') || items[0];
      const cooler = items.find(i => i.role === 'cooler');
      const conceptKey = String(result._historyConceptKey || result.mixConcept || result.styleVariant || '').toLowerCase();

      const bodyAnalysis = this.safeAnalysis(body);
      const bodyTraits = this.safeTraits(body);
      const bodySuit = this.roleSuit(body, 'body');
      const bodyCat = this.category(body);

      let score = Number(result.compatibilityScore || (result.scoreBreakdown && result.scoreBreakdown.total) || 72);

      const mainItems = items.filter(i => i.role !== 'cooler');
      if (body && mainItems.length > 1) {
        const pairs = mainItems.filter(i => i !== body).map(i => this.scorePair(app, body, i));
        if (pairs.length) {
          const avgPair = pairs.reduce((sum, p) => sum + Number(p.score || 0) - Number(p.conflict || 0) * 1.2, 0) / pairs.length;
          score += Math.round((avgPair - 4) * 1.35);
        }
      }

      score += Math.round((bodySuit - 6) * 1.8);
      score += this.hashDelta(items.map(i => `${i.name}:${i.percent}:${i.role}`).join('|') + conceptKey + style, 3);

      // Hard ceilings for weak or wrong bodies.
      if (bodySuit < 4.5) score = Math.min(score, 58);
      else if (bodySuit < 5.5) score = Math.min(score, 68);
      else if (bodySuit < 6.5) score = Math.min(score, 77);

      if (bodyCat === 'cooling') score = Math.min(score, 52);
      if (bodyCat === 'candy' && style !== 'dessert') score = Math.min(score, 76);
      if (style === 'dessert' && !['dessert','creamy','candy'].includes(bodyCat)) score = Math.min(score, 78);
      if ((style === 'fresh' || style === 'citrus') && ['dessert','creamy'].includes(bodyCat)) score = Math.min(score, 78);
      if (conceptKey.includes('dessert') && !['dessert','creamy','candy'].includes(bodyCat) && Number(bodyTraits.creaminess || 0) < 4) score = Math.min(score, 76);

      if (cooler) {
        const pct = Number(cooler.percent || 0);
        if (pct >= 12) score = Math.min(score, 86);
        if (pct >= 8 && style === 'dessert') score = Math.min(score, 84);
        if (pct >= 5 && bodyCat === 'dessert') score = Math.min(score, 86);
      }

      const risks = this.detectScoringRisks(app, result, style);
      result.risks = risks;

      const high = risks.filter(r => r.level === 'high').length;
      const medium = risks.filter(r => r.level === 'medium').length;
      score -= high * 8 + medium * 3;

      // More honest spread: excellent remains rare.
      if (score > 94) score = 94;
      score = this.clamp(score, 35, 94);

      result.compatibilityScore = score;
      result.compatibilityLabel = this.compatibilityLabel(score);
      if (result.scoreBreakdown) result.scoreBreakdown.total = score;

      if (score >= 90) result.overallVerdict = `Очень сильный микс: база "${result.bodyName}" читаемая, роли распределены грамотно.`;
      else if (score >= 82) result.overallVerdict = `Хороший рабочий микс: идея понятная, тело "${result.bodyName}" держит композицию.`;
      else if (score >= 72) result.overallVerdict = `Условно хороший микс: логика есть, но нужна точная процентовка и контроль сильных нот.`;
      else if (score >= 56) result.overallVerdict = `Спорный микс: часть логики работает, но есть заметные слабые места в теле или ролях.`;
      else result.overallVerdict = `Слабый микс: композиция может развалиться, лучше изменить тело или упростить состав.`;

      result.scoringEngineVersion = this.version;
      return result;
    },

    install(app) {
      if (!app || app._scoringEngineV33Installed) return false;
      app._scoringEngineV33Installed = true;
      app.scoringEngineVersion = this.version;

      if (typeof app.scorePair === 'function' && !app._legacyScorePairBeforeV33) {
        app._legacyScorePairBeforeV33 = app.scorePair.bind(app);
      }
      if (typeof app.calibrateMixScoreV27 === 'function' && !app._legacyCalibrateMixScoreBeforeV33) {
        app._legacyCalibrateMixScoreBeforeV33 = app.calibrateMixScoreV27.bind(app);
      }
      if (typeof app.compatibilityLabelV27 === 'function' && !app._legacyCompatibilityLabelBeforeV33) {
        app._legacyCompatibilityLabelBeforeV33 = app.compatibilityLabelV27.bind(app);
      }

      app.scorePair = (a, b) => this.scorePair(app, a, b);
      app.compatibilityLabelV27 = (score) => this.compatibilityLabel(score);
      app.calibrateMixScoreV27 = (result, meta) => this.calibrateMixScore(app, result, meta || {});

      // Public API for testing.
      app.scoreMixWithEngine = (result, meta) => this.calibrateMixScore(app, result, meta || {});
      app.scorePairWithEngine = (a, b) => this.scorePair(app, a, b);

      console.info('ScoringEngine installed:', this.version);
      return true;
    },

    waitAndInstall(attempt = 0) {
      const app = window.app;
      if (app) {
        this.install(app);
        return;
      }
      if (attempt < 80) {
        window.setTimeout(() => this.waitAndInstall(attempt + 1), 50);
      } else {
        console.warn('ScoringEngine: app was not found, install skipped');
      }
    }
  };

  window.ScoringEngine = ScoringEngine;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ScoringEngine.waitAndInstall());
  } else {
    ScoringEngine.waitAndInstall();
  }
})();
