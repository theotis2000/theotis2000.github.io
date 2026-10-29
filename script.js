(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  document.documentElement.classList.add("js-ready");

  const progress = $(".scroll-progress");
  const progressFill = $("#scroll-progress-fill");
  const topButton = $("#back-to-top");
  const nav = $("#main-navigation");
  const menuButton = $(".menu-toggle");
  const navLinks = nav ? $$('a[href^="#"]', nav) : [];

  function updateScrollUI() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
    if (progressFill) progressFill.style.width = percentage + "%";
    if (progress) progress.setAttribute("aria-valuenow", String(Math.round(percentage)));
    if (topButton) topButton.classList.toggle("is-visible", window.scrollY > 550);
  }
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  window.addEventListener("resize", updateScrollUI);
  updateScrollUI();

  function closeMenu() {
    if (!nav || !menuButton) return;
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  }
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
      nav.classList.toggle("is-open", !isOpen);
    });
    navLinks.forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });
    document.addEventListener("click", event => {
      if (nav.classList.contains("is-open") && !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  if ("IntersectionObserver" in window && navLinks.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          const active = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-25% 0px -60% 0px", threshold: 0 });
    navLinks.forEach(link => {
      const section = $(link.getAttribute("href"));
      if (section) sectionObserver.observe(section);
    });
  }

  const revealTargets = $$(".section-label, .section-body, .hero-copy, .portrait-frame");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealTargets.forEach(el => el.classList.add("reveal"));
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(el => revealObserver.observe(el));
  }

  if (topButton) topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.opacity = "0";
    document.body.appendChild(box);
    box.select();
    const ok = document.execCommand("copy");
    box.remove();
    if (!ok) throw new Error("Copy command not available");
  }

  $$("[data-copy]").forEach(button => {
    button.addEventListener("click", async () => {
      const original = button.textContent;
      try {
        await copyText(button.getAttribute("data-copy") || "");
        button.textContent = "Copied!";
        button.setAttribute("aria-live", "polite");
      } catch {
        button.textContent = "Select email above";
      }
      window.setTimeout(() => { button.textContent = original; }, 1800);
    });
  });

  const fontSize = $("main#article-content");
  const smaller = $("#article-font-smaller");
  const larger = $("#article-font-larger");
  const copyArticle = $("#copy-article-link");
  const shareArticle = $("#share-article");
  if (fontSize && (smaller || larger)) {
    let size = 17;
    if (smaller) smaller.addEventListener("click", () => {
      size = Math.max(15, size - 1);
      fontSize.style.fontSize = size + "px";
    });
    if (larger) larger.addEventListener("click", () => {
      size = Math.min(22, size + 1);
      fontSize.style.fontSize = size + "px";
    });
  }
  if (copyArticle) copyArticle.addEventListener("click", async () => {
    const original = copyArticle.textContent;
    try {
      await copyText(window.location.href);
      copyArticle.textContent = "Link copied!";
    } catch {
      copyArticle.textContent = "Copy unavailable";
    }
    window.setTimeout(() => { copyArticle.textContent = original; }, 1800);
  });
  if (shareArticle) {
    shareArticle.addEventListener("click", async () => {
      if (navigator.share) {
        try { await navigator.share({ title: document.title, url: window.location.href }); } catch {}
      } else if (copyArticle) {
        copyArticle.click();
      }
    });
  }
})();