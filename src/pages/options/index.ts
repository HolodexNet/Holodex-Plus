import { entries } from "@src/utils";
import { Options } from "@src/utils/options";
import "@assets/styles/tailwind.css";

const HelpIcon = () => `
<svg class="w-4 h-4 text-gray-400 hover:text-red-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
</svg>`;

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("options") as HTMLFormElement;
  if (!form) return;

  // Add base styles to form
  form.className = "max-w-2xl mx-auto p-6 space-y-4 bg-gray-900 text-gray-100";

  // Add title
  const title = document.createElement("h1");
  title.className = "text-2xl font-bold text-red-500 mb-6";
  title.textContent = "Extension Options";
  form.prepend(title);

  for (const [name, defaultValue] of entries(Options.schema())) {
    if (typeof defaultValue !== "boolean") continue;

    const container = document.createElement("div");
    container.className =
      "flex items-center justify-between p-4 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors";

    // Label section
    const labelSection = document.createElement("div");
    labelSection.className = "flex items-center space-x-2";

    const text = document.createElement("span");
    text.className = "text-gray-200";
    text.textContent = Options.description(name) || name;

    labelSection.appendChild(text);

    // Add tooltip if description exists
    // const desc = Options.description(name);
    // if (desc) {
    //   const tooltip = document.createElement("div");
    //   tooltip.className = "relative group";

    //   const helpIconWrapper = document.createElement("div");
    //   helpIconWrapper.classList.add("absolute", "left-1/2", "-translate-x-1/2", "bottom-full", "mb-2");
    //   helpIconWrapper.innerHTML = HelpIcon();
    //   tooltip.appendChild(helpIconWrapper);

    //   const tooltipText = document.createElement("div");
    //   tooltipText.className =
    //     "invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-700 text-sm text-gray-200 rounded-lg whitespace-nowrap";
    //   tooltipText.textContent = desc;
    //   tooltip.appendChild(tooltipText);

    //   labelSection.appendChild(tooltip);
    // }

    container.appendChild(labelSection);

    // Toggle switch
    const switchContainer = document.createElement("label");
    switchContainer.className =
      "relative inline-flex items-center cursor-pointer";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "sr-only peer";
    input.checked = (await Options.get(name)) ?? defaultValue;
    input.addEventListener("change", () => Options.set(name, input.checked));

    const slider = document.createElement("div");
    slider.className = `
      w-11 h-6 
      bg-gray-600 
      peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 
      rounded-full peer 
      peer-checked:after:translate-x-full 
      peer-checked:after:border-white 
      after:content-[''] 
      after:absolute 
      after:top-[2px] 
      after:left-[2px] 
      after:bg-white 
      after:border-gray-300 
      after:border 
      after:rounded-full 
      after:h-5 
      after:w-5 
      after:transition-all 
      peer-checked:bg-red-600
    `;

    switchContainer.appendChild(input);
    switchContainer.appendChild(slider);
    container.appendChild(switchContainer);

    form.appendChild(container);
  }
});
