# التصميم التقني — وَصْل

## اختيار الـstack

**TypeScript + Vite + PixiJS 8 + HTML/CSS RTL.** Pixi يرسم شبكة المحطات وحركة الفرص والمؤثرات بـWebGL، بينما تبقى النصوص والأزرار العربية في DOM. المحاكاة نفسها TypeScript حتمية مستقلة عن الرسم، ولا تستخدم محرك فيزياء أجسام في النسخة الأولى. هذا لأن سؤال اللاعب هو تدفق العمل وموضع المحطات، لا ارتداد أجسام.

| خيار | القوة | سبب القرار |
|---|---|---|
| Canvas 2D خام | أقل حزمة وأعلى تحكم | إدارة المشاهد والـbatching والمؤثرات ستستهلك وقت النموذج الأولي |
| PixiJS 8 | رسم 2D سريع، أحداث ماوس، تحكم دقيق في الحجم | **مختار** لشبكة كثيفة ومؤثرات متصاعدة مع واجهة عربية DOM |
| Phaser | إطار ألعاب كامل مع Arcade/Matter physics | جيد إذا أصبحت الفيزياء محور اللعب؛ عبء مفاهيم Scene/physics زائد لفكرة شبكة التدفق الحالية |
| Godot Web | أدوات محرر وإنتاج قوية | تصدير Web يحتاج WebAssembly/WebGL2، ويزيد تعقيد تسليم لعبة خفيفة ومزج واجهة DOM |
| Unity Web | منظومة إنتاج غنية والمرجع نفسه استخدم Unity في demo الويب | غير متناسب مع أولوية تحميل خفيف وتحكم Arabic DOM دقيق؛ ليس حكمًا على جودة المرجع |

المقارنة مبنية على [توثيق PixiJS للرسم](https://pixijs.com/8.x/guides/components/renderers)، [توثيق Phaser](https://docs.phaser.io/) و[أنظمة الفيزياء فيه](https://docs.phaser.io/phaser/concepts/physics)، [توثيق Godot Web](https://docs.godotengine.org/en/4.5/tutorials/export/exporting_for_web.html)، و[توثيق Unity Web](https://docs.unity3d.com/Manual/webgl-building.html). سنثبت النسخ الفعلية في `package-lock.json` عند M1.

## حدود الأنظمة

```text
Pointer + DOM controls
         ↓ commands
Game simulation (fixed timestep, seeded RNG, rules)
         ↓ events + immutable view model
Pixi board renderer + DOM HUD + audio cue manager
         ↓
Versioned local save / telemetry for local playtests
```

مجلدات مقترحة: `src/sim` للقواعد والتوقيت والسلاسل، `src/view` للرسم، `src/ui` للـRTL، `src/content` للمحطات والترقيات المعرّفة كبيانات، `src/platform` للحفظ والصوت، `tests` للاختبارات. لا API أو تسجيل حساب في النسخة الأولى.

## المحاكاة والمدخلات

- خطوة ثابتة (مبدئيًا 30 tick/s)، rendering مستقل حتى 60fps؛ seed لإعادة سيناريوهات الاختبار.
- طابور أحداث محدود لكل tick، حدود لتوالد الإحالات، وأولوية ثابتة لمعالجة الفرص؛ لا حلقات لا نهائية عند تركيب تآزرات.
- Pointer Events: سحب وإفلات، نقر، وعجلة ماوس؛ وضعية mouse-only تُختبر صراحةً. لا استخدام إلزامي للوحة المفاتيح. Canvas يلتقط الإحداثيات بعد تحويل camera/zoom، وDOM يعالج أزرار الواجهة.
- الفيزياء البصرية مقتصرة على easing ومسارات bezier؛ ليست مصدرًا لقرار اللعبة.

## حفظ وتعريب وأصول وصوت

- `localStorage` لحفظ الإعدادات، فتحات الـmeta، وجولة قابلة للاستئناف. صيغة versioned مع migration بسيطة؛ export/import JSON يضاف فقط إن بررته اختبارات المستخدم.
- `lang="ar" dir="rtl"` من أول صفحة. النصوص في قاموس واحد، `Intl.NumberFormat('ar-EG')` حيث يحسن القراءة، واختبار اتجاه الأرقام والعلامات المختلطة. لا تُرسم العربية داخل Canvas إلا بعد إثبات حاجة فعلية.
- SVG/PNG/WebP أصلية مضغوطة في atlas صغير. تحميل تدريجي؛ المشهد الأول لا ينتظر مؤثرات المراحل المتأخرة.
- Web Audio API مع بدء بعد أول تفاعل، pooling للأصوات القصيرة، وكتم وحجم محفوظان.

## الأداء والاختبار

موازنة أولية للاختبار على لابتوب متوسط: أول تحميل مضغوط تحت 2MB قدر الإمكان، 60fps عند المشهد العادي، لا تقل عن 30fps في ذروة المرحلة الرابعة، وحدود صريحة للأجسام والمؤثرات الحية. هذه أهداف تُقاس في M6، وليست ضمانات مبكرة. Pixi WebGL هو المسار الأساسي؛ تعرض رسالة توافق واضحة إذا فشل تهيئة الرسم.

Vitest لقواعد المحاكاة، منع الحلقات، الحفظ، وتوازن السلاسل. Playwright لمسار بدء الجولة والتفاعل بالماوس والتعريب والحفظ. فحص يدوي بصري في Chrome/Edge/Firefox desktop ونوافذ قياسية. كل Issue جديدة تحدد اختبارها المطلوب.

## CI/CD والنشر

GitHub Actions: `npm ci` → typecheck → unit tests → build → browser smoke على PR. ينشر `main` نسخة ثابتة إلى GitHub Pages بعد توافر shell قابل للعب؛ PR يرفع artifact قابلًا للتنزيل، ويمكن إضافة preview URL لاحقًا عبر منصة استضافة إذا لزم. لا نعد برابط Preview قبل إثبات صلاحيات الاستضافة. لا يتم نشر نسخة غير قابلة للعب بوصفها لعبة.
