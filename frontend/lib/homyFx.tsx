'use client';

import { useEffect, useRef } from 'react';

/** Adds .is-in to the element when it enters the viewport (once). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('hr');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/**
 * Child-stagger reveal: adds .hr to the container and .hrc to each child of
 * the grid (selector), so cards cascade in one after another when in view.
 */
export function useStagger<T extends HTMLElement>(selector = '.hrc-auto') {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('hr');
    const children = el.querySelectorAll<HTMLElement>(selector);
    children.forEach((child, i) => {
      child.classList.add('hrc');
      child.style.setProperty('--stagger', `${Math.min(i, 8) * 90}ms`);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, [selector]);
  return ref;
}

/** Pointer tilt: sets --rx/--ry CSS vars on hover. */
export function useTilt<T extends HTMLElement>(max = 4) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add('homy-tilt');
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
    };
    const leave = () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [max]);
  return ref;
}

/**
 * Magnetic hover: element drifts toward the cursor and springs back on leave.
 * Attach to CTA buttons for the Framer-style magnetic feel.
 */
export function useMagnet<T extends HTMLElement>(strength = 0.28) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    el.classList.add('homy-magnet');
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.setProperty('--mx', `${(dx * strength).toFixed(1)}px`);
      el.style.setProperty('--my', `${(dy * strength).toFixed(1)}px`);
    };
    const leave = () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [strength]);
  return ref;
}

/**
 * Custom cursor: a soft dot + trailing ring that follows the pointer and
 * morphs (grows / shows a label) over interactive elements. Huge-style.
 * Elements opt in via data-cursor="View" | "Play" | "Drag" etc.
 */
export function useCursor() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    const label = document.createElement('span');
    label.className = 'cursor-label';
    ring.appendChild(label);
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add('has-cursor');

    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    const onMove = (e: PointerEvent) => { x = e.clientX; y = e.clientY; };
    const loop = () => {
      // ring lerps toward pointer for the trailing feel
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = `translate(${x}px,${y}px)`;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      raf = requestAnimationFrame(loop);
    };

    const onOver = (e: Event) => {
      const t = (e.target as HTMLElement).closest('[data-cursor], a, button, summary, .property-image');
      const tagged = (e.target as HTMLElement).closest('[data-cursor]') as HTMLElement | null;
      if (tagged) {
        ring.classList.add('is-label');
        label.textContent = tagged.getAttribute('data-cursor') || '';
      } else if (t) {
        ring.classList.add('is-active');
        ring.classList.remove('is-label');
      } else {
        ring.classList.remove('is-active', 'is-label');
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
      dot.remove(); ring.remove();
      document.body.classList.remove('has-cursor');
    };
  }, []);
}

/**
 * Smooth scroll: disabled in favour of the browser's native smooth scrolling
 * (CSS `scroll-behavior: smooth`), which never fights the user. The previous
 * wheel-hijack implementation caused "hard" / frozen scrolling, so we keep
 * this as a no-op to preserve the call site.
 */
export function useSmoothScroll() {
  // Intentionally empty — native smooth scroll is used instead.
}

/** Counts a number from 0 to target when the element scrolls into view. */
export function useCountUp(target: number, durationMs = 1400) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { el.textContent = target.toLocaleString('en-NG'); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / durationMs, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-NG');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, durationMs]);
  return ref;
}

/**
 * SplitWords — masked word-by-word rise, the signature Framer headline effect.
 * Each word is wrapped in an overflow-hidden span; inner spans translate up
 * with a cascade when the parent section gets .is-in (or immediately in the
 * hero via .homy-hero). Falls back to plain text with reduced motion.
 */
export function SplitWords({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ');
  return (
    <span className={`split-words ${className}`.trim()} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="sw-mask" aria-hidden={true}>
          <span className="sw-word" style={{ transitionDelay: `${i * 55}ms` }}>{word}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * Wide-tracked, letter-spaced subline under section headings — mirrors the
 * "letter-by-letter" spaced captions on the reference design.
 */
export function SpacedLine({ text }: { text: string }) {
  return <p className="homy-spaced" aria-label={text}>{text}</p>;
}
