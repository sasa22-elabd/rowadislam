/* =========================================================
   رواد الظل | articles-list.js
   صفحة عرض كل المقالات + بحث + ترقيم صفحات
========================================================= */

(function () {
  "use strict";

  const API_BASE = "https://rowadalthil.com";
  const PER_PAGE = 9;

  const grid = document.getElementById("articlesListGrid");
  const pagination = document.getElementById("articlesListPagination");
  const searchInput = document.getElementById("articlesListSearch");

  if (!grid) return;

  let currentPage = 1;
  let searchTerm = "";
  let searchTimer;

  function resolveImage(path) {
    if (!path) return "images/article-1.jpg";
    if (/^https?:\/\//i.test(path)) return path;
    return "/uploads/" + path.replace(/^\/?(uploads\/)?/, "");
  }

  function formatDate(value) {
    if (!value) return "";
    try {
      const d = new Date(value);
      return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  async function loadArticles(page) {
    currentPage = page || 1;

    grid.innerHTML = `<div class="articles-loading">جاري تحميل المقالات...</div>`;
    pagination.innerHTML = "";

    try {
      const query =
        "/api/articles?page=" +
        currentPage +
        "&limit=" +
        PER_PAGE +
        (searchTerm ? "&search=" + encodeURIComponent(searchTerm) : "");

      const res = await fetch(API_BASE + query);
      const data = await res.json();

      let list, totalPages, page_;

      if (Array.isArray(data)) {
        let filtered = data.filter((a) =>
          a.published === undefined ? true : !!a.published
        );

        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          filtered = filtered.filter(
            (a) =>
              (a.title || "").toLowerCase().includes(q) ||
              (a.excerpt || "").toLowerCase().includes(q)
          );
        }

        totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        page_ = currentPage;
        const start = (currentPage - 1) * PER_PAGE;
        list = filtered.slice(start, start + PER_PAGE);
      } else {
        list = (data.articles || data.data || []).filter((a) =>
          a.published === undefined ? true : !!a.published
        );
        totalPages = data.totalPages || 1;
        page_ = data.currentPage || currentPage;
      }

      renderGrid(list);
      renderPagination(totalPages, page_);
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div class="articles-empty">تعذر تحميل المقالات، حاول تاني لاحقاً</div>`;
    }
  }

  function renderGrid(articles) {
    if (!articles.length) {
      grid.innerHTML = `<div class="articles-empty">لا توجد مقالات مطابقة</div>`;
      return;
    }

    grid.innerHTML = articles
      .map(
        (a) => `
      <article class="article-card" data-slug="${a.slug || ""}">
        <div class="article-card-media">
          <img src="${resolveImage(a.image)}" alt="${a.title || ""}">
          <span class="article-card-category">${a.category || "مقالات"}</span>
        </div>
        <div class="article-card-body">
          <div class="article-card-date">${formatDate(a.createdAt || a.updatedAt)}</div>
          <h3 class="article-card-title">${a.title || ""}</h3>
          <p class="article-card-excerpt">${a.excerpt || ""}</p>
          <span class="article-card-more">
            اقرأ المزيد
            <i class="fa-solid fa-arrow-left"></i>
          </span>
        </div>
      </article>
    `
      )
      .join("");

    grid.querySelectorAll(".article-card").forEach((card) => {
      card.addEventListener("click", () => {
        const slug = card.getAttribute("data-slug");
        if (slug) {
          window.location.href = "article.html?slug=" + encodeURIComponent(slug);
        }
      });
    });
  }

  function renderPagination(totalPages, page) {
    pagination.innerHTML = "";

    if (totalPages <= 1) return;

    const prev = document.createElement("button");
    prev.innerHTML = "‹";
    prev.disabled = page === 1;
    prev.addEventListener("click", () => loadArticles(page - 1));
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = i === page ? "active" : "";
      btn.addEventListener("click", () => loadArticles(i));
      pagination.appendChild(btn);
    }

    const next = document.createElement("button");
    next.innerHTML = "›";
    next.disabled = page === totalPages;
    next.addEventListener("click", () => loadArticles(page + 1));
    pagination.appendChild(next);
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchTerm = searchInput.value.trim();
        loadArticles(1);
      }, 350);
    });
  }

  loadArticles(1);
})();
