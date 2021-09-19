export function inject(scriptPath: string) {
  const el = document.createElement("script");
  el.src = scriptPath;
  el.type = "text/javascript";
  document.head.appendChild(el);
  return el;
}

export function entries<T>(object: T): [keyof T, T[keyof T]][] {
  return Object.entries(object) as any;
}

export function splitOnUpperCase(text: string): string[] {
  const result = new Array<string>();
  let s = 0;
  for (let i = 0; i < text.length; ++i) {
    if (text[i].toUpperCase() === text[i]) {
      result.push(text.substring(s, i));
      s = i;
    }
  }
  if (text.length - s > 1) result.push(text.substring(s));
  return result;
}

export * from "./storage";
