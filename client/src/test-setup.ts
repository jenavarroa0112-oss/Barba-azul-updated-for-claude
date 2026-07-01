// This setup file is loaded for both server (node environment) and client
// (jsdom environment) tests — see vitest.config.ts. jest-dom's matchers are
// safe to register unconditionally (they don't touch `window` at import
// time); the polyfills below are jsdom-only and are guarded accordingly.
import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined") {  // jsdom doesn't implement these, but Radix UI (used by our shadcn
  // components) checks for them. Without these polyfills, several
  // components throw during render in a test environment even though they
  // work fine in a real browser.

  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  if (!("ResizeObserver" in window)) {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    // @ts-expect-error - jsdom has no ResizeObserver
    window.ResizeObserver = MockResizeObserver;
  }

  if (!("IntersectionObserver" in window)) {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    // @ts-expect-error - jsdom has no IntersectionObserver
    window.IntersectionObserver = MockIntersectionObserver;
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  if (!("hasPointerCapture" in Element.prototype)) {
    // @ts-expect-error - jsdom has no pointer capture support
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!("setPointerCapture" in Element.prototype)) {
    // @ts-expect-error - jsdom has no pointer capture support
    Element.prototype.setPointerCapture = () => {};
  }
  if (!("releasePointerCapture" in Element.prototype)) {
    // @ts-expect-error - jsdom has no pointer capture support
    Element.prototype.releasePointerCapture = () => {};
  }
}
