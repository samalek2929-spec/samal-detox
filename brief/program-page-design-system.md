# Формат карточек программ — дизайн-система (story-panel)

Зафиксировано по факту двух уже сделанных страниц: `programs/cleanse-3.html` и `programs/tubazh.html`. Обе используют один и тот же движок и один и тот же язык карточек — просто с разным контентом и разными фоновыми фото. Этот документ описывает паттерн так, чтобы его можно было один в один перенести на `programs/fasting-7-7.html` и `programs/fasting-14-14.html`, которые сейчас всё ещё в старом, статичном, «скроллинговом» формате.

Источник токенов цвета/типографики — `tokens/approved-colors.css` и `brief/design-system-brief.md`. Этот файл только про **структуру и поведение страницы программы**, не про палитру заново.

---

## 1. Общая идея

Страница программы — не лонгрид, а **вертикальная «сторис»-лента полноэкранных карточек-экранов**. Один смысловой блок = один экран (`story-panel`). Экран занимает весь `main`, следующий скрыт справа/слева, листание — свайпом, колесом мыши, клавишами ← →, точками прогресса или кнопками-стрелками. Позиция запоминается в `localStorage`, чтобы вернувшийся пользователь не начинал сначала.

Внутри каждого экрана — один-два «кирпичика» (карточки: `blend-card`, `notice-card`, `split-col`, `flow-item`, `delivery-card`, `related-card`, `result-note`, `final-copy`…). У кирпичиков — органическая, чуть «булыжная» форма (неровный `border-radius` + лёгкий `rotate`), матовое стекло вместо плоской заливки, и они всегда светлые внутри — независимо от того, тёмный или светлый фон экрана за ними. За счёт этого текст в кирпичике всегда тёмный (`--ink`) и всегда читаем.

## 2. Каркас экрана (обязательная структура)

```html
<main id="main-content">
  <section class="program-hero opening-scene story-panel" data-story-panel="0" data-od-id="program-hero">
    <div class="shell">…<div class="chapter-nav" data-od-id="hero-navigation">…</div></div>
  </section>

  <section class="section overview-section story-panel" data-story-panel="1" data-od-id="overview-section">
    <div class="shell">…</div>
    <div class="chapter-nav" data-od-id="overview-navigation">…</div>
  </section>

  <!-- … остальные панели, каждая со своим data-story-panel, инкремент на 1 -->
</main>
```

CSS-контракт:

```css
#main-content{position:relative;height:calc(100svh - 76px);overflow:hidden;touch-action:pan-y}
.story-panel{position:absolute;inset:0;width:100%;height:100%;padding:56px 0 92px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;
  transform:translateX(100%);opacity:0;visibility:hidden;pointer-events:none;
  transition:transform .48s cubic-bezier(.23,1,.32,1),opacity .25s ease,visibility 0s linear .48s;will-change:transform}
.story-panel.is-before{transform:translateX(-100%);opacity:.72;visibility:visible}
.story-panel.is-after{transform:translateX(100%);opacity:0;visibility:visible}
.story-panel.is-active{transform:translateX(0);opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}
```

Правила:
- `.site-footer` в этом режиме скрыт (`display:none`) — экран сторис заменяет собой обычный скролл со страницей и футером.
- 76px в `calc(100svh - 76px)` — высота `.site-header`, не менять произвольно.
- Каждая панель — свой `data-story-panel="N"`, нумерация сквозная от 0 (hero) до последней (related-section).
- Первая панель — `opening-scene` (полноэкранное фото-открытие с заголовком программы и ценой).
- Последняя панель — всегда `related-section` («Другие форматы») со ссылками на две другие программы.
- Предпоследняя — `final-cta` (Telegram CTA), у неё `id="telegram"`.

## 3. Навигация — стрелки на переднем плане (chapter-nav)

Важный, недавно исправленный момент: стрелки должны быть **зафиксированы поверх контента и не двигаться при скролле панели вниз**.

