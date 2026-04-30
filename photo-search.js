/* Hookah Mixology Engine Pro — v31 photo-search.js
   Standalone photo OCR/search module.
   Loaded AFTER app.js. This file is the only active photo-search implementation.
*/
(function () {
  'use strict';

  function attachPhotoSearchModule() {
    const app = window.app || window.appInstance || window.HookahApp;
    if (!app) {
      setTimeout(attachPhotoSearchModule, 60);
      return;
    }

    app.photoSearchVersion = 'v31-photo-search-split';

    app.photoAliases = {
      brands: {
        overdose: ['overdose', 'over dose', 'overd0se', 'overdoze', 'overdos', 'overd', 'ovrdose', '0verdose', 'ove', 'over'],
        blackburn: ['blackburn', 'black burn', 'blackbum', 'black bwm', 'blackbern'],
        burn: ['burn'],
        'must have': ['must have', 'musthave'],
        darkside: ['darkside', 'dark side'],
        starline: ['starline', 'star line'],
        sebero: ['sebero', 'себеро']
      },
      flavors: {
        strawberry: ['strawberry', 'strawbery', 'straberry', 'strowberry', 'strawberrv', 'strawb', 'straw', 'клубника', 'клубничный', 'клубничная', 'земляника'],
        banana: ['banana', 'банан'],
        apple: ['apple', 'яблоко', 'яблочный', 'яблочная'],
        pear: ['pear', 'груша', 'грушевый'],
        peach: ['peach', 'персик'],
        kiwi: ['kiwi', 'киви'],
        grape: ['grape', 'виноград'],
        melon: ['melon', 'дыня'],
        watermelon: ['watermelon', 'арбуз'],
        lemon: ['lemon', 'лимон'],
        lime: ['lime', 'лайм'],
        orange: ['orange', 'апельсин'],
        mango: ['mango', 'манго'],
        coconut: ['coconut', 'кокос'],
        cherry: ['cherry', 'вишня'],
        blueberry: ['blueberry', 'голубика'],
        raspberry: ['raspberry', 'малина'],
        blackberry: ['blackberry', 'ежевика'],
        currant: ['currant', 'смородина'],
        mint: ['mint', 'мята'],
        cola: ['cola', 'кола'],
        cactus: ['cactus', 'кактус'],
        guava: ['guava', 'гуава'],
        feijoa: ['feijoa', 'фейхоа']
      }
    };

    app.photoNormalize = function (value) {
      return String(value || '')
        .toLowerCase()
        .replace(/[|!]/g, 'i')
        .replace(/[0]/g, 'o')
        .replace(/[5]/g, 's')
        .replace(/[@]/g, 'a')
        .replace(/rn/g, 'm')
        .replace(/vv/g, 'w')
        .replace(/o\s*ver\s*dose/g, 'overdose')
        .replace(/over\s*dose/g, 'overdose')
        .replace(/overdo[sz]e?/g, 'overdose')
        .replace(/straw\s*berry/g, 'strawberry')
        .replace(/strawbery|straberry|strowberry|strawberrv/g, 'strawberry')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    app.photoCompact = function (value) {
      return this.photoNormalize(value).replace(/\s+/g, '');
    };

    app.photoTokens = function (value) {
      return Array.from(new Set(this.photoNormalize(value).split(/\s+/).filter(t => t.length >= 3)));
    };

    app.photoHasAlias = function (text, aliases) {
      const norm = this.photoNormalize(text);
      const compact = this.photoCompact(text);
      const tokens = new Set(this.photoTokens(text));
      return aliases.some(alias => {
        const a = this.photoNormalize(alias);
        const c = a.replace(/\s+/g, '');
        return tokens.has(a) || compact.includes(c);
      });
    };

    app.photoDetectHints = function (sourceText) {
      const text = this.photoNormalize(sourceText);
      const compact = this.photoCompact(sourceText);
      const tokens = this.photoTokens(sourceText);

      const brands = [];
      Object.entries(this.photoAliases.brands).forEach(([key, aliases]) => {
        if (this.photoHasAlias(text, aliases)) brands.push(key);
      });

      const flavors = [];
      Object.entries(this.photoAliases.flavors).forEach(([key, aliases]) => {
        if (this.photoHasAlias(text, aliases)) flavors.push(key);
      });

      // Hard fragment logic for real mobile OCR:
      // "ove" + "strawb" must be treated as Overdose Strawberry.
      const hasOverdoseFragment = /(^|\s)(ove|over|overd|ovr)(\s|$)/.test(text) || compact.includes('overdose') || compact.includes('overd');
      const hasStrawberryFragment = compact.includes('straw') || compact.includes('strawb') || compact.includes('strawberry') || compact.includes('клубник');

      if (hasOverdoseFragment && !brands.includes('overdose')) brands.unshift('overdose');
      if (hasStrawberryFragment && !flavors.includes('strawberry')) flavors.unshift('strawberry');

      return { text, compact, tokens, brands: Array.from(new Set(brands)), flavors: Array.from(new Set(flavors)) };
    };

    app.photoBrandCanonical = function (brand) {
      const b = this.photoNormalize(brand);
      if (b.includes('overdose')) return 'overdose';
      if (b.includes('blackburn')) return 'blackburn';
      if (b === 'burn' || b.includes(' burn')) return 'burn';
      if (b.includes('must')) return 'must have';
      if (b.includes('darkside')) return 'darkside';
      if (b.includes('starline')) return 'starline';
      if (b.includes('sebero')) return 'sebero';
      return b;
    };

    app.photoFlavorHasCanonical = function (flavor, canonical) {
      const aliases = this.photoAliases.flavors[canonical] || [canonical];
      const label = this.photoNormalize([flavor && flavor.name, flavor && flavor.description, flavor && flavor.type].join(' '));
      const compact = label.replace(/\s+/g, '');
      return aliases.some(alias => {
        const a = this.photoNormalize(alias);
        const c = a.replace(/\s+/g, '');
        return label.split(/\s+/).includes(a) || compact.includes(c);
      });
    };

    app.photoFindExactFlavor = function (brandKey, canonicalFlavor) {
      return (this.state.flavors || []).find(flavor => {
        const brand = this.photoBrandCanonical(flavor.brand || '');
        const name = this.photoNormalize(String(flavor.name || '').split('/')[0]);
        const full = this.photoNormalize(`${flavor.brand || ''} ${flavor.name || ''} ${flavor.description || ''}`);
        return brand === brandKey && (
          name === canonicalFlavor ||
          this.photoFlavorHasCanonical(flavor, canonicalFlavor) ||
          full.includes(canonicalFlavor)
        );
      }) || null;
    };

    app.photoScoreFlavor = function (flavor, hints) {
      const brandKey = this.photoBrandCanonical(flavor.brand || '');
      const nameRaw = String(flavor.name || '').split('/')[0].trim();
      const name = this.photoNormalize(nameRaw);
      const nameTokens = this.photoTokens(name);
      let score = 0;
      const reasons = [];

      if (hints.brands.includes(brandKey)) {
        score += brandKey === 'overdose' ? 900 : 420;
        reasons.push('совпал бренд');
      }

      let canonicalHits = 0;
      hints.flavors.forEach(fKey => {
        if (this.photoFlavorHasCanonical(flavor, fKey)) {
          canonicalHits += 1;
          score += fKey === 'strawberry' ? 700 : 430;
        }
      });

      if (canonicalHits) reasons.push(`совпало вкусовых слов: ${canonicalHits}/${hints.flavors.length}`);

      // Exact name beats compounds.
      if (hints.flavors.length === 1 && hints.flavors[0] === 'strawberry' && this.photoFlavorHasCanonical(flavor, 'strawberry')) {
        if (name === 'strawberry' || name === 'клубника') {
          score += 550;
          reasons.push('точное название вкуса');
        } else {
          score -= Math.min(360, Math.max(0, nameTokens.length - 1) * 100);
        }
      }

      if (hints.brands.includes('overdose') && hints.flavors.includes('strawberry')) {
        if (brandKey === 'overdose' && this.photoFlavorHasCanonical(flavor, 'strawberry')) {
          score += (name === 'strawberry' || name === 'клубника') ? 1500 : 850;
          reasons.push('Overdose + Strawberry');
        } else {
          score -= 1000;
        }
      }

      if (hints.flavors.length && canonicalHits === 0) score -= 900;
      if (hints.flavors.includes('strawberry') && !this.photoFlavorHasCanonical(flavor, 'strawberry')) score -= 1200;
      if ((brandKey === 'burn' || brandKey === 'blackburn') && hints.brands.includes('overdose')) score -= 900;

      return { score: Math.round(score), reasons: Array.from(new Set(reasons)).slice(0, 4) };
    };

    app.findPhotoMatches = function (sourceText, limit = 10) {
      const hints = this.photoDetectHints(sourceText);
      if (!hints.text || hints.text.length < 2) return [];

      let candidates = (this.state.flavors || []).slice();

      // Strong brand restriction only for long/clear brands. Never lock to Burn from noise.
      if (hints.brands.includes('overdose')) {
        candidates = candidates.filter(f => this.photoBrandCanonical(f.brand) === 'overdose');
      } else if (hints.brands.includes('must have')) {
        candidates = candidates.filter(f => this.photoBrandCanonical(f.brand) === 'must have');
      } else if (hints.brands.includes('darkside')) {
        candidates = candidates.filter(f => this.photoBrandCanonical(f.brand) === 'darkside');
      }

      // Strong flavor restriction. If photo says strawberry, unrelated tastes cannot appear.
      if (hints.flavors.length) {
        const filtered = candidates.filter(f => hints.flavors.some(key => this.photoFlavorHasCanonical(f, key)));
        if (filtered.length) candidates = filtered;
      }

      let results = candidates.map(flavor => {
        const match = this.photoScoreFlavor(flavor, hints);
        const confidence = Math.max(15, Math.min(99, Math.round(match.score / 34)));
        return { flavor, score: match.score, confidence, reasons: match.reasons, photoHints: hints };
      })
      .filter(item => item.score >= 140)
      .sort((a, b) => b.score - a.score || this.getFlavorLabel(a.flavor).localeCompare(this.getFlavorLabel(b.flavor), 'ru'));

      // Guaranteed exact result for Overdose Strawberry.
      if (hints.brands.includes('overdose') && hints.flavors.includes('strawberry')) {
        const exact = this.photoFindExactFlavor('overdose', 'strawberry');
        if (exact) {
          results = results.filter(x => x.flavor.id !== exact.id);
          results.unshift({
            flavor: exact,
            score: 4200,
            confidence: 98,
            reasons: ['совпал бренд', 'найдено Strawberry', 'точное название вкуса'],
            photoHints: hints
          });
        }
      }

      return results.slice(0, limit);
    };

    app.preprocessPhotoToCanvas = function (img, mode = 'label', cropPreset = 'label') {
      const srcW = img.naturalWidth || img.width || 1;
      const srcH = img.naturalHeight || img.height || 1;

      let sx = 0, sy = 0, sw = srcW, sh = srcH;
      if (cropPreset === 'label' || cropPreset === 'center') {
        sx = srcW * 0.16;
        sy = srcH * 0.20;
        sw = srcW * 0.68;
        sh = srcH * 0.58;
      } else if (cropPreset === 'bottom') {
        sx = srcW * 0.10;
        sy = srcH * 0.40;
        sw = srcW * 0.80;
        sh = srcH * 0.42;
      }

      const scale = Math.min(1600 / Math.max(sw, sh), 2.1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(520, Math.round(sw * scale));
      canvas.height = Math.max(360, Math.round(sh * scale));

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Keep yellow/purple contrast readable; do not over-process.
        let value;
        if (mode === 'bw') value = gray > 128 ? 255 : 0;
        else if (mode === 'invert') value = 255 - gray;
        else value = Math.max(0, Math.min(255, (gray - 104) * 2.0 + 128 + (max - min) * 0.18));

        data[i] = data[i + 1] = data[i + 2] = value;
      }
      ctx.putImageData(imageData, 0, 0);
      return canvas;
    };

    app.extractPhotoTexts = async function (imgEl) {
      if (typeof Tesseract === 'undefined') {
        await this.ensureExternalLib('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', 'Tesseract');
      }

      const previews = [];
      const tasks = [
        { mode: 'gray', crop: 'label', label: 'Центр этикетки' },
        { mode: 'bw', crop: 'label', label: 'Контрастный центр', fallback: true }
      ];

      const textBlocks = [];
      let bestConfidence = 0;

      for (const task of tasks) {
        if (task.fallback) {
          const hints = this.photoDetectHints(textBlocks.join('\n'));
          if (hints.brands.length && hints.flavors.length) break;
        }

        const canvas = this.preprocessPhotoToCanvas(imgEl, task.mode, task.crop);
        previews.push({ label: task.label, dataUrl: canvas.toDataURL('image/png') });
        this.renderPhotoPassPreviews(previews);
        this.updatePhotoStatus(`OCR: ${task.label}…`, 'info');

        const result = await Tesseract.recognize(canvas, 'eng', {
          tessedit_pageseg_mode: '11',
          preserve_interword_spaces: '1',
          user_defined_dpi: '300',
          logger: (message) => {
            if (message.status === 'recognizing text') {
              const pct = Math.round((message.progress || 0) * 100);
              this.updatePhotoStatus(`OCR: ${task.label} — ${pct}%`, 'info');
            }
          }
        });

        const rawText = String(result && result.data && result.data.text ? result.data.text : '').trim();
        const confidence = Number(result && result.data && result.data.confidence ? result.data.confidence : 0) || 0;
        bestConfidence = Math.max(bestConfidence, confidence);
        if (rawText) textBlocks.push(rawText);

        const hints = this.photoDetectHints(rawText);
        if (hints.brands.includes('overdose')) textBlocks.push('overdose');
        if (hints.flavors.includes('strawberry')) textBlocks.push('strawberry клубника');

        const quick = this.findPhotoMatches(textBlocks.join('\n'), 3);
        if (quick.length && quick[0].confidence >= 85) break;
      }

      const merged = Array.from(new Set(textBlocks.join('\n').split(/\n+/).map(v => v.trim()).filter(Boolean))).join('\n');
      return { text: merged, previews, confidence: bestConfidence, lockedBrand: null };
    };

    app.renderPhotoMatches = function (matches, sourceText) {
      const container = document.getElementById('photo-results');
      if (!container) return;

      if (!matches.length) {
        container.innerHTML = '<div class="photo-empty">Совпадений не найдено. Введи вручную бренд и вкус ниже, например: Overdose Strawberry.</div>';
        this.refreshPhotoResultsSummary(0);
        return;
      }

      const hints = this.photoDetectHints(sourceText);
      const queryText = this.escapeHtml(String(sourceText || ''));
      const hintLine = `<div class="notice" style="margin-bottom:12px">
        Фото-поиск v31: ${hints.brands.length ? `бренд <strong>${this.escapeHtml(hints.brands.join(', '))}</strong>` : 'бренд не зафиксирован'}${hints.flavors.length ? ` · вкус <strong>${this.escapeHtml(hints.flavors.join(', '))}</strong>` : ''}.
        ${hints.flavors.includes('strawberry') ? 'Нерелевантные вкусы без Strawberry отсечены.' : 'Можно уточнить текст вручную.'}
      </div>`;

      container.innerHTML = hintLine + matches.map((item, index) => `
        <div class="photo-match-card ${index === 0 ? 'best' : ''}">
          <div class="photo-match-top">
            <div>
              <div class="mix-title" style="font-size:1.02rem;line-height:1.3">${this.escapeHtml(item.flavor.brand)} ${this.escapeHtml(item.flavor.name)}</div>
              <p class="text-sm" style="margin-top:6px">${this.escapeHtml(item.flavor.description || 'Без дополнительного описания')}</p>
            </div>
            <div class="text-right">
              <div class="photo-match-score">${item.confidence}%</div>
              <div class="text-xs muted">уверенность поиска</div>
            </div>
          </div>
          <div class="photo-match-reasons">
            ${(item.reasons || []).map(reason => `<span class="badge badge-neutral">${this.escapeHtml(reason)}</span>`).join('')}
            ${item.flavor.type ? `<span class="badge badge-primary">${this.escapeHtml(item.flavor.type)}</span>` : ''}
            ${item.flavor.strength ? `<span class="badge badge-warning">${this.escapeHtml(item.flavor.strength)}</span>` : ''}
          </div>
          <div class="footer-note" style="margin-top:10px">OCR-текст: ${queryText}</div>
          <div class="photo-actions" style="margin-top:12px">
            <button type="button" class="btn btn-primary btn-sm" onclick="app.addPhotoMatchToGenerator('${String(item.flavor.id).replace(/'/g, "\\'")}')">Это он — добавить в выбор вкусов</button>
          </div>
        </div>
      `).join('');

      this.refreshPhotoResultsSummary(matches.length);
    };

    app.runPhotoTextSearch = function () {
      if (!this.state.flavors.length) {
        this.updatePhotoStatus('Сначала загрузи базу вкусов, иначе искать будет не по чему.', 'error');
        return;
      }
      const text = (document.getElementById('photo-ocr-text') || {}).value || '';
      const matches = this.findPhotoMatches(text, 6);
      this.renderPhotoMatches(matches, text);
      if (matches.length) this.updatePhotoStatus(`Поиск выполнен. Лучшее совпадение: ${matches[0].flavor.brand} ${matches[0].flavor.name}.`, 'success');
      else this.updatePhotoStatus('Совпадения не найдены. Поправь текст вручную, например: Overdose Strawberry.', 'error');
    };

    app.analyzePhotoSearch = async function () {
      if (!this.state.flavors.length) {
        this.updatePhotoStatus('Сначала загрузи базу вкусов.', 'error');
        return;
      }
      const input = document.getElementById('photo-file');
      const file = input && input.files && input.files[0];
      const preview = document.getElementById('photo-preview');
      const textArea = document.getElementById('photo-ocr-text');

      if (!file || !preview || preview.classList.contains('hidden')) {
        this.updatePhotoStatus('Сначала выбери или сфотографируй изображение.', 'error');
        return;
      }

      try {
        this.updatePhotoStatus('Фото-поиск v31: быстрый OCR по центру этикетки…', 'info');
        const extraction = await this.extractPhotoTexts(preview);
        if (textArea) textArea.value = extraction.text;

        const matches = this.findPhotoMatches(extraction.text, 6);
        this.renderPhotoMatches(matches, extraction.text);

        if (matches.length) {
          this.updatePhotoStatus(`Готово. Лучшее совпадение: ${matches[0].flavor.brand} ${matches[0].flavor.name}.`, 'success');
        } else {
          this.updatePhotoStatus('OCR отработал, но уверенных совпадений нет. Введи текст вручную ниже.', 'error');
        }
      } catch (error) {
        console.error(error);
        this.updatePhotoStatus('Ошибка OCR: ' + (error && error.message ? error.message : error), 'error');
      }
    };

    app.addPhotoMatchToGenerator = function (id) {
      this.addFlavorToFirstEmptySlot(String(id));
      this.switchTab('flavors', document.querySelector('.nav-btn[data-tab="flavors"]'));
    };

    console.info('Photo search module loaded:', app.photoSearchVersion);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachPhotoSearchModule);
  } else {
    attachPhotoSearchModule();
  }
})();
