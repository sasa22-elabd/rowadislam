/* =========================================================
   رواد الظل | articles.js
   جلب أحدث المقالات من الـ API وعرضها في سكشن "مقالاتنا"
========================================================= */

(function () {
  "use strict";

  const API_BASE = "https://rowadalthil.com";
  const VISIBLE_COUNT = 3;

  const slider = document.getElementById("shadowArticlesSlider");
  if (!slider) return;

  const section = slider.closest(".shadow-articles-section");

  let articles = [];
  let centerIndex = 0;

  function resolveImage(path) {
    if (!path) return "images/article-1.jpg"; // صورة افتراضية لو مفيش صورة
    if (/^https?:\/\//i.test(path)) return path;
    return "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
  }

  async function loadArticles() {
    try {
      const res = await fetch(API_BASE + "/api/articles?page=1&limit=9");
      const data = await res.json();

      const list = Array.isArray(data) ? data : data.articles || data.data || [];

      // نعرض المنشور بس على الموقع
      articles = list.filter((a) => (a.published === undefined ? true : !!a.published));

      if (!articles.length) return; // سيبها على الكروت الثابتة الموجودة في الهتمل

      centerIndex = 0;
      renderSlider();
    } catch (err) {
      console.error("تعذر تحميل المقالات:", err);
      // في حالة الخطأ، الكروت الثابتة في الهتمل تفضل زي ما هي
    }
  }

  function getArticleAt(offset) {
    if (!articles.length) return null;
    const idx = (((centerIndex + offset) % articles.length) + articles.length) % articles.length;
    return articles[idx];
  }

  function buildCard(article, positionClass, arrowHtml) {
    if (!article) return "";

    const category = article.category || "مقالات";
    const year = article.createdAt
      ? new Date(article.createdAt).getFullYear()
      : new Date().getFullYear();

    return `
      <article class="shadow-article-card ${positionClass}">
        <div class="shadow-article-media">
          <img src="${resolveImage(article.image)}" alt="${article.title || ""}">
          <div class="shadow-article-overlay"></div>
          ${arrowHtml || ""}
          <div class="shadow-article-info">
            <span class="shadow-article-category">${category}</span>
            <h3>${article.title || ""}</h3>
            <span class="shadow-article-year">${year}</span>
            <div class="shadow-article-line"></div>
          </div>
        </div>
      </article>
    `;
  }

  function renderSlider() {
    const rightArticle = getArticleAt(-1);
    const centerArticle = getArticleAt(0);
    const leftArticle = getArticleAt(1);

    const rightArrow = `
      <button class="shadow-article-arrow shadow-arrow-right" type="button" aria-label="السابق">
        <span></span>
      </button>
    `;

    const leftArrow = `
      <button class="shadow-article-arrow shadow-arrow-left" type="button" aria-label="التالي">
        <span></span>
      </button>
    `;

    slider.innerHTML =
      buildCard(rightArticle, "shadow-article-side", articles.length > 1 ? rightArrow : "") +
      buildCard(centerArticle, "shadow-article-center", "") +
      buildCard(leftArticle, "shadow-article-side", articles.length > 1 ? leftArrow : "");

    bindCardClicks();
    bindArrows();
  }

  function bindArrows() {
    const rightBtn = slider.querySelector(".shadow-arrow-right");
    const leftBtn = slider.querySelector(".shadow-arrow-left");

    if (rightBtn) {
      rightBtn.addEventListener("click", () => {
        centerIndex = (centerIndex - 1 + articles.length) % articles.length;
        renderSlider();
      });
    }

    if (leftBtn) {
      leftBtn.addEventListener("click", () => {
        centerIndex = (centerIndex + 1) % articles.length;
        renderSlider();
      });
    }
  }

  function bindCardClicks() {
    slider.querySelectorAll(".shadow-article-card").forEach((card, i) => {
      card.style.cursor = "pointer";
      card.addEventListener("click", (e) => {
        // متجيش نفتح اللينك لو المستخدم داس على السهم
        if (e.target.closest(".shadow-article-arrow")) return;

        const article =
          i === 0 ? getArticleAt(-1) : i === 1 ? getArticleAt(0) : getArticleAt(1);

        if (article && article.slug) {
          window.location.href = "article.html?slug=" + encodeURIComponent(article.slug);
        }
      });
    });
  }

  loadArticles();
})();