> ⚠️ **Проверено построчно 2026-09-14: этот исправленный вариант есть ТОЛЬКО в `cleanse-3.html`.** `tubazh.html` до сих пор с ним расходится — в нём осталась старая версия `.chapter-nav{position:absolute;z-index:4}` (строка 54) и полупрозрачные кнопки (`background:color-mix(... 80% ...)`), то есть тот самый баг «стрелки перекрывают текст / уезжают при скролле», который мы чинили. Поэтому **эталон навигации — только cleanse-3, а `tubazh.html` сам подлежит той же миграции** (см. §8). Не бери tubazh как образец для стрелок.

```css
.chapter-nav{position:fixed;left:50%;bottom:22px;z-index:30;display:flex;align-items:center;justify-content:center;
  gap:24px;width:max-content;margin:0;padding:6px 10px;transform:translateX(-50%) translateZ(0);isolation:isolate}
.chapter-control{width:44px;height:44px;border-radius:50%;border:1px solid var(--primary);
  background:color-mix(in srgb,var(--background) 94%,transparent);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:var(--primary);font-size:25px;font-weight:700}
.chapter-control:hover{background:var(--primary);color:var(--background);transform:translateY(-2px)}
.chapter-control:disabled{opacity:.38;cursor:not-allowed}
```

Почему именно так:
- `position:fixed` — потому что каждая активная панель имеет `transform` (для анимации between-panel), и `fixed`-потомок трансформированного предка якорится к рамке панели, а не к вьюпорту целиком — то есть стрелки «прибиты» к экрану-панели, но не двигаются вместе со внутренним вертикальным скроллом контента.
- `z-index:30` + `translateZ(0)` — свой composite layer, стрелки гарантированно поверх карточек и фоновых фото.
- Фон кнопки — почти непрозрачный (94%) с блюром, а не полупрозрачный (было 80% — текст блендов просвечивал и мешал читать стрелку).
- Каждая панель, кроме первой и последней, содержит и `data-story-prev`, и `data-story-next`; hero — только `next` (prev задизейблен), related — `next` замыкает цикл на панель `0`.
- К `.chapter-nav` JS на лету добавляет `.chapter-progress` — ряд точек-табов с drag-перетаскиванием (см. §6).

Мобильная адаптация (≤700px): `bottom:14px`, кнопки уменьшаются до 42px, точки прогресса — до 7px.

## 4. Фон каждого экрана — фотография, не плоский цвет

Каждая смысловая секция (кроме hero и в некоторых случаях hero тоже) получает своё фоновое фото на всю панель:

```css
.overview-section{background:var(--background) url("../assets/backgrounds/…") center 54%/cover no-repeat}
.included-section{background:var(--mist) url("…") center 42%/cover no-repeat}
.contraindications-section{background:var(--ink) url("…") center 44%/cover no-repeat;color:var(--background)}
```

Правила:
- Фото всегда `cover no-repeat`, позиция (`center 54%`, `42% center` и т. п.) подбирается вручную под кадр, чтобы важная часть фото не резалась на мобильном — не оставлять дефолтный `center center`, если это обрезает смысловую часть снимка.
- Цвет-подложка перед `url(...)` — это `--background`/`--mist`/`--sand`/`--ink` соответствующего токена; он виден на долю секунды до загрузки фото и на случай если картинка не подгрузится.
- **Контраст текста вне карточек следует за тоном фото.** Секция «Противопоказания» в обеих текущих страницах стоит на тёмном ночном фото (`--ink` подложка) → `color:var(--background)` (светлый) для заголовка и `.section-intro`, но `.notice-card` внутри остаётся светлой карточкой с тёмным текстом (см. §5) — иначе список противопоказаний не читается.
- На ≤480px у части секций отдельно переопределяется `background-position`, если на маленьком экране в кадр перестаёт попадать нужная часть фото.

## 5. Карточки-«кирпичики» (pebble cards)

Общий визуальный язык всех интерактивных блоков (`split-col`, `blend-card`, `delivery-card`, `flow-item`, `notice-card`, `result-note`, `final-copy`, `related-card`):

```css
.split-col,.flow-item,.notice-card,.result-note,.final-copy,.related-card,.blend-card,.delivery-card{
  position:relative;isolation:isolate;
  background:color-mix(in srgb,var(--background) 48%,transparent);
  border:1px solid color-mix(in srgb,var(--background) 78%,transparent);
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--background) 78%,transparent),
             0 14px 28px color-mix(in srgb,var(--ink) 11%,transparent);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)
}
.split-col,.blend-card,.delivery-card{
  padding:24px 24px 26px;
  border-radius:38% 18px 28% 16px / 20px 32% 18px 30%;
  transform:rotate(-.8deg)
}
.split-col:nth-child(2),.blend-card:nth-child(2),.delivery-card:nth-child(2){
  border-radius:16px 34% 18px 38% / 30% 18px 34% 16px;
  transform:rotate(1deg)
}
```

Правила «булыжника»:
- Каждый повторяющийся тип карточки получает **свой чуть-неровный `border-radius`** (проценты вперемешку с px по 4 углам, с эллиптическим `/`-синтаксисом) и **свой небольшой поворот** (`rotate(-2deg…2deg)`), чётные/нечётные элементы разворачиваются в разные стороны — так ряд одинаковых карточек не выглядит как сетка из инженерных прямоугольников.
- При hover (только `@media(hover:hover)`) поворот снимается и карточка чуть поднимается: `transform:translateY(-2px) rotate(0deg)`.
- Внутри `.notice-card` (противопоказания) на тёмном фоне у каждого `<li>` тоже своя фоновая плашка светлого стекла — список читается как ряд маленьких кирпичиков, а не как текст поверх фото.
- `.chip` (симптомы на тюбаже) — тот же язык кирпичика, но в сетке `grid-template-columns:repeat(12,1fr)` с ручной раскладкой `span` по каждому чипу для «рваной» мозаичной плотности.
- На ≤480px `backdrop-filter` блюр уменьшается с 16px до 14px (производительность на слабых телефонах).

**Правило контраста (обязательное):** карточка всегда светлая (замес от `--background`), текст внутри неё всегда `--ink`/`--primary`. Не делать тёмную карточку на тёмной секции — контраст держится за счёт того, что кирпичик светлее фона под ним, а не за счёт смены цвета текста.

## 6. JS-контроллер (переносится почти без изменений)

Логика уже реализована в `<script>` внизу `cleanse-3.html` (более свежая и чистая версия, чем в `tubazh.html` — используй её как эталон):
- Читает все `[data-story-panel]`, восстанавливает индекс из `localStorage` (ключ вида `"<page-slug>-story-panel"` — **на каждой странице свой ключ**, иначе прогресс одной программы будет перетирать другую).
- `updateStory(nextIndex)` — навешивает классы `is-before/is-active/is-after`, `aria-hidden`, `inert`, сбрасывает `scrollTop` новой панели, обновляет точки прогресса, пишет индекс в `localStorage`.
- Динамически создаёт `.chapter-progress` (точки с drag через Pointer Events) и вставляет её в каждый `.chapter-nav` перед кнопкой next.
- Навигация: клик по стрелкам (`data-story-prev`/`data-story-next`), клавиши ←/→/↑/↓ (кроме фокуса в `INPUT/TEXTAREA/SELECT`), свайп (`touchstart/touchend`, порог 64px и угол), колесо мыши/трекпад (накопительный `wheelDelta`, порог 75, лок 480мс чтобы не перелистывало через экран).
- Клик по «В Telegram» в шапке (`nav-telegram`) сразу прыгает на панель `final-cta` через `updateStory(индекс_final_cta)`.
- Клик по Telegram-кнопке показывает `.telegram-status` тост («Ссылка на бот будет добавлена перед запуском») — это общий для всего сайта заглушечный механизм, не трогать до получения реальной ссылки на бота.

## 7. Что НЕ менять при переносе

