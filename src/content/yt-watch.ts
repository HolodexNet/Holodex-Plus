import { Options } from "src/util";

(async () => {
  if (!(await Options.get("openInHolodexButton"))) return;

  function openHolodex() {
    const currentUrl = new URL(window.location.href);
    const videoID = currentUrl.searchParams.get("v");
    const t = currentUrl.searchParams.get("t");
    const holodexUrl = `https://holodex.net/watch/${videoID}${t ? `?t=${t}` : ''}`;
    window.open(holodexUrl);
  }

  const element = document.querySelector("#top-level-buttons-computed");
  const icon3 = `
  <svg class="yt-watch-holodex-icon" viewBox="10.646699905395508 4.526976108551025 18.35555076599121 17.86052703857422" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.7109 19.1446L13.7109 13.4572L13.7109 7.76991L14.6989 8.36834V13.4572L14.6989 18.5462L13.7109 19.1446ZM14.3575 22.0797C14.8429 22.4335 15.5224 22.5127 16.1107 22.1563L28.2404 14.8093C29.2562 14.1941 29.2562 12.7204 28.2404 12.1051L16.1107 4.75813C15.5224 4.40181 14.8429 4.48096 14.3574 4.8348L25.1328 11.3615C25.2107 11.4087 25.2848 11.4591 25.355 11.5125L27.7285 12.9502C28.1095 13.1809 28.1095 13.7336 27.7285 13.9643L25.3552 15.4018C25.2849 15.4553 25.2108 15.5058 25.1328 15.553L14.3575 22.0797Z"></path>
    <path d="M10.6467 13.4572L10.6467 6.11021C10.6467 5.26342 11.5722 4.74193 12.2965 5.18064L24.4262 12.5276C25.1245 12.9506 25.1245 13.9638 24.4262 14.3868L12.2965 21.7338C11.5722 22.1725 10.6467 21.651 10.6467 20.8042L10.6467 13.4572Z" stroke-width="0.987994"></path>
  </svg>
  `
  const button = `
  <a style="text-decoration: none; cursor: pointer;" target="_blank">
    <div class="yt-watch-holodex-btn">
      ${icon3}
      <span> Holodex </span>
    </div>
  </a>
  `;
  element?.insertAdjacentHTML('afterend', button);
  const el = document.querySelector(".yt-watch-holodex-btn");
  // @ts-ignore
  el && el.addEventListener("click", openHolodex);
})();