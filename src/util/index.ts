(["info", "warn", "error", "debug"] as const).forEach((fn) => {
  const orig = console[fn].bind(console);
  console[fn] = (...args: any[]) => orig("[Holodex+]", ...args);
});

export function inject(scriptPath: string) {
  const el = document.createElement("script");
  el.src = scriptPath;
  el.type = "text/javascript";
  document.head.appendChild(el);
  return el;
}