- Токены цвета/шрифта (`tokens/approved-colors.css`) — уже утверждены, страницы программ ничего своего не придумывают.
- Формат цены (`price-main` + `price-alt` с тремя валютами ₸/₽/$) и `duration-chip`.
- Структура `related-section` — всегда две ссылки на **другие** программы (не на себя), с `related-duration`/`h3`/`related-price`, ссылка «Все программы ↗» на `../index.html#programs`.
- Дисклеймер-паттерн: если у программы нет подтверждённых цифр результата — честно писать «результат индивидуален», а не выдумывать процент/кг (уже так сделано в `fasting-7-7.html` и должно остаться).

---

## 8. Что упустил первичный анализ — расхождения между двумя референсами (перепроверено построчно 2026-09-14)

Первичный документ описывал `cleanse-3.html` и `tubazh.html` как один общий эталон «просто с разным контентом». На деле страницы **разошлись**, и часть паттерна в тексте выше — это состояние cleanse-3, а не tubazh. Ниже — сверка по факту, чтобы при переносе не скопировать в fasting-страницы устаревшие куски именно из tubazh.

1. **Навигация (стрелки) — tubazh отстал.** cleanse-3: `.chapter-nav{position:fixed;z-index:30;translateZ(0)}` + непрозрачные кнопки (94%). tubazh: `position:absolute;z-index:4` + полупрозрачные (80%). То есть исправление «стрелки на переднем плане», ради которого всё затевалось, в tubazh **не внесено**. Эталон навигации — cleanse-3. → задача T1 ниже.

2. **`body{overflow:hidden}` — обязательный, но не назван в §2.** В обеих готовых страницах `body` имеет `overflow:hidden` (иначе поверх карусели появляется второй, страничный скролл и высота ломается). В обеих fasting-страницах его **нет** (`body{margin:0;background:…}`). При переносе добавить `overflow:hidden` в `body` — без этого story-panel карусель поедет.

3. **Анимация панелей при `prefers-reduced-motion` — только в tubazh.** tubazh глушит переходы `.story-panel` под reduced-motion (строка 164). cleanse-3 в своём reduced-motion правиле `.story-panel` **пропустил** — то есть на cleanse-3 панели анимируются даже при выключенной анимации. Здесь эталон — tubazh: в fasting-страницы добавить `.story-panel{transition:none}` (и `.chapter-control,.chapter-dot{transition:none}`) внутрь `@media(prefers-reduced-motion:reduce)`.

4. **Разметка hero — эталон cleanse-3 (плоская), tubazh с дефектом.** cleanse-3: один тег `<section class="program-hero opening-scene story-panel" data-story-panel="0">`. tubazh: вложенность `<section story-panel>` → `<section program-hero>` → плюс пустой `<footer class="site-footer">` внутри hero (строки 215–229). Это мусор, не паттерн. Для fasting брать плоский вариант cleanse-3, **не** копировать вложенность tubazh.

5. **JS-инициализация индекса различается.** cleanse-3 нигде в HTML не ставит `is-active` — класс проставляет JS на старте, а `storyIndex` берётся только из `localStorage`. tubazh ставит `is-active` прямо в разметке hero и читает его (`if(is-active) storyIndex=index`), плюс тянет мёртвую ссылку `updateBackToTop`. Берём чистую версию cleanse-3 (§6) без `is-active` в разметке и без `updateBackToTop`.

6. **`:focus-visible` на стрелке.** tubazh имеет явное `.chapter-control:focus-visible{outline…}` (строка 58); cleanse-3 его убрал и опирается на глобальное `button:focus-visible` (строка 28) — фокус-кольцо есть, но лучше вернуть явное правило при переносе, чтобы не потерять его при будущих правках.

