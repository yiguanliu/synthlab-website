// Lightweight scroll-reveal + diagram animation. No deps, IntersectionObserver-based.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
  // --- Scroll reveal ---
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // --- Diagram: auto-cycling highlighted step ---
  const diagram = document.querySelector("[data-diagram]");
  if (!diagram) return;

  const steps = Array.from(diagram.querySelectorAll("[data-diagram-step]"));
  const fill = diagram.querySelector("[data-diagram-fill]");
  if (!steps.length) return;

  const STEP_MS = 2600;
  let active = 0;
  let timer = null;
  let running = false;

  function setActive(i) {
    steps.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
    if (fill) {
      fill.style.transition = "none";
      fill.style.width = `${(i / steps.length) * 100}%`;
      // force reflow so the next transition runs
      void fill.offsetWidth;
      fill.style.transition = `width ${STEP_MS}ms linear`;
      requestAnimationFrame(() => {
        fill.style.width = `${((i + 1) / steps.length) * 100}%`;
      });
    }
  }

  function tick() {
    setActive(active);
    active = (active + 1) % steps.length;
    timer = setTimeout(tick, STEP_MS);
  }

  function start() {
    if (running) return;
    running = true;
    if (reduceMotion) {
      setActive(0);
      return;
    }
    tick();
  }

  function stop() {
    running = false;
    if (timer) clearTimeout(timer);
  }

  const sectionIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
    },
    { threshold: 0.35 }
  );
  sectionIO.observe(diagram);

  // Pause on hover/focus so users can read at their own pace
  diagram.addEventListener("mouseenter", stop);
  diagram.addEventListener("mouseleave", () => {
    if (diagram.getBoundingClientRect().top < window.innerHeight) start();
  });
});
