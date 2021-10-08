import { ipc, inject } from "../util";

inject("content/holodex-flag.inject.js");

function showSnackbar({ timeout = 2000, color = "", text = ""}) {
  const container = document.querySelector("#app");
  const snackbar = document.createElement("div");
  snackbar.className = "v-snack v-snack--active v-snack--bottom v-snack--has-background";
  snackbar.style.paddingBottom = "0px"; 
  snackbar.style.paddingTop = "64px";

  const snackbarWrapper = document.createElement("div");
  snackbarWrapper.className = `v-snack__wrapper v-sheet theme--dark ${color}`;
  
  const snackbarContent = document.createElement("div");
  snackbarContent.className = "v-snack__content";
  snackbarContent.textContent = text;
  snackbarWrapper.appendChild(snackbarContent);

  snackbar.appendChild(snackbarWrapper);
  container?.append(snackbar);

  setTimeout(() => {
    snackbar.remove();
  }, timeout);
}

ipc.on("liked", () => {
  showSnackbar({ color: "success", text: "Sucessfully liked video" });
});


ipc.on("failed", () => {
  showSnackbar({ color: "error", text: "Failed to like video" });
});