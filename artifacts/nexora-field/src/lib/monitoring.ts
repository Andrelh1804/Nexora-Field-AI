declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    clarity: (...args: unknown[]) => void;
  }
}

function loadScript(src: string, id: string): void {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}

export function initGA4(measurementId: string): void {
  if (!measurementId || measurementId === "undefined") return;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, "ga4-script");
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true });
}

export function initClarity(projectId: string): void {
  if (!projectId || projectId === "undefined") return;
  (function (c: Window, l: Document, a: string, r: string, i: string) {
    (c as unknown as Record<string, unknown>)[a] =
      (c as unknown as Record<string, unknown>)[a] ||
      function (...args: unknown[]) {
        ((c as unknown as Record<string, unknown[]>)[a + "q"] =
          (c as unknown as Record<string, unknown[]>)[a + "q"] || []).push(args);
      };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = "https://www.clarity.ms/tag/" + i;
    const y = l.getElementsByTagName(r)[0];
    y.parentNode!.insertBefore(t, y);
  })(window, document, "clarity", "script", projectId);
}

export function initSentry(dsn: string): void {
  if (!dsn || dsn === "undefined") return;
  loadScript(
    "https://browser.sentry-cdn.com/8.0.0/bundle.min.js",
    "sentry-script"
  );
  const waitForSentry = setInterval(() => {
    if (typeof (window as unknown as Record<string, unknown>).Sentry !== "undefined") {
      clearInterval(waitForSentry);
      const Sentry = (window as unknown as Record<string, { init: (opts: Record<string, unknown>) => void }>).Sentry;
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.2,
        replaysOnErrorSampleRate: 1.0,
      });
    }
  }, 200);
}

export function trackPageView(path: string): void {
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", { page_path: path });
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

export function initMonitoring(): void {
  const ga4Id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (ga4Id) initGA4(ga4Id);
  if (clarityId) initClarity(clarityId);
  if (sentryDsn) initSentry(sentryDsn);
}
