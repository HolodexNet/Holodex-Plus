// Fix theme not following query param on archive chat
const darkThemeParam = new URLSearchParams(window.location.search).get("dark_theme");
if (darkThemeParam === "1") {
  document.querySelector("html")?.setAttribute("dark", "");
} else if (darkThemeParam === "0") {
  document.querySelector("html")?.removeAttribute("dark");
}

console.log("[Holodex+] live chat overrides injected");

export {};
