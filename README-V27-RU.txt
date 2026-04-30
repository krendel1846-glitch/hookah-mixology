Hookah Mixology / Flavor Generator — V27 Logic Calibration

Что изменено:
1. Исправлена классификация:
   - леденцы / candy / drops / sorbet больше не считаются охлаждением;
   - ice / mint / cold / arctic / supernova остаются охлаждением.
2. Улучшен выбор тела микса:
   - слабые/акцентные вкусы реже становятся body;
   - dessert/fresh/citrus/berry стили лучше учитывают тип тела.
3. Оценка стала строже и разнообразнее:
   - меньше одинаковых 78%;
   - спорное тело сильнее штрафуется;
   - сильный холод ограничивает потолок оценки.
4. Холод сохранился как часть 100% состава.
5. В визуале слоями длинные названия сокращаются внутри чаши, полное название остается в составе и легенде.

Что заменить на GitHub:
- index.html
- app.js
- sw.js

После загрузки:
1. Commit changes.
2. DevTools → Application → Service Workers → Unregister.
3. Application → Storage → Clear site data.
4. Ctrl + Shift + R.
На iPhone — удалить иконку с экрана Домой и добавить заново.