7. **Инвентарь секций у двух страниц РАЗНЫЙ — не «одинаковый набор».** cleanse-3 = 10 панелей (0–9): hero, overview, included, flow, **blend (состав сборов)**, **delivery (доставка)**, contraindications, result, final-cta, related. tubazh = 8 панелей (0–7): hero, **symptoms (уникальный chip-мозаичный экран)**, included, flow, contraindications, result, final-cta, related. `blend`/`delivery` есть только у cleanse-3; `symptoms` только у tubazh. Для fasting-страниц целевой инвентарь — **8 панелей без blend/delivery/symptoms**: `0` hero → `1` overview → `2` included → `3` flow → `4` contraindications → `5` result → `6` final-cta → `7` related. (Это в ТЗ ниже указано верно — но важно понимать, что это не «набор tubazh» и не «набор cleanse-3», а их пересечение.)

8. **Противопоказания у fasting длиннее И иначе устроены.** У cleanse-3 (4 пункта) и tubazh (2 пункта) `<li>` — простой текст. У обеих fasting-страниц — **9 пунктов, каждый с `<strong>`-зачином** (`<strong>Беременность</strong> — абсолютное противопоказание`). При переводе `<li>` на «булыжники» (§5) учесть, что внутри есть `<strong>` (в тёмной секции он должен стать `color:var(--primary)`, как сделано в cleanse-3 `.contraindications-section .notice-card strong`), и что 9 плашек на тёмном фоне — самый высокий экран: проверять на 375px в первую очередь.

9. **`result` у fasting принципиально разные между собой.** 7/7 — короткий `.result-note` без цифр (честный дисклеймер). 14/14 — уникальный `.result-list` (сетка 12 «таблеток», 2 колонки → 1 на мобильном) плюс финальный медицинский дисклеймер. `.result-list` есть **только в 14/14**, ни в одном из двух референсов его нет — при переносе на «булыжный» язык это единственный компонент без готового образца (см. §5 / ТЗ п.5).

10. **Мелочи, не блокеры, но для чистоты переноса:** hero-фон в обеих готовых — общий декоративный `../11.png` (не персональное фото программы); `.result-section` в cleanse-3 переопределяет фон через `!important` (локальный хак, не паттерн); тост `.telegram-status` имеет `z-index:10` — в cleanse-3 он ниже стрелок (30), в tubazh выше стрелок (4), после миграции tubazh это выровняется само.

**Вывод по эталонам:** для fasting-страниц брать за образец **cleanse-3** по навигации, JS и разметке hero, а у **tubazh** заимствовать только два правила, где он лучше: глушение `.story-panel`-анимации под reduced-motion (п.3) и явный `.chapter-control:focus-visible` (п.6). И отдельной задачей — подтянуть сам tubazh к cleanse-3 (T1).

---

# ТЗ — перенос формата на «Голодание 7/7» и «Голодание 14/14»

## T0. Приоритетная правка перед переносом — домигрировать `tubazh.html`

Прежде чем тиражировать «эталон» на fasting-страницы, привести `tubazh.html` к состоянию cleanse-3 по навигации (это та правка, которую пользователь и просил, но которая в tubazh не доехала):
- `.chapter-nav`: `position:absolute;z-index:4` → `position:fixed;z-index:30`, добавить `translateZ(0)` и `isolation:isolate`.
- `.chapter-control`: фон `color-mix(... 80% ...)` → `... 94% ...`, добавить `backdrop-filter:blur(10px)`.
- Длинным экранам (аналог `.blend-section>.shell{padding-bottom:160px}` из cleanse-3) — дать нижний отступ, чтобы контент прокручивался выше стрелок. У tubazh самый длинный экран — `symptoms` (мозаика из 6 чипов); проверить на 375px.
- Разметку hero можно оставить как есть (работает), но при желании упростить до плоского `story-panel`, убрав вложенный `<section>` и пустой `<footer>`.
Проверить: скролл длинного экрана не двигает стрелки; ключ `localStorage` остаётся `tubazh-story-panel`.

## Контекст

