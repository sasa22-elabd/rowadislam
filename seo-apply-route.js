/* =========================================================
   راوت مفقود: PUT /api/pages/apply-seo
   ده اللي زرار "⚡ طبّق تلقائي" في لوحة التحكم (admin.html)
   بيناديه. من غير الراوت ده، السيرفر بيرد بـ 404 فيظهر رسالة
   "API endpoint not found" بالظبط زي اللي شفتها.

   إزاي تضيفه:
   1) حط الملف ده جنب server.js على السيرفر (مثلاً في مجلد
      routes/ لو بتستخدم تقسيم راوتات، أو حتى في نفس مجلد
      server.js).
   2) في server.js، فوق مباشرة أي app.listen(...)، ضيف:

        const applySeoRoute = require('./seo-apply-route');
        app.use('/api', applySeoRoute);

      (عدّل المسار './seo-apply-route' لو حطيته في مكان تاني،
      وعدّل requireAdminAuth تحت لو عندك ميدل وير تسجيل دخول
      بأسم مختلف).
   3) اعمل ريستارت للسيرفر من لوحة Node.js في هوستينجر.

   ملحوظة أمان مهمة: الراوت ده بيعدّل ملفات HTML حقيقية على
   السيرفر، فلازم يكون محمي بتسجيل الدخول (نفس التوكن اللي
   باقي اللوحة بتستخدمه)، وده موجود تحت كـ placeholder
   requireAdminAuth — لازم تربطه بنظام تسجيل الدخول الحقيقي
   عندك في admin.js / server.js بدل ما يفضل مفتوح للكل.
========================================================= */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// جذر ملفات الموقع (اللي فيها index.html, about.html... إلخ)
// ✅ حسب server.js بتاعك: الصفحات (index.html, store.html,
// cart.html...) موجودة مباشرة في نفس مجلد server.js، ومجلد
// public/ مخصص بس لملفات الرفع (public/uploads). طالما الملف
// ده حاطه جنب server.js زي ما المفروض، فـ __dirname هنا هو
// نفس المجلد الجذر الصح تلقائيًا.
const SITE_ROOT = __dirname;

// ---------------------------------------------------------
// ⚠️ لازم تستبدل الدالة دي بالتحقق الحقيقي بتاع تسجيل الدخول
// عندك (نفس اللي بيتحقق من Authorization: Bearer التوكن في
// باقي الـ API عندك). سايبها هنا كمثال بسيط لحد ما تربطها.
// ---------------------------------------------------------
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'محتاج تسجل دخول الأول' });
  }

  // TODO: تحقق فعلي من صحة التوكن هنا (JWT verify أو مقارنة
  // بجدول sessions... حسب نظامك). لو فشل التحقق، رجّع 401.

  next();
}

// يحوّل المسار اللي جاي من اللوحة ("/", "/shamasy.html", ...)
// لمسار ملف حقيقي جوه SITE_ROOT، ويمنع الخروج برا المجلد
// (path traversal) لو حد بعت مسار زي "../../etc/passwd".
function resolvePageFile(requestedPath) {
  let clean = (requestedPath || '/').split('?')[0].split('#')[0];

  if (clean === '/' || clean === '') {
    clean = '/index.html';
  }

  if (!clean.endsWith('.html')) {
    clean += clean.endsWith('/') ? 'index.html' : '.html';
  }

  const filePath = path.normalize(path.join(SITE_ROOT, clean));

  // تأكيد إن الملف النهائي لسه جوه SITE_ROOT فعلاً
  if (!filePath.startsWith(SITE_ROOT)) {
    return null;
  }

  return filePath;
}

function escapeForAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeForText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * PUT /api/pages/apply-seo
 * body: { path: "/shamasy.html", field: "metaTitle" | "metaDescription", value: "..." }
 */
router.put('/pages/apply-seo', requireAdminAuth, async (req, res) => {
  try {
    const { path: pagePath, field, value } = req.body || {};

    if (!pagePath || !field || typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ message: 'بيانات ناقصة (path / field / value)' });
    }

    if (field !== 'metaTitle' && field !== 'metaDescription') {
      return res.status(400).json({ message: 'field غير مدعوم' });
    }

    const filePath = resolvePageFile(pagePath);

    if (!filePath) {
      return res.status(400).json({ message: 'مسار الصفحة غير صالح' });
    }

    let html;
    try {
      html = await fs.readFile(filePath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ message: 'الصفحة مش موجودة على السيرفر: ' + pagePath });
      }
      throw err;
    }

    let updatedHtml = html;

    if (field === 'metaTitle') {
      const safeValue = escapeForText(value.trim());

      if (/<title>[\s\S]*?<\/title>/i.test(updatedHtml)) {
        updatedHtml = updatedHtml.replace(
          /<title>[\s\S]*?<\/title>/i,
          `<title>${safeValue}</title>`
        );
      } else {
        // مفيش title خالص؟ نضيفه قبل </head>
        updatedHtml = updatedHtml.replace(
          /<\/head>/i,
          `    <title>${safeValue}</title>\n</head>`
        );
      }
    }

    if (field === 'metaDescription') {
      const safeValue = escapeForAttribute(value.trim());
      const metaRegex = /<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/i;

      if (metaRegex.test(updatedHtml)) {
        updatedHtml = updatedHtml.replace(
          metaRegex,
          `<meta name="description" content="${safeValue}">`
        );
      } else {
        updatedHtml = updatedHtml.replace(
          /<\/head>/i,
          `    <meta name="description" content="${safeValue}">\n</head>`
        );
      }
    }

    // نسخة احتياطية بسيطة قبل الكتابة، احتياطي في حالة حصل خطأ
    await fs.writeFile(filePath + '.bak', html, 'utf8');
    await fs.writeFile(filePath, updatedHtml, 'utf8');

    return res.json({ success: true, path: pagePath, field, value: value.trim() });

  } catch (err) {
    console.error('apply-seo error:', err);
    return res.status(500).json({ message: 'حصل خطأ في السيرفر أثناء التطبيق' });
  }
});

module.exports = router;