/* ==========================================================================
   LINGYUAN DESIGN LAB — interactions v3
   Header / drawer / reveal / hover-pan boards / lightbox / copy / filters
   ========================================================================== */

(function () {
  "use strict";

  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  if (reduceMotion) body.classList.add("no-motion");

  /* ---------- header state + reading progress ---------- */
  var header = $(".site-header");
  var progress = $(".progress i");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("scrolled", y > 32);
    if (progress) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? clamp(y / max, 0, 1) * 100 : 0) + "%";
    }
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(onScroll);
    },
    { passive: true }
  );
  onScroll();

  /* ---------- active navigation ---------- */
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (!file) file = "index.html";
  var navMap = {
    "index.html": "home",
    "about.html": "about",
    "projects.html": "projects",
    "amazon.html": "ecommerce",
    "ai.html": "ailab",
    "render.html": "3dlab",
    "packaging.html": "packaging",
    "contact.html": "contact",
  };
  var currentKey = navMap[file];
  $$("[data-nav]").forEach(function (el) {
    if (el.getAttribute("data-nav") === currentKey) {
      el.classList.add("active");
      el.setAttribute("aria-current", "page");
    }
  });

  /* ---------- drawer ---------- */
  var drawer = $("#drawer");
  var menuBtn = $("#navToggle");
  var closeBtn = $("#drawerClose");
  var lastFocus = null;

  function trapFocus(e) {
    if (!drawer || e.key !== "Tab" || !drawer.classList.contains("open")) return;
    var items = $$(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      drawer
    ).filter(function (el) {
      return el.offsetParent !== null;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add("open");
    drawer.removeAttribute("inert");
    body.classList.add("no-scroll");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
    window.setTimeout(function () {
      if (closeBtn) closeBtn.focus();
    }, 60);
  }

  function closeDrawer() {
    if (!drawer || !drawer.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawer.setAttribute("inert", "");
    body.classList.remove("no-scroll");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  if (drawer) {
    drawer.setAttribute("inert", "");
    if (menuBtn) menuBtn.addEventListener("click", openDrawer);
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    $$("a", drawer).forEach(function (a) {
      a.addEventListener("click", closeDrawer);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
      trapFocus(e);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) closeDrawer();
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }

  window.addEventListener("load", function () {
    reveals.forEach(function (el) {
      if (el.classList.contains("in")) return;
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 30 && rect.bottom > 0) {
        el.classList.add("in");
      }
    });
  });

  /* ---------- hover-pan long-form boards ---------- */
  if (finePointer && !reduceMotion) {
    $$(".work").forEach(function (card) {
      var media = $(".work-media", card);
      var img = media ? $("img", media) : null;
      if (!media || !img) return;

      function overflow() {
        var w = img.naturalWidth || Number(img.getAttribute("width")) || 1440;
        var h = img.naturalHeight || Number(img.getAttribute("height")) || 7000;
        if (!w) return 0;
        var rendered = media.clientWidth * (h / w);
        return Math.max(0, rendered - media.clientHeight);
      }

      card.addEventListener("mouseenter", function () {
        var dist = overflow();
        if (dist < 12) return;
        img.style.transitionTimingFunction = "cubic-bezier(.2,.45,.35,1)";
        img.style.transitionDuration = clamp(dist / 300, 1.6, 7).toFixed(2) + "s";
        img.style.transform = "translate3d(0," + -dist.toFixed(1) + "px,0)";
      });

      card.addEventListener("mouseleave", function () {
        img.style.transitionTimingFunction = "cubic-bezier(.22,.61,.36,1)";
        img.style.transitionDuration = "0.85s";
        img.style.transform = "translate3d(0,0,0)";
      });

      card.addEventListener("focus", function () {
        var dist = overflow();
        if (dist > 12) {
          img.style.transitionDuration = "3s";
          img.style.transform = "translate3d(0," + (-dist / 2).toFixed(1) + "px,0)";
        }
      });
    });
  }

  /* ---------- subtle hero parallax ---------- */
  var heroStack = $(".hero-stack");
  if (heroStack && finePointer && !reduceMotion) {
    var layers = $$(".spec-media", heroStack);
    var raf = null;
    var targetX = 0;
    var targetY = 0;
    var curX = 0;
    var curY = 0;

    function parallax() {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      layers.forEach(function (layer, i) {
        var depth = (i % 3) * 0.4 + 0.4;
        layer.style.transform =
          "translate3d(" +
          (curX * depth).toFixed(2) +
          "px," +
          (curY * depth).toFixed(2) +
          "px,0)";
      });
      if (Math.abs(targetX - curX) > 0.1 || Math.abs(targetY - curY) > 0.1) {
        raf = requestAnimationFrame(parallax);
      } else {
        raf = null;
      }
    }

    window.addEventListener(
      "mousemove",
      function (e) {
        targetX = (e.clientX / window.innerWidth - 0.5) * 18;
        targetY = (e.clientY / window.innerHeight - 0.5) * 14;
        if (!raf) raf = requestAnimationFrame(parallax);
      },
      { passive: true }
    );
  }

  /* ---------- lightbox gallery ---------- */
  var gallerySelectors = [
    ".board-item a img",
    ".work-media img",
    ".case-cover img",
    ".profile-media img",
    ".resume-aside img",
    ".gallery img",
    ".contact-visual img",
  ];

  var gallery = [];
  gallerySelectors.forEach(function (sel) {
    $$(sel).forEach(function (img) {
      if (!img.getAttribute("src")) return;
      if (img.closest(".lightbox")) return;
      gallery.push({
        el: img,
        src: img.getAttribute("src"),
        alt: (img.getAttribute("alt") || "").trim(),
      });
    });
  });

  if (gallery.length) {
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Image viewer");
    lb.innerHTML =
      '<div class="lb-top">' +
      '<p class="lb-meta"><b class="lb-counter">01</b> / <span class="lb-total">01</span> — LINGYUAN DESIGN LAB</p>' +
      '<div class="lb-tools">' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '<button class="lb-btn lb-close" type="button" aria-label="Close viewer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      "</div></div>" +
      '<div class="lb-body"><img alt="" /></div>' +
      '<p class="lb-caption"></p>' +
      '<p class="lb-hint">SCROLL THE BOARD · ← → TO SWITCH · ESC TO CLOSE</p>';

    body.appendChild(lb);

    var lbImg = $(".lb-body img", lb);
    var lbCap = $(".lb-caption", lb);
    var lbCounter = $(".lb-counter", lb);
    var lbTotal = $(".lb-total", lb);
    var lbPrev = $(".lb-prev", lb);
    var lbNext = $(".lb-next", lb);
    var lbClose = $(".lb-close", lb);
    var lbBody = $(".lb-body", lb);
    var current = 0;
    var restoreFocus = null;

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function render(index) {
      current = (index + gallery.length) % gallery.length;
      var item = gallery[current];
      lbImg.src = item.src;
      lbImg.alt = item.alt;
      lbCap.textContent = item.alt || "LINGYUAN DESIGN LAB — " + pad(current + 1);
      lbCounter.textContent = pad(current + 1);
      lbTotal.textContent = pad(gallery.length);
      lbBody.scrollTop = 0;
      var single = gallery.length < 2;
      lbPrev.disabled = single;
      lbNext.disabled = single;
      lbPrev.style.opacity = single ? "0.35" : "1";
      lbNext.style.opacity = single ? "0.35" : "1";
    }

    function openLb(index, trigger) {
      restoreFocus = trigger || document.activeElement;
      render(index);
      lb.classList.add("open");
      body.classList.add("no-scroll");
      window.setTimeout(function () {
        lbClose.focus();
      }, 40);
    }

    function closeLb() {
      lb.classList.remove("open");
      body.classList.remove("no-scroll");
      lbImg.removeAttribute("src");
      if (restoreFocus && typeof restoreFocus.focus === "function") {
        restoreFocus.focus();
      }
    }

    gallery.forEach(function (item, i) {
      item.el.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openLb(i, item.el);
      });
      item.el.style.cursor = "zoom-in";
    });

    lbPrev.addEventListener("click", function () {
      render(current - 1);
    });
    lbNext.addEventListener("click", function () {
      render(current + 1);
    });
    lbClose.addEventListener("click", closeLb);

    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target === lbBody) closeLb();
    });

    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowRight") render(current + 1);
      else if (e.key === "ArrowLeft") render(current - 1);
    });
  }

  /* ---------- copy to clipboard ---------- */
  function toast(message) {
    var el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    window.clearTimeout(el._timer);
    el._timer = window.setTimeout(function () {
      el.classList.remove("show");
    }, 1900);
  }

  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy");
      if (!value) return;
      var done = function () {
        toast("COPIED — " + value);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(done).catch(function () {
          toast(value);
        });
      } else {
        var tmp = document.createElement("textarea");
        tmp.value = value;
        tmp.setAttribute("readonly", "");
        tmp.style.position = "fixed";
        tmp.style.opacity = "0";
        body.appendChild(tmp);
        tmp.select();
        try {
          document.execCommand("copy");
          done();
        } catch (err) {
          toast(value);
        }
        body.removeChild(tmp);
      }
    });
  });

  /* ---------- archive filters ---------- */
  var filterBar = $("[data-filters]");
  if (filterBar) {
    var chapters = $$(".chapter[data-cat]");
    var counter = $("[data-visible-count]");
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      var key = btn.getAttribute("data-filter");
      $$("[data-filter]", filterBar).forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      var shown = 0;
      chapters.forEach(function (chapter) {
        var match = key === "all" || chapter.getAttribute("data-cat") === key;
        chapter.hidden = !match;
        if (match) shown++;
      });
      if (counter) counter.textContent = (shown < 10 ? "0" + shown : shown) + " CHAPTERS";
    });
  }

  /* ---------- skill bars ---------- */
  var bars = $$(".exp-bar");
  if (bars.length) {
    var animate = function () {
      bars.forEach(function (bar) {
        var val = bar.getAttribute("data-val");
        if (val) bar.querySelector("i").style.width = val + "%";
      });
    };
    if ("IntersectionObserver" in window && !reduceMotion) {
      var bio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animate();
              bio.disconnect();
            }
          });
        },
        { threshold: 0.25 }
      );
      bio.observe(bars[0].closest(".resume-block") || bars[0]);
    } else {
      animate();
    }
  }

  /* ---------- print CV ---------- */
  $$("[data-print]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      window.print();
    });
  });

  /* ---------- year ---------- */
  $$("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
