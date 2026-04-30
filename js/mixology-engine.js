/* Hookah Mixology Engine Pro — v32 mixology-engine.js
   Safe first split: generation entrypoints are moved out of app.js.
   The large legacy helper methods still live on app for compatibility, but all generation calls go through MixologyEngine.
*/
(function () {
  'use strict';

  const MixologyEngine = {
    version: 'v32-mixology-engine-split',

    readSelectValue(id, fallback = '') {
      const el = document.getElementById(id);
      return el ? el.value : fallback;
    },

    readIntValue(id, fallback, min = null, max = null) {
      const el = document.getElementById(id);
      const raw = el ? parseInt(el.value, 10) : NaN;
      let value = Number.isFinite(raw) ? raw : fallback;
      if (min !== null) value = Math.max(min, value);
      if (max !== null) value = Math.min(max, value);
      return value;
    },

    getParamsFromUI(app) {
      const selected = typeof app.collectSelectedFlavors === 'function'
        ? app.collectSelectedFlavors()
        : [];

      const requestedCount = this.readIntValue('gen-count', 3, 2, 5);
      const resultCount = this.readIntValue('result-count', 1, 1, 10);

      return {
        mode: this.readSelectValue('gen-mode', 'manual'),
        requestedCount,
        targetCount: selected.length ? Math.max(2, Math.min(requestedCount, selected.length)) : requestedCount,
        style: this.readSelectValue('gen-style', 'universal'),
        coolingLevel: this.readSelectValue('cooling-level', 'none'),
        resultCount,
        fixedComposition: this.readSelectValue('fixed-composition', 'yes') === 'yes',
        selected
      };
    },

    validateParams(app, params, alternatives = false) {
      if (!app || !app.state || !Array.isArray(app.state.flavors) || !app.state.flavors.length) {
        return 'Сначала загрузи базу вкусов.';
      }
      if ((params.mode === 'manual' || alternatives) && (!params.selected || params.selected.length < 2)) {
        return 'Для ручной генерации выбери минимум 2 вкуса.';
      }
      return '';
    },

    generate(app, params) {
      if (!app) throw new Error('MixologyEngine: app context is missing');
      const p = Object.assign({}, params || {});
      let results = [];

      if (p.mode === 'manual' && p.selected && p.selected.length >= 2) {
        if (typeof app.buildManualResults !== 'function') {
          throw new Error('buildManualResults не найден в app.js');
        }
        const targetCount = Math.max(2, Math.min(p.targetCount || p.requestedCount || p.selected.length, p.selected.length));
        results = app.buildManualResults(
          p.selected,
          p.style,
          p.coolingLevel,
          !!p.fixedComposition,
          false,
          targetCount,
          p.resultCount
        );
      } else {
        if (typeof app.buildAutomaticResults !== 'function') {
          throw new Error('buildAutomaticResults не найден в app.js');
        }
        results = app.buildAutomaticResults(
          p.requestedCount,
          p.style,
          p.coolingLevel,
          p.resultCount
        );
      }

      return Array.isArray(results) ? results.slice(0, p.resultCount) : [];
    },

    generateAlternatives(app, params) {
      if (!app) throw new Error('MixologyEngine: app context is missing');
      const p = Object.assign({}, params || {});
      if (!p.selected || p.selected.length < 2) return [];

      if (typeof app.buildManualResults !== 'function') {
        throw new Error('buildManualResults не найден в app.js');
      }

      const targetCount = Math.max(2, Math.min(p.targetCount || p.requestedCount || p.selected.length, p.selected.length));
      const limit = Math.max(p.resultCount || 3, 6);

      return app.buildManualResults(
        p.selected,
        p.style,
        p.coolingLevel,
        !!p.fixedComposition,
        true,
        targetCount,
        limit
      );
    },

    render(app, results, params) {
      if (!app || typeof app.renderResults !== 'function') {
        throw new Error('renderResults не найден в app.js');
      }
      app.renderResults(results, {
        mode: params.mode,
        style: params.style,
        coolingLevel: params.coolingLevel
      });
      if (typeof app.switchTab === 'function') {
        app.switchTab('results', document.querySelector('.nav-btn[data-tab="results"]'));
      }
    },

    showError(app, message, type = 'notice') {
      const resultsArea = document.getElementById('results-area');
      if (!resultsArea) return;
      const safeMessage = app && typeof app.escapeHtml === 'function'
        ? app.escapeHtml(String(message || 'Ошибка'))
        : String(message || 'Ошибка').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
      if (type === 'danger') {
        resultsArea.innerHTML = `<div class="card" style="border-color:var(--danger);color:var(--danger)">${safeMessage}</div>`;
      } else {
        resultsArea.innerHTML = `<div class="card notice">${safeMessage}</div>`;
      }
    },

    runFromUI(app, options = {}) {
      const resultsArea = document.getElementById('results-area');
      const alternatives = !!options.alternatives;
      const params = this.getParamsFromUI(app);
      if (alternatives) params.mode = 'manual';

      const validation = this.validateParams(app, params, alternatives);
      if (validation) {
        if (alternatives && typeof alert === 'function') {
          alert(validation);
        } else {
          this.showError(app, validation);
          if (app && typeof app.switchTab === 'function') {
            app.switchTab('results', document.querySelector('.nav-btn[data-tab="results"]'));
          }
        }
        return [];
      }

      if (resultsArea) {
        resultsArea.innerHTML = '<div class="card text-center">⏳ MixologyEngine v32: анализирую роли, тело микса, проценты и совместимость…</div>';
      }

      window.setTimeout(() => {
        try {
          const results = alternatives
            ? this.generateAlternatives(app, params)
            : this.generate(app, params);

          if (!results.length) {
            this.showError(app, 'Не удалось собрать хорошие варианты. Попробуй другой стиль, меньше вкусов или загрузи больше базы.');
            return;
          }

          this.render(app, results, params);
        } catch (error) {
          console.error('MixologyEngine generation failed:', error);
          this.showError(app, 'Ошибка генерации: ' + (error && error.message ? error.message : String(error)), 'danger');
          if (app && typeof app.switchTab === 'function') {
            app.switchTab('results', document.querySelector('.nav-btn[data-tab="results"]'));
          }
        }
      }, 35);

      return [];
    },

    install(app) {
      if (!app || app._mixologyEngineV32Installed) return false;

      app._mixologyEngineV32Installed = true;
      app.mixologyEngineVersion = this.version;

      // Preserve legacy handlers for emergency rollback/debugging.
      if (typeof app.generate === 'function' && !app._legacyGenerateBeforeV32) {
        app._legacyGenerateBeforeV32 = app.generate.bind(app);
      }
      if (typeof app.generateAlternatives === 'function' && !app._legacyGenerateAlternativesBeforeV32) {
        app._legacyGenerateAlternativesBeforeV32 = app.generateAlternatives.bind(app);
      }

      app.generate = () => this.runFromUI(app, { alternatives: false });
      app.generateAlternatives = () => this.runFromUI(app, { alternatives: true });

      // Public programmatic API for future modules/tests.
      app.generateMixesWithEngine = (params) => this.generate(app, params);
      app.generateAlternativeMixesWithEngine = (params) => this.generateAlternatives(app, params);

      console.info('MixologyEngine installed:', this.version);
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
        console.warn('MixologyEngine: app was not found, install skipped');
      }
    }
  };

  window.MixologyEngine = MixologyEngine;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MixologyEngine.waitAndInstall());
  } else {
    MixologyEngine.waitAndInstall();
  }
})();
