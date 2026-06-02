export const NEWTAB_NAVIGATED_EVENT = 'newtab:navigated' as const;

export function notifyNewtabNavigated() {
  window.dispatchEvent(new CustomEvent(NEWTAB_NAVIGATED_EVENT));
}

