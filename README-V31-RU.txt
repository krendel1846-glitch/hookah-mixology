Hookah Mixology / Flavor Generator — V31 Photo Search Split

Что сделано:
1. Фото-поиск вынесен в отдельный файл:
   - photo-search.js

2. index.html теперь подключает:
   - app.js?v=31
   - photo-search.js?v=31
   - sw.js?v=31

3. app.js больше не нужно трогать для исправлений OCR:
   вся активная логика фото-поиска находится в photo-search.js.

4. В photo-search.js реализовано:
   - быстрый OCR по центру этикетки;
   - fallback OCR только при необходимости;
   - жёсткая логика Overdose + Strawberry;
   - если найден Strawberry, нерелевантные вкусы без Strawberry отсекаются;
   - короткий бренд Burn не блокирует выдачу;
   - кнопка “Это он — добавить в выбор вкусов” работает через addPhotoMatchToGenerator.

5. Исправлен светлый блок загрузки/preview на iPhone:
   dark UI hardfix добавлен в index.html.

Что заменить на GitHub:
- index.html
- app.js
- sw.js
- добавить новый файл photo-search.js

После загрузки:
1. Commit changes.
2. DevTools → Application → Service Workers → Unregister.
3. Application → Storage → Clear site data.
4. Ctrl + Shift + R.
На iPhone — удалить иконку с экрана Домой и добавить сайт заново.

Контрольный тест:
Фото Overdose Strawberry должно выводить Overdose Strawberry первым.
