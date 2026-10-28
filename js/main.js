document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  const plugins = [window.DrawSVGPlugin, window.MorphSVGPlugin, window.ScrollTrigger, window.ScrollToPlugin, window.SplitText, window.TextPlugin].filter(Boolean);
  if (hasGSAP && plugins.length) window.gsap.registerPlugin(...plugins);

  initScrollbar();
  initNavbar();
  initMobileMenu();
  initServices();
  initTeam();
  initBrandJourney();
  initMagnetic();
  initDotField();
  initParticles();
  initContactForm();
  document.querySelector("#year").textContent = new Date().getFullYear();
  window.addEventListener("load", () => window.ScrollTrigger?.refresh());

  const heroTimeline = initHero();
  let heroStarted = false;
  const startHero = () => {
    if (heroStarted) return;
    heroStarted = true;
    heroTimeline?.play(0);
  };
  await initPreloader(startHero);
  startHero();
  initReveals();
  window.ScrollTrigger?.refresh();
  const initialTarget = window.location.hash ? document.querySelector(window.location.hash) : null;
  if (initialTarget) {
    initialTarget.scrollIntoView({ block: "start" });
  }

  function initPreloader(onReveal = () => {}) {
    const preloader = document.querySelector(".preloader");
    if (!preloader) { document.documentElement.classList.remove("is-loading"); return Promise.resolve(); }
    const counter = preloader.querySelector("[data-preloader-count]");
    const wordmark = preloader.querySelector(".preloader-wordmark");
    const rails = [...preloader.querySelectorAll(".preloader-wordmark-rail")];
    const rightSide = preloader.querySelector(".preloader-wordmark-right");
    const symbolFill = preloader.querySelector(".preloader-symbol-fill");
    if (!counter || !wordmark || rails.length !== 2 || !rightSide || !symbolFill) {
      document.documentElement.classList.remove("is-loading");
      preloader.remove();
      onReveal();
      return Promise.resolve();
    }

    const sourceWidth = 771.32;
    const sourceHeight = 179.44;
    const progressDuration = reduceMotion ? 0 : 1750;
    const exitAt = reduceMotion ? 0 : 1850;
    const totalDuration = reduceMotion ? 80 : 2000;
    let maxExtension = 0;
    let currentProgress = 0;
    let animationFrame = 0;
    let revealed = false;

    const updateLayout = () => {
      const bounds = wordmark.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const viewBoxWidth = bounds.width * sourceHeight / bounds.height;
      maxExtension = Math.max(0, viewBoxWidth - sourceWidth);
      wordmark.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${sourceHeight}`);
    };

    const render = (progress) => {
      currentProgress = Math.min(1, Math.max(0, progress));
      const percentage = Math.round(currentProgress * 100);
      const extension = maxExtension * Math.pow(currentProgress, 1.3);
      counter.textContent = String(percentage);
      rails.forEach((rail) => rail.setAttribute("width", String(extension + 3)));
      rightSide.setAttribute("transform", `translate(${extension} 0)`);
      symbolFill.style.clipPath = `inset(${100 - percentage}% 0 0)`;
    };

    const revealPage = () => {
      if (revealed) return;
      revealed = true;
      render(1);
      onReveal();
      preloader.classList.add("is-leaving");
    };

    updateLayout();
    render(reduceMotion ? 1 : 0);
    const handleResize = () => { updateLayout(); render(currentProgress); };
    window.addEventListener("resize", handleResize);

    return new Promise((resolve) => {
      const startedAt = performance.now();
      const complete = () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", handleResize);
        document.documentElement.classList.remove("is-loading");
        preloader.remove();
        resolve();
      };

      const tick = (now) => {
        const elapsed = now - startedAt;
        render(progressDuration ? Math.min(1, elapsed / progressDuration) : 1);
        if (elapsed >= exitAt) revealPage();
        if (elapsed >= totalDuration) { complete(); return; }
        animationFrame = window.requestAnimationFrame(tick);
      };

      animationFrame = window.requestAnimationFrame(tick);
    });
  }

  function initScrollbar() {
    const bar = document.querySelector(".site-scrollbar");
    const thumb = bar?.querySelector(".site-scrollbar-thumb");
    if (!bar || !thumb) return;

    let frame = 0;
    let metrics = { maxScroll: 0, maxTop: 0, thumbHeight: 0 };
    let drag = null;

    const getNativeScrollTop = () => window.scrollY || document.documentElement.scrollTop || 0;
    const getScrollTop = () => drag?.scrollTop ?? getNativeScrollTop();

    const positionThumb = (scrollTop) => {
      const clampedScroll = Math.min(metrics.maxScroll, Math.max(0, scrollTop));
      const thumbTop = metrics.maxScroll ? (clampedScroll / metrics.maxScroll) * metrics.maxTop : 0;
      thumb.style.transform = `translate3d(0,${thumbTop}px,0)`;
      bar.setAttribute("aria-valuenow", String(Math.round(clampedScroll)));
    };

    const setScrollTop = (value) => {
      const target = Math.min(metrics.maxScroll, Math.max(0, value));
      if (drag) drag.scrollTop = target;
      window.scrollTo(0, target);
      positionThumb(target);
      window.ScrollTrigger?.update();
    };

    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const viewport = window.innerHeight;
      const scrollHeight = Math.max(root.scrollHeight, document.body.scrollHeight);
      const maxScroll = Math.max(0, scrollHeight - viewport);
      const thumbHeight = maxScroll ? Math.min(viewport, Math.max(58, viewport * viewport / scrollHeight)) : viewport;
      const maxTop = Math.max(0, viewport - thumbHeight);
      const scrollTop = Math.min(maxScroll, Math.max(0, getScrollTop()));

      metrics = { maxScroll, maxTop, thumbHeight };
      thumb.style.height = `${thumbHeight}px`;
      positionThumb(scrollTop);
      bar.classList.toggle("is-hidden", maxScroll <= 0);
      bar.tabIndex = maxScroll > 0 ? 0 : -1;
      bar.setAttribute("aria-valuemax", String(Math.round(maxScroll)));
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const scrollFromPointer = (clientY) => {
      if (!drag || !metrics.maxTop) return;
      const bounds = bar.getBoundingClientRect();
      const thumbTop = Math.min(metrics.maxTop, Math.max(0, clientY - bounds.top - drag.offsetY));
      setScrollTop((thumbTop / metrics.maxTop) * metrics.maxScroll);
    };

    bar.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !metrics.maxScroll) return;
      const thumbBounds = thumb.getBoundingClientRect();
      const startedOnThumb = event.clientY >= thumbBounds.top && event.clientY <= thumbBounds.bottom;
      const currentScrollTop = getNativeScrollTop();
      drag = {
        pointerId: event.pointerId,
        offsetY: startedOnThumb ? event.clientY - thumbBounds.top : metrics.thumbHeight / 2,
        scrollTop: currentScrollTop
      };
      document.documentElement.classList.add("is-scrollbar-dragging");
      thumb.classList.add("is-dragging");
      bar.setPointerCapture?.(event.pointerId);
      scrollFromPointer(event.clientY);
      event.preventDefault();
    });
    bar.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      scrollFromPointer(event.clientY);
      event.preventDefault();
    });
    const stopDrag = (event) => {
      if (event?.pointerId !== undefined && drag && event.pointerId !== drag.pointerId) return;
      drag = null;
      document.documentElement.classList.remove("is-scrollbar-dragging");
      thumb.classList.remove("is-dragging");
      requestUpdate();
    };
    bar.addEventListener("pointerup", stopDrag);
    bar.addEventListener("pointercancel", stopDrag);
    bar.addEventListener("lostpointercapture", stopDrag);
    window.addEventListener("blur", stopDrag);
    bar.addEventListener("keydown", (event) => {
      const steps = {
        ArrowUp: -60,
        ArrowDown: 60,
        PageUp: -window.innerHeight * .85,
        PageDown: window.innerHeight * .85,
        Home: -metrics.maxScroll,
        End: metrics.maxScroll
      };
      if (!(event.key in steps)) return;
      event.preventDefault();
      setScrollTop(getScrollTop() + steps[event.key]);
    });

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("load", requestUpdate);
    window.ScrollTrigger?.addEventListener("refresh", requestUpdate);
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(requestUpdate);
      resizeObserver.observe(document.body);
      const content = document.querySelector("#smooth-content");
      if (content) resizeObserver.observe(content);
    }
  }

  function scrollToTarget(selector) {
    const target = document.querySelector(selector);
    if (!target) return;
    if (hasGSAP && window.ScrollToPlugin && !reduceMotion) window.gsap.to(window, { duration: 1, scrollTo: { y: target }, ease: "power3.inOut" });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  function bidirectionalTrigger(trigger, start = "top 88%", end = "bottom 12%") {
    return {
      trigger,
      start,
      end,
      toggleActions: "play reverse play reverse",
      invalidateOnRefresh: true
    };
  }

  function initNavbar() {
    const nav = document.querySelector(".navbar");
    const sections = [...document.querySelectorAll("main > section[data-theme]")];
    const update = () => {
      const navHeight = nav.getBoundingClientRect().height || 78;
      const probe = Math.min(window.innerHeight - 1, Math.max(1, navHeight * .5));
      const current = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= probe && rect.bottom > probe;
      });
      nav.classList.toggle("is-dark", current?.dataset.theme !== "light");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || !document.querySelector(href)) return;
      event.preventDefault();
      scrollToTarget(href);
    }));
  }

  function initMobileMenu() {
    const menu = document.querySelector(".mobile-menu");
    const open = document.querySelector(".menu-toggle");
    const close = document.querySelector(".menu-close");
    const links = [...document.querySelectorAll(".mobile-links a")];
    if (!menu || !open || !close) return;
    let timeline = null;
    if (hasGSAP && !reduceMotion) {
      timeline = window.gsap.timeline({ paused: true, defaults: { ease: "power4.out" } })
        .set(menu, { visibility: "visible", pointerEvents: "auto" })
        .to(menu, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: .75 })
        .from(links, { yPercent: 105, opacity: 0, stagger: .045, duration: .65 }, "-=.4")
        .from(".mobile-menu-foot", { y: 18, opacity: 0, duration: .5 }, "-=.45");
    }
    const show = () => {
      menu.classList.add("is-open"); menu.setAttribute("aria-hidden", "false"); open.setAttribute("aria-expanded", "true"); document.body.classList.add("menu-open");
      if (timeline) { window.gsap.set(menu, { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }); timeline.restart(); }
      close.focus({ preventScroll: true });
    };
    const hide = () => {
      const done = () => { menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true"); open.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); };
      if (timeline) timeline.reverse().eventCallback("onReverseComplete", done); else done();
    };
    open.addEventListener("click", show); close.addEventListener("click", hide); links.forEach((link) => link.addEventListener("click", hide));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && menu.classList.contains("is-open")) hide(); });
  }

  function initHero() {
    if (!hasGSAP || reduceMotion) return null;
    const title = document.querySelector(".hero-title");
    let targets = title?.children || title;
    if (window.SplitText && title) {
      const split = new window.SplitText(title, { type: "lines,words,chars", linesClass: "split-line", wordsClass: "split-word", charsClass: "hero-char" });
      targets = split.chars;
    }

    window.gsap.set(".navbar", { y: -20, opacity: 0 });
    window.gsap.set(targets, { yPercent: 105, rotationX: -65, opacity: 0, filter: "blur(16px)", transformOrigin: "50% 100%" });
    window.gsap.set(".hero-copy", { y: 25, opacity: 0 });
    window.gsap.set(".hero-actions>*", { y: 20, opacity: 0 });
    window.gsap.set(".hero-symbol", { opacity: 0, scale: .9 });

    const timeline = window.gsap.timeline({ paused: true, defaults: { ease: "power4.out" } })
      .to(targets, { yPercent: 0, rotationX: 0, opacity: 1, filter: "blur(0px)", duration: .82, stagger: .025, onComplete: () => window.gsap.set(targets, { clearProps: "transform,opacity,filter" }) }, 0)
      .to(".navbar", { y: 0, opacity: 1, duration: .55 }, 0)
      .to(".hero-symbol", { opacity: .085, scale: 1, duration: .95 }, .24)
      .to(".hero-copy", { y: 0, opacity: 1, duration: .68 }, .48)
      .to(".hero-actions>*", { y: 0, opacity: 1, stagger: .07, duration: .58 }, .58);
    if (window.ScrollTrigger) {
      window.gsap.to(".hero-symbol", { yPercent: 18, rotation: 1, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }
    return timeline;
  }

  function initReveals() {
    if (!hasGSAP || !window.ScrollTrigger || reduceMotion) return;

    const selector = [
      ".about-heading .section-title",
      ".about-heading > p:last-child",
      ".about-lead",
      ".about-card h3",
      ".about-card > p",
      ".about-card-metric strong",
      ".about-card-metric div > span",
      ".services-headline .section-title",
      ".services-headline > div > p",
      ".services-headline .text-link",
      ".service-card h3",
      ".service-card-body > p",
      ".team-heading .display-title",
      ".team-heading > p",
      ".brand-journey-header h2",
      ".brand-journey-intro",
      ".contact-heading h2",
      ".contact-heading > p:last-child",
      ".contact-panel h3",
      ".contact-steps strong",
      ".contact-steps p",
      ".footer-brand-row > p",
      ".footer-meta p"
    ].join(",");

    window.gsap.utils.toArray(selector).forEach((element) => {
      const split = window.SplitText && !element.matches(".text-link") ? new window.SplitText(element, { type: "words", wordsClass: "blur-word" }) : null;
      const isHeading = element.matches("h2,h3,strong,.section-title,.display-title,.about-lead");
      const words = split?.words?.length ? split.words : [element];

      window.gsap.set(words, { y: -42, opacity: 0, filter: "blur(10px)" });
      window.gsap.to(words, {
        keyframes: [
          { y: 5, opacity: .5, filter: "blur(5px)", duration: .35, ease: "none" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: .35, ease: "none" }
        ],
        stagger: isHeading ? .075 : .035,
        onStart: () => window.gsap.set(words, { willChange: "transform,filter,opacity" }),
        onComplete: () => window.gsap.set(words, { clearProps: "willChange" }),
        onReverseComplete: () => window.gsap.set(words, { clearProps: "willChange" }),
        scrollTrigger: bidirectionalTrigger(element)
      });
    });
  }

  function initServices() {
    const cards = [...document.querySelectorAll(".service-card")];
    cards.forEach((card) => card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty("--spot-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    }, { passive: true }));

    const galleries = cards.map((card) => ({
      card,
      images: [...card.querySelectorAll(".service-card-image")],
      activeIndex: 0
    })).filter((gallery) => gallery.images.length > 1);

    if (galleries.length && !reduceMotion) {
      const servicesGrid = document.querySelector(".services-bento");
      let servicesVisible = !window.IntersectionObserver;
      const visibilityObserver = window.IntersectionObserver && new IntersectionObserver(([entry]) => {
        servicesVisible = entry.isIntersecting;
      }, { rootMargin: "20% 0px" });

      if (servicesGrid && visibilityObserver) visibilityObserver.observe(servicesGrid);

      const cycleTimer = window.setInterval(() => {
        if (!servicesVisible || document.hidden) return;
        galleries.forEach((gallery, index) => {
          window.setTimeout(() => {
            if (!servicesVisible || document.hidden) return;
            const nextIndex = (gallery.activeIndex + 1) % gallery.images.length;
            gallery.images[gallery.activeIndex].classList.remove("is-active");
            gallery.images[nextIndex].classList.add("is-active");
            gallery.activeIndex = nextIndex;
          }, index * 260);
        });
      }, 5200);

      window.addEventListener("pagehide", () => {
        window.clearInterval(cycleTimer);
        visibilityObserver?.disconnect();
      }, { once: true });
    }

    if (!hasGSAP || !window.ScrollTrigger || reduceMotion) return;

    window.gsap.from(".about-feature", { y: 45, scale: .975, opacity: 0, duration: 1.05, ease: "power3.out", scrollTrigger: bidirectionalTrigger(".about-feature", "top 84%", "bottom 16%") });
    window.gsap.from(".about-card", {
      y: 42,
      opacity: 0,
      duration: .85,
      ease: "power3.out",
      onComplete: () => window.gsap.set(".about-card", { clearProps: "transform,opacity" }),
      scrollTrigger: bidirectionalTrigger(".about-grid", "top 86%", "bottom 14%")
    });
    window.gsap.to(".about-feature-visual img", { yPercent: -24, rotation: 14, ease: "none", scrollTrigger: { trigger: ".about-feature", start: "top bottom", end: "bottom top", scrub: true } });

    if (window.DrawSVGPlugin) {
      window.gsap.from(".about-signal-line", { drawSVG: "0%", duration: 1.6, stagger: .18, ease: "power2.inOut", scrollTrigger: bidirectionalTrigger(".about-feature-visual") });
    } else {
      window.gsap.from(".about-signal-line", { opacity: 0, duration: 1, stagger: .15, scrollTrigger: bidirectionalTrigger(".about-feature-visual") });
    }

    const servicesReveal = window.gsap.timeline({
      scrollTrigger: {
        trigger: ".services-bento",
        start: "top 92%",
        end: "top 55%",
        scrub: .6,
        invalidateOnRefresh: true
      }
    });
    servicesReveal
      .fromTo(".services-bento", { y: 52, scale: .98, transformOrigin: "50% 0%" }, { y: 0, scale: 1, duration: .97, ease: "none" }, 0)
      .fromTo(cards, { opacity: 0 }, { opacity: 1, duration: .65, stagger: .08, ease: "none" }, 0);
    window.gsap.from(".team-card", { y: 48, scale: .985, opacity: 0, stagger: .1, duration: .9, ease: "power3.out", onComplete: () => window.gsap.set(".team-card", { clearProps: "transform,opacity" }), scrollTrigger: bidirectionalTrigger(".team-grid", "top 84%", "bottom 16%") });
    window.gsap.from(".contact-panel", {
      x: () => window.matchMedia("(max-width: 700px)").matches ? 0 : 42,
      y: () => window.matchMedia("(max-width: 700px)").matches ? 32 : 0,
      scale: .975,
      opacity: 0,
      duration: 1.05,
      ease: "power3.out",
      scrollTrigger: bidirectionalTrigger(".contact-layout", "top 80%", "bottom 20%")
    });
    window.gsap.from(".contact-steps li", { y: 24, opacity: 0, stagger: .1, duration: .75, ease: "power3.out", scrollTrigger: bidirectionalTrigger(".contact-steps") });
    window.gsap.to(".contact-backdrop-symbol", { yPercent: -14, rotation: 2, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true } });
  }

  function initTeam() {
    const cards = [...document.querySelectorAll(".team-card")];
    if (!cards.length || !isTouch) return;
    if (hasGSAP && window.ScrollTrigger && !reduceMotion) {
      cards.forEach((card) => window.ScrollTrigger.create({ trigger: card, start: "top 66%", end: "bottom 34%", toggleClass: { targets: card, className: "is-active" } }));
    } else if (window.IntersectionObserver) {
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle("is-active", entry.isIntersecting)), { rootMargin: "-28% 0px -28% 0px", threshold: .15 });
      cards.forEach((card) => observer.observe(card));
    }
  }

  function initBrandJourney() {
    const section = document.querySelector(".brand-journey");
    const cards = [...(section?.querySelectorAll(".brand-pillar-card") || [])];
    if (!section || !cards.length || !hasGSAP || !window.ScrollTrigger || reduceMotion) return;

    let cardsReveal = null;
    const resetCards = () => {
      cardsReveal?.kill();
      cardsReveal = null;
      window.gsap.set(cards, { y: 64, scale: .975, opacity: 0 });
    };
    const revealCards = () => {
      cardsReveal?.kill();
      cardsReveal = window.gsap.fromTo(cards,
        { y: 64, scale: .975, opacity: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: .8,
          stagger: { each: .13, from: "start" },
          ease: "power3.out",
          onComplete: () => window.gsap.set(cards, { clearProps: "transform,opacity" })
        }
      );
    };

    resetCards();
    window.ScrollTrigger.create({
      trigger: ".brand-pillars-grid",
      start: "top 86%",
      end: "bottom 14%",
      onEnter: revealCards,
      onEnterBack: revealCards,
      onLeave: resetCards,
      onLeaveBack: resetCards,
      invalidateOnRefresh: true
    });

    window.gsap.to(".brand-journey-mark", {
      yPercent: -14,
      rotation: 2,
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
    });
  }

  function initBrandPosterTabs() {
    const section = document.querySelector(".brand-poster");
    const tabs = [...(section?.querySelectorAll(".brand-poster-tabs li") || [])];
    if (!section || !tabs.length || isTouch) return;

    const focusCard = document.createElement("span");
    focusCard.className = "brand-poster-tab-focus-card";
    focusCard.setAttribute("aria-hidden", "true");
    document.body.appendChild(focusCard);

    let focusedTab = null;
    let focusFrame = 0;

    const setFocusOrigin = (tab) => {
      const label = tab.querySelector("span");
      if (!label) return;
      const rect = label.getBoundingClientRect();
      focusCard.textContent = label.textContent;
      focusCard.style.setProperty("--tab-origin-x", `${rect.left + rect.width / 2}px`);
      focusCard.style.setProperty("--tab-origin-y", `${rect.top + rect.height / 2}px`);
      focusCard.style.setProperty("--tab-origin-width", `${rect.width}px`);
      focusCard.style.setProperty("--tab-origin-height", `${rect.height}px`);
    };

    const focusTab = (tab) => {
      window.cancelAnimationFrame(focusFrame);
      focusedTab = tab;
      tabs.forEach((item) => item.classList.toggle("is-focused", item === tab));
      setFocusOrigin(tab);
      focusCard.classList.remove("is-visible");
      focusCard.getBoundingClientRect();
      section.classList.add("is-tab-focused");
      focusFrame = window.requestAnimationFrame(() => focusCard.classList.add("is-visible"));
    };

    const releaseTab = (tab) => {
      if (focusedTab !== tab) return;
      window.cancelAnimationFrame(focusFrame);
      focusedTab = null;
      tab.classList.remove("is-focused");
      section.classList.remove("is-tab-focused");
      focusCard.classList.remove("is-visible");
    };

    tabs.forEach((tab) => {
      tab.addEventListener("mouseenter", () => focusTab(tab));
      tab.addEventListener("mouseleave", () => releaseTab(tab));
    });

    window.addEventListener("resize", () => {
      if (focusedTab) setFocusOrigin(focusedTab);
    });
  }

  function initCursor() {
    if (isTouch || !window.matchMedia("(hover: hover)").matches) return;
    const cursor = document.querySelector(".cursor"); const label = cursor?.querySelector("span"); if (!cursor || !label) return;
    let mx = -100, my = -100, x = -100, y = -100;
    window.addEventListener("mousemove", (event) => { mx = event.clientX; my = event.clientY; }, { passive: true });
    const render = () => { x += (mx - x) * .18; y += (my - y) * .18; cursor.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`; requestAnimationFrame(render); }; render();
    document.querySelectorAll("[data-cursor]").forEach((item) => { item.addEventListener("mouseenter", () => { label.textContent = item.dataset.cursor; cursor.classList.add("is-view"); }); item.addEventListener("mouseleave", () => cursor.classList.remove("is-view")); });
    document.querySelectorAll("a,button").forEach((item) => { item.addEventListener("mouseenter", () => cursor.classList.add("is-button")); item.addEventListener("mouseleave", () => cursor.classList.remove("is-button")); });
  }

  function initMagnetic() {
    if (isTouch || reduceMotion || !hasGSAP) return;
    document.querySelectorAll(".magnetic").forEach((button) => { button.addEventListener("mousemove", (event) => { const rect = button.getBoundingClientRect(); window.gsap.to(button, { x: (event.clientX - rect.left - rect.width / 2) * .1, y: (event.clientY - rect.top - rect.height / 2) * .14, duration: .35, ease: "power3.out" }); }); button.addEventListener("mouseleave", () => window.gsap.to(button, { x: 0, y: 0, duration: .6, ease: "power3.out" })); });
  }

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const serviceInputs = [...form.querySelectorAll('input[name="Serviços[]"]')];
    const servicesFieldset = form.querySelector(".contact-services");
    const servicesError = form.querySelector(".contact-field-error");
    const submitButton = form.querySelector('[type="submit"]');
    const submitLabel = form.querySelector("[data-submit-label]");
    const status = form.querySelector(".contact-form-status");

    const validateServices = (showError = false) => {
      const isValid = serviceInputs.some((input) => input.checked);
      servicesFieldset?.classList.toggle("has-error", showError && !isValid);
      if (servicesError) servicesError.hidden = !showError || isValid;
      return isValid;
    };

    serviceInputs.forEach((input) => input.addEventListener("change", () => validateServices(true)));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!validateServices(true)) {
        serviceInputs[0]?.focus();
        return;
      }

      const formData = new FormData(form);
      const selectedServices = serviceInputs.filter((input) => input.checked).map((input) => input.value);
      formData.delete("Serviços[]");
      formData.append("Serviços desejados", selectedServices.join(", "));
      submitButton.disabled = true;
      submitLabel.textContent = "Enviando...";
      status.textContent = "";
      status.className = "contact-form-status";

      try {
        const response = await fetch("https://formsubmit.co/ajax/bowstudiorioclaro@gmail.com", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success === false || result.success === "false") throw new Error("Falha no envio");

        form.reset();
        validateServices(false);
        status.textContent = "Projeto enviado com sucesso para a BØW!";
        status.classList.add("is-success");
      } catch (error) {
        status.textContent = "Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.";
        status.classList.add("is-error");
      } finally {
        submitButton.disabled = false;
        submitLabel.textContent = "Enviar projeto";
      }
    });
  }

  function setupCanvas(canvas) {
    if (!canvas) return null; const context = canvas.getContext("2d"); const state = { width: 0, height: 0, dpr: Math.min(devicePixelRatio || 1, 1.5) };
    const resize = () => { const rect = canvas.getBoundingClientRect(); state.width = rect.width; state.height = rect.height; canvas.width = Math.round(rect.width * state.dpr); canvas.height = Math.round(rect.height * state.dpr); context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0); }; resize(); window.addEventListener("resize", resize); return { context, state };
  }

  function initDotField() {
    const canvas = document.querySelector(".dot-field"); if (!canvas || reduceMotion) return; const setup = setupCanvas(canvas); if (!setup) return; const { context, state } = setup; const mouse = { x: -999, y: -999 }; let visible = true;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas.parentElement);
    canvas.parentElement.addEventListener("pointermove", (event) => { mouse.x = event.clientX; mouse.y = event.clientY; }, { passive: true }); canvas.parentElement.addEventListener("pointerleave", () => { mouse.x = -999; mouse.y = -999; });
    const draw = () => { if (visible && !document.hidden) { context.clearRect(0, 0, state.width, state.height); const gap = state.width < 600 ? 27 : 32; for (let py = gap; py < state.height; py += gap) for (let px = gap; px < state.width; px += gap) { const dx = px - mouse.x, dy = py - mouse.y, distance = Math.hypot(dx, dy), influence = Math.max(0, 1 - distance / 210), shift = influence * 11; context.beginPath(); context.arc(px + (distance ? dx / distance : 0) * shift, py + (distance ? dy / distance : 0) * shift, .72 + influence * 1.35, 0, Math.PI * 2); context.fillStyle = `rgba(255,255,255,${.16 + influence * .42})`; context.fill(); } } requestAnimationFrame(draw); }; draw();
  }

  function initParticles() {
    const canvas = document.querySelector(".particles-canvas"); if (!canvas || reduceMotion) return; const setup = setupCanvas(canvas); if (!setup) return; const { context, state } = setup; let particles = [], visible = false; const pointer = { x: -999, y: -999 };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas.parentElement);
    const build = () => { particles = Array.from({ length: Math.min(55, Math.max(24, Math.floor(state.width / 28))) }, () => ({ x: Math.random() * state.width, y: Math.random() * state.height, vx: (Math.random() - .5) * .07, vy: (Math.random() - .5) * .07, radius: Math.random() * .8 + .3, alpha: Math.random() * .22 + .06 })); }; build(); window.addEventListener("resize", build);
    canvas.parentElement.addEventListener("pointermove", (event) => { const rect = canvas.getBoundingClientRect(); pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; }, { passive: true });
    const draw = () => { if (visible && !document.hidden) { context.clearRect(0, 0, state.width, state.height); particles.forEach((p) => { const dx = p.x - pointer.x, dy = p.y - pointer.y, distance = Math.hypot(dx, dy); if (distance < 100 && distance) { p.x += dx / distance * .07; p.y += dy / distance * .07; } p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = state.width; if (p.x > state.width) p.x = 0; if (p.y < 0) p.y = state.height; if (p.y > state.height) p.y = 0; context.beginPath(); context.arc(p.x, p.y, p.radius, 0, Math.PI * 2); context.fillStyle = `rgba(255,255,255,${p.alpha})`; context.fill(); }); } requestAnimationFrame(draw); }; draw();
  }
});
