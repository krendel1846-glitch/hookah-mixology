V24 — исправление визуала забивки и оценки

Что исправлено:
1. Секторная забивка теперь рисуется через inline SVG и не зависит от CSS.
2. Слоистая забивка также рисуется inline с названиями вкусов и процентами.
3. Исправлен баг, где оценка могла стать 0% из-за истории генераций.
4. История теперь влияет на выбор/ротацию вариантов через внутренний rankingScore, но пользователю показывается реальная оценка качества.
5. Версии подняты до v24: index.html, app.js, sw.js, manifest, banner.

Что заменить на GitHub:
- index.html
- app.js
- sw.js
- assets/banner-v24.png

После загрузки:
1. Commit changes.
2. DevTools > Application > Service Workers > Unregister.
3. Application > Storage > Clear site data.
4. Ctrl+Shift+R.
На iPhone удалить иконку с экрана Домой и добавить сайт заново.
