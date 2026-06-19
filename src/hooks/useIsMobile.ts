import { useSyncExternalStore } from "react";

// SSR-safe viewport hook (useSyncExternalStore avoids setState-in-effect + window-at-render).
export function useIsMobile(bp = 768): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => window.innerWidth <= bp,
    () => false, // server default
  );
}
