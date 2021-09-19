export function inject(scriptPath: string) {
  const el = document.createElement("script");
  el.src = scriptPath;
  el.type = "text/javascript";
  document.head.appendChild(el);
  return el;
}
