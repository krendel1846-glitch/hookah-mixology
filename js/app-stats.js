/* Hookah Mixology Engine Pro — v33 app-stats.js
   Small local statistics counter.
   Important: on static GitHub Pages this is LOCAL per browser/device, not global for all users.
*/
(function () {
  'use strict';

  const Stats = {
    version: 'v33-local-stats',
    storageKey: 'hookah_mixology_local_stats_v33',

    read() {
      try {
        return Object.assign({ opens: 0, generations: 0, firstOpenAt: '', lastOpenAt: '' }, JSON.parse(localStorage.getItem(this.storageKey) || '{}'));
      } catch (e) {
        return { opens: 0, generations: 0, firstOpenAt: '', lastOpenAt: '' };
      }
    },

    write(data) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (e) {
        console.warn('Stats write failed:', e);
      }
    },

    incrementOpen() {
      const data = this.read();
      const now = new Date().toISOString();
      data.opens = Number(data.opens || 0) + 1;
      data.firstOpenAt = data.firstOpenAt || now;
      data.lastOpenAt = now;
      this.write(data);
      this.render();
    },

    incrementGeneration() {
      const data = this.read();
      data.generations = Number(data.generations || 0) + 1;
      data.lastGenerationAt = new Date().toISOString();
      this.write(data);
      this.render();
    },

    formatNumber(n) {
      try {
        return new Intl.NumberFormat('ru-RU').format(Number(n || 0));
      } catch (e) {
        return String(Number(n || 0));
      }
    },

    ensureNode() {
      let node = document.getElementById('app-stats-counter');
      if (node) return node;

      node = document.createElement('div');
      node.id = 'app-stats-counter';
      node.className = 'app-stats-counter';
      node.setAttribute('aria-label', 'Локальная статистика приложения');

      const shell = document.querySelector('.app-shell') || document.querySelector('.container') || document.body;
      shell.appendChild(node);
      return node;
    },

    render() {
      const data = this.read();
      const node = this.ensureNode();
      node.innerHTML = `
        <span>локально</span>
        <span class="dot">•</span>
        <span>открытий: <strong>${this.formatNumber(data.opens)}</strong></span>
        <span class="dot">•</span>
        <span>генераций: <strong>${this.formatNumber(data.generations)}</strong></span>
      `;
    },

    wrapGenerationHandlers() {
      const app = window.app;
      if (!app || app._statsV33Wrapped) return false;

      app._statsV33Wrapped = true;

      const wrap = (name) => {
        if (typeof app[name] !== 'function') return;
        const original = app[name].bind(app);
        app[name] = (...args) => {
          this.incrementGeneration();
          return original(...args);
        };
      };

      wrap('generate');
      wrap('generateAlternatives');

      return true;
    },

    waitAndInstall(attempt = 0) {
      this.render();
      const wrapped = this.wrapGenerationHandlers();
      if (!wrapped && attempt < 100) {
        window.setTimeout(() => this.waitAndInstall(attempt + 1), 60);
      }
    },

    install() {
      this.incrementOpen();
      this.waitAndInstall();
      window.AppStats = this;
      console.info('AppStats installed:', this.version);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Stats.install());
  } else {
    Stats.install();
  }
})();