Из 4 программ 2 уже в новом формате (`cleanse-3.html`, `tubazh.html`), 2 — нет. `programs/fasting-7-7.html` и `programs/fasting-14-14.html` сейчас в **старом статичном формате**: обычный вертикальный скролл, плоские секции без фото-фонов, без story-panel карусели, без `chapter-nav`, карточки (`split-col`, `notice-card`, `result-list`) уже частично есть, но без «булыжной» геометрии и матового стекла в едином виде. Разница видна прямо в текущем коде страниц (сравни с §2–§6 выше).

Обе fasting-страницы структурно — почти близнецы: одинаковый набор секций (`overview → included → flow → contraindications → result → final-cta → related`), различается только контент (заголовок, лид, `flow-list`, список противопоказаний одинаковый текстуально, `result` — у 7/7 без цифр, у 14/14 тоже без цифр но с длинным списком из 12 пунктов).

## Открытый вопрос перед стартом — фоновые фото

У `cleanse-3`/`tubazh` под каждую секцию было своё уникальное фото (`tubazh-symptoms-morning`, `tubazh-included-lake`, `tubazh-flow-lotus`, `tubazh-contra-night-lake`, `tubazh-result-river`, `tubazh-water-mist`, `tubazh-deep-garden`). У fasting-страниц пока нет **ни одного** такого набора.

В `assets/backgrounds/` уже лежат 6 неиспользуемых сгенерированных фонов на тему воды: `quiet-water-programs-v1.png`, `quiet-water-trust-v1.png`, `quiet-water-light-v1.png`, `quiet-water-river-stones-v1.png`, `quiet-water-steppe-mist-v1.png`, `quiet-water-faq-v1.png` — они ни на одной живой странице сейчас не задействованы и по духу (вода, натуральные фактуры, светлый спокойный тон) подходят под бренд-войс. **Нужно твоё решение**: использовать этот набор как фоны для обеих fasting-страниц (общие или частично общие между 7/7 и 14/14, раз секции текстуально пересекаются), или заказать/сгенерировать отдельный набор специально под голодание — например, более «строгие», пустые, «долгие» кадры, отличающие 42-дневную программу от 21-дневной по настроению. Без этого решения нельзя проставить `background` в CSS по образцу §4.

## Задачи по каждой странице (идентичны для fasting-7-7.html и fasting-14-14.html)

1. **Обернуть контент в story-panel карусель.**
   Разбить текущие плоские `<section class="section …">` на панели с `data-story-panel="0..7"`:
   `0` hero → `1` overview → `2` included → `3` flow → `4` contraindications → `5` result → `6` final-cta (`#telegram`) → `7` related.
   Добавить `#main-content{height:calc(100svh - 76px)…}`, `.story-panel` CSS-контракт из §2, скрыть `.site-footer`.
   **Не забыть (§8 п.2, п.3):** добавить `overflow:hidden` в `body` (сейчас его в обеих fasting-страницах нет — иначе появится второй страничный скролл), и внутрь `@media(prefers-reduced-motion:reduce)` добавить `.story-panel,.chapter-control,.chapter-dot{transition:none}` (эталон — tubazh, cleanse-3 это правило потерял).

2. **Добавить `chapter-nav` на каждую панель** с правильными `data-story-prev/next`, aria-label под контекст следующего экрана (по образцу cleanse-3: «Что входит», «Схема прохождения» и т. п., не generic «Далее»). Взять уже исправленную версию CSS (`position:fixed`, `z-index:30`, непрозрачные кнопки — §3), **не копировать старую версию с `position:absolute` из первой версии tubazh**.

3. **Скопировать и адаптировать JS-контроллер** из `cleanse-3.html` (эталонная версия, см. §6). Заменить ключ `localStorage` на `'fasting-7-7-story-panel'` и `'fasting-14-14-story-panel'` соответственно — **разные ключи**, чтобы прогресс не путался между четырьмя программами.

4. **Проставить фоны по секциям** после решения открытого вопроса выше — `overview`, `included`, `flow`, `result`, `related` — светлый/дневной тон; `contraindications` — тёмный ночной тон (`--ink` подложка + `color:var(--background)` на заголовке/интро, как в §4); `final-cta` — фон в цвете `--primary` + фото поверх, как в `tubazh-deep-garden`.

