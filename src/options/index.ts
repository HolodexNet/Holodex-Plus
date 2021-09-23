import { entries, Options, OptionsSchema, OptionsDescription, splitOnUpperCase, svg } from "../util";
import { mdiHelp } from "@mdi/js";

(async () => {
  const form = document.getElementById("options") as HTMLFormElement;

  for (const [name, defaultValue] of entries(OptionsSchema)) {
    if (typeof defaultValue === "boolean") {
      const container = document.createElement("div");

      const text = document.createElement("span");
      text.appendChild(
        new Text(
          splitOnUpperCase(name)
            .map((f, i) => (i === 0 ? f.substring(0, 1).toUpperCase() + f.substring(1) : f.toLowerCase()))
            .join(" ")
        )
      );
      if (OptionsDescription[name]) {
        text.innerHTML += `
          <div class="tooltip">
            ${svg(mdiHelp, "help-icon tooltip-anchor")}
            <div class="tooltip-text">${OptionsDescription[name]}</div>
          </div>
        `;
      }
      container.appendChild(text);

      const switchContainer = document.createElement("div");
      switchContainer.className = "switch";
      container.appendChild(switchContainer);

      const input = document.createElement("input");
      input.id = `field-${name}`;
      input.type = "checkbox";
      input.className = "switch-input";
      input.checked = (await Options.get(name)) ?? false;
      input.addEventListener("change", () => Options.set(name, input.checked));
      switchContainer.appendChild(input);

      const label = document.createElement("label");
      label.htmlFor = input.id;
      label.className = "switch-label";
      label.textContent = name;
      switchContainer.appendChild(label);

      form.appendChild(container);
    }
  }
})();
