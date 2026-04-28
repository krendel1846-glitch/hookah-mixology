V22 — исправление баннера и количества результатов

Что заменить на GitHub:
1) index.html
2) app.js
3) sw.js
4) assets/banner-v22.png

Что исправлено:
- Баннер теперь подключается как assets/banner-v22.png.
- Версии подняты до v22: app.js?v=22, sw.js?v=22, manifest.webmanifest?v=22.
- Service Worker обновлен до hookah-mixology-v22-banner-resultcount.
- Количество результатов теперь строго уважает выбор в параметрах: если выбрано 1, показывается 1 результат.
- Кнопка «Построить альтернативы» тоже показывает ровно выбранное количество результатов.

После загрузки:
- Commit changes.
- DevTools → Application → Service Workers → Unregister.
- DevTools → Application → Storage → Clear site data.
- Ctrl+Shift+R.
- На iPhone лучше удалить иконку с экрана и добавить сайт заново.
