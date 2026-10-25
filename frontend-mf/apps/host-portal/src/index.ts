// Polyfill process in browser runtime
if (typeof window !== "undefined") {
  (window as any).process = (window as any).process || { env: {} };
}

import("./bootstrap");
