V46 — Ultra Related Slider System

هذا الإصلاح ينسخ نظام Ultra Square Images نفسه بدل تقليده جزئيًا:

1) حقلا العدد يستخدمان type=number + format=slider + inputType=range.
2) value/step/minimum/maximum نصوص رقمية.
3) minimum=1 للحقلين؛ لأن minimum=2 كان يُفسَّر في محرر سلة كحد أدنى لطول النص ويُنتج رسالة الخطأ.
4) تم تغيير المعرّفات الطويلة إلى:
   - veloura_related_mobile_columns
   - veloura_related_desktop_columns
   وإزالة المعرّفات القديمة بالكامل.
5) related products يأخذ slider-config مباشرة داخل Twig بنفس نمط Ultra Square Images:
   slidesPerView للجوال + breakpoint 768 للكمبيوتر.

القيم:
- الجوال: 1 إلى 3، الافتراضي 2.
- الكمبيوتر: 1 إلى 6، الافتراضي 4.