5. **Перевести существующие карточки на «булыжный» язык (§5):**
   - `.split-col` (included) — уже есть, добавить неровный `border-radius` + `rotate` + альтернацию чётный/нечётный.
   - `.flow-item` (схема прохождения) — сейчас плоский список со строкой-разделителем; перевести на формат отдельных кирпичиков-карточек как в `tubazh.html .flow-section .flow-item` (без общей верхней границы, каждый пункт — своя карточка).
   - `.notice-card` (противопоказания) — список из 9 пунктов длиннее, чем у cleanse-3/tubazh (4 и 2 пункта); проверить, что при 9 карточках-`<li>` на тёмном фото секция не становится слишком высокой/тяжёлой на мобильном — при необходимости уменьшить внутренние отступы `<li>`, не трогая размер шрифта ниже 15px.
   - `.result-note` (7/7) — перевести в кирпичик по образцу.
   - `.result-list` (14/14, сетка из 12 пунктов-«таблеток») — это уникальный компонент, которого нет в cleanse-3/tubazh. Не ломать существующую сетку 2 колонки/1 на мобильном, но **добавить тот же язык поверхности**: матовое стекло + чуть неровный `border-radius` на каждой `<li>`, как у `.notice-card li` в tubazh, вместо текущего ровного `18px 30% 20px 34%` (уже частично органический — сверить, что ротация не включена, добавить лёгкий `rotate` на чётных).
   - `.related-card` — уже в целевом виде на всех 4 страницах, только сверить фон (`color-mix(in srgb,var(--mist) 40%,transparent)`) и обновить ссылки: на fasting-7-7 → `cleanse-3.html` + `fasting-14-14.html`; на fasting-14-14 → `fasting-7-7.html` + `cleanse-3.html` (уже верно в обеих, просто проверить после переноса вёрстки, что `related-grid` не потерялся).

6. **Проверка после переноса (обязательно перед сдачей):**
   - Пройти обе страницы на мобильной ширине (375px) свайпом от первого до последнего экрана — стрелки не должны перекрывать текст карточек ни на одном экране, особенно на `contraindications` (9 пунктов — самый длинный экран).
   - Убедиться, что на `contraindications-section` заголовок/интро светлые (видны на тёмном фото), а сам `.notice-card` внутри — светлая карточка с тёмным текстом (не наоборот).
   - Проверить fixed-позиционирование стрелок: скролл длинного списка внутри панели не должен двигать `chapter-nav`.
   - Свериться с `related-section`: обе fasting-страницы не должны ссылаться сами на себя.
   - `localStorage`-ключи уникальны на все 4 страницы программ (`cleanse-3-story-panel`, `tubazh-story-panel`, `fasting-7-7-story-panel`, `fasting-14-14-story-panel`).
   - У `body` стоит `overflow:hidden` — нет второго страничного скролла поверх карусели (§8 п.2).
   - Стрелки на fasting используют `position:fixed;z-index:30` (эталон cleanse-3), а не `absolute;z-index:4` из tubazh (§8 п.1).
   - Под `prefers-reduced-motion` панели не анимируются (§8 п.3).
   - `tubazh.html` домигрирован (T0) — стрелки на переднем плане и там тоже.

## Порядок работы

Рекомендую: сначала **fasting-7-7.html** (короче, 9 пунктов противопоказаний против структуры 14/14 идентичной, но с более длинным `result-list` из 12 пунктов) — обкатать перенос на ней, затем по готовому шаблону быстро повторить на **fasting-14-14.html**, отдельно проверив только `result-list` (уникальный для неё компонент, см. п.5).

Отдельным шагом уже после переноса вёрстки — донести с `tubazh.html` фикс «стрелки на переднем плане» (этот документ уже описывает исправленную версию, но стоит перепроверить сам `tubazh.html`, если он редактировался копией до фикса).
