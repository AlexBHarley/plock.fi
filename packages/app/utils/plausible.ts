export function plausible(event: string, props?: any) {
  // @ts-ignore
  if (window.plausible) {
    // @ts-ignore
    window.plausible(arguments);
  }
  // @ts-ignore
  (window.plausible.q = window.plausible.q || []).push(arguments);
}
