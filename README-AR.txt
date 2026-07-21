Veloura Home Tabs 2026 — Koon Safe
======================================

الملفات المعدلة:
- twilight.json
- src/views/layouts/master.twig
- src/views/pages/index.twig
- src/assets/js/app.js
- src/assets/styles/app.scss
- src/assets/styles/04-components/home-tabs.scss
- src/views/components/home/*

تمت إضافة اختيار التبويب إلى 20 مكوّنًا مخصصًا معرفًا داخل twilight.json.
المكونات الأساسية التي تديرها منصة سلة ولا توجد ضمن مصفوفة components تبقى ظاهرة دائمًا، لأن لوحة سلة لا تسمح بإضافة حقل مخصص إلى تعريفها الداخلي من ملف الثيم.

السلوك:
- النظام معطل افتراضيًا حفاظًا على الصفحة الحالية.
- عند التعطيل أو عند عدم إضافة تبويبات، تظهر كل العناصر.
- العناصر المحددة «يظهر دائمًا» تظهر مع جميع التبويبات.
- العنصر المرتبط بتبويب محذوف أو غير موجود يظهر تلقائيًا بدل أن يختفي.
- الحد الأقصى 10 تبويبات.

طريقة النسخ:
انسخ محتويات هذا المجلد فوق جذر المشروع:
D:\salla-theme\koon-veloura-safe

ثم شغّل:
node -e "JSON.parse(require('fs').readFileSync('twilight.json','utf8')); console.log('twilight.json صحيح')"
git restore -- public
pnpm production
salla theme preview
