Hookah Mixology / Flavor Generator — V33 Scoring Engine Split + Local Stats

Что сделано:
1. Оценка миксов вынесена в отдельный файл:
   - js/scoring-engine.js

2. index.html теперь подключает:
   - app.js?v=33
   - js/scoring-engine.js?v=33
   - js/mixology-engine.js?v=33
   - photo-search.js?v=33
   - js/app-stats.js?v=33

3. ScoringEngine отвечает за:
   - scorePair()
   - compatibilityLabel()
   - calibrateMixScore()
   - финальный compatibilityScore
   - итоговый verdict
   - дополнительные scoring-risks

4. app.js оставлен стабильным:
   - старая scoring-логика не удалена для аварийного отката;
   - активная оценка теперь идёт через ScoringEngine;
   - старые функции сохранены:
     app._legacyScorePairBeforeV33
     app._legacyCalibrateMixScoreBeforeV33

5. Добавлен незаметный счетчик внизу главного экрана:
   - открытий
   - генераций

Важно:
На GitHub Pages без сервера это локальный счетчик на устройстве/браузере.
То есть он показывает статистику текущего пользователя, а не глобальную статистику всех посетителей.
Для настоящего глобального счетчика позже нужен внешний storage: Supabase / Firebase / Google Analytics / простой backend.

Что заменить на GitHub:
- index.html
- app.js
- sw.js
- photo-search.js можно оставить или заменить из архива
- добавить/заменить папку js:
  - js/mixology-engine.js
  - js/scoring-engine.js
  - js/app-stats.js

После загрузки:
1. Commit changes.
2. DevTools → Application → Service Workers → Unregister.
3. Application → Storage → Clear site data.
4. Ctrl + Shift + R.
На iPhone — удалить иконку сайта с экрана Домой и добавить заново.

Проверка в Console:
window.ScoringEngine?.version
ожидаемо:
v33-scoring-engine-split

app?.scoringEngineVersion
ожидаемо:
v33-scoring-engine-split

window.AppStats?.read()
покажет локальные открытия и генерации.
