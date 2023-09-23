import { entries, Options, splitOnUpperCase, svg } from "../util";
import { mdiHelp } from "@mdi/js";

(async () => {
  const form = document.getElementById("options") as HTMLFormElement;

  for (const [name, defaultValue] of entries(Options.schema())) {
    if (typeof defaultValue === "boolean") {
      const container = document.createElement("div");

      const text = document.createElement("span");
      text.appendChild(
        new Text(
          splitOnUpperCase(name)
            .map((f, i) => (i === 0 ? f.substring(0, 1).toUpperCase() + f.substring(1) : f.toLowerCase()))
            .join(" ")
            .replace("like", "Like")
            .replace("holodex", "Holodex")
            .replace("youtube", "YouTube")
        )
      );
      const desc = Options.description(name);
      if (desc) {
        const tooltip = document.createElement("div");
        tooltip.className = "tooltip";

        const icon = svg(mdiHelp, "help-icon tooltip-anchor");
        tooltip.appendChild(icon);

        const tooltipText = document.createElement("div");
        tooltipText.className = "tooltip-text";
        tooltipText.appendChild(new Text(desc));
        tooltip.appendChild(tooltipText);

        text.appendChild(tooltip);
      }
      container.appendChild(text);

      const switchContainer = document.createElement("div");
      switchContainer.className = "switch";

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

      container.appendChild(switchContainer);

      form.appendChild(container);
    }
  }
})();
