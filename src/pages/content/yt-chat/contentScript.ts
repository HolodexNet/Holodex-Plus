import { inject, validOrigin } from "@utils";
import injectPath from "./inject?script&module";
import { ProtoframePubsub } from "protoframe";
import { tlsyncProtocol } from "./tlsyncProtocol";

inject(injectPath);

// chrome.scripting.executeScript({
//   target: { tabId: currentTabId },
//   files: ["content/yt-chat-overrides.inject.js"],
// });

// Re-emit events from wrong origins
window.addEventListener("message", (event) => {
  if (validOrigin(event.origin)) {
    window.postMessage(event.data, "*");
  }
});

//---------------------------------------   SYNC TRANSLATION   -------------------------------------------
// Targets for sending translation automation
let SendButtonElement: HTMLButtonElement | null = null;
let InputTextField: HTMLInputElement | null = null;

// Create a status span to display information
const spn = Object.assign(document.createElement("p"), {
  textContent: "Looking for the chatbox...",
  onmouseover(evt: MouseEvent) {
    (evt.target as HTMLElement).style.opacity = "1";
  },
  onmouseout(evt: MouseEvent) {
    (evt.target as HTMLElement).style.opacity = "0.4";
  },
});
spn.style.color = "white";
spn.style.opacity = "0.4";
spn.style.width = "calc(100% - 32px)";
spn.style.position = "absolute";
spn.style.textAlign = "center";

// Container for the extension UI
const ExtContainer = Object.assign(document.createElement("div"), {
  id: "Extcontainer",
});
ExtContainer.appendChild(spn);

/**
 * Sends text to the input field and triggers the send button.
 * @param {string} inputtext - The text to send.
 */
function SendTextEnter(inputtext: string) {
  if (!InputTextField || !SendButtonElement) {
    console.error("SendTextEnter called but InputTextField or SendButtonElement is not set.");
    return;
  }
  console.debug("Sending text:", inputtext);

  InputTextField.textContent = inputtext.replaceAll('\\"', '"');
  InputTextField.dispatchEvent(new InputEvent("input"));
  setTimeout(() => {
    SendButtonElement?.click();
    console.info("Text sent successfully.");
  }, 50);
}

/**
 * Sets up the state by locating necessary DOM elements.
 * @returns {boolean} True if setup is successful, otherwise false.
 */
function setupState(): boolean {
  console.debug("Setting up state...");
  SendButtonElement = document.querySelector("#send-button button");
  InputTextField = document.querySelector("#input.yt-live-chat-text-input-field-renderer");

  if (!SendButtonElement || !InputTextField) {
    console.warn("Failed to locate chatbox elements.");
    spn.textContent = "Holodex+ TL Relay [⚠️cannot find message input]";
    return false;
  } else {
    console.info("Chatbox elements located successfully.");
    spn.textContent = "Holodex+ TL Relay [✅Connected]";
    return true;
  }
}

/**
 * Attaches event listeners to enable chat relay functionality.
 */
function LatchChatBox() {
  console.debug("Latching onto chatbox...");
  if (setupState() && SendButtonElement && InputTextField) {
    window.addEventListener("message", Bouncer);
    console.info("Chatbox latched and message listener attached.");
  } else {
    console.error("Failed to latch onto chatbox.");
  }
}

/**
 * Handles incoming messages from valid origins.
 * @param {MessageEvent} e - The message event.
 */
function Bouncer(e: MessageEvent) {
  if (!validOrigin(e.origin)) {
    console.warn("Invalid origin:", e.origin);
    return;
  }

  if (e.data.n === "HolodexSync") {
    console.debug("Received HolodexSync message:", e.data);
    if (InputTextField) {
      SendTextEnter(e.data.d);
    } else {
      console.error("InputTextField is not set.");
    }
  }
}

/**
 * Initializes the extension by attempting to attach to the chatbox.
 * @param {MessageEvent} e - The message event.
 */
function Initializator(e: MessageEvent) {
  if (!validOrigin(e.origin)) {
    // console.warn("Invalid origin during initialization:", e.origin);
    return;
  }

  if (e.data.n === "HolodexSync" && e.data.d === "Initiate") {
    console.info("HolodexSync initiation received.");
    let attempts = 0;
    const intervalId = setInterval(() => {
      attempts++;
      const target = document.getElementById("chat-messages");

      if (target) {
        console.info("Chatbox found, setting up UI.");
        const prevExtContainer = document.getElementById("Extcontainer");
        if (prevExtContainer) {
          prevExtContainer.parentNode?.removeChild(prevExtContainer);
          console.debug("Removed previous extension container.");
        }
        target.prepend(ExtContainer);
        window.removeEventListener("message", Initializator);
        LatchChatBox();
        clearInterval(intervalId);
      }

      if (attempts >= 30) {
        console.error("Failed to locate chatbox after 30 attempts.");
        clearInterval(intervalId);
      }
    }, 1000);
  }
}

/**
 * Entry point for the extension.
 */
function Load() {
  if (window.location !== parent.location) {
    console.info("Adding Initializator event listener.");
    window.addEventListener("message", Initializator);
  } else {
    console.debug("Skipping load; not in an iframe.");
  }
}

// Initialize the extension
Load();

// ProtoframePubsub Manager
const manager = ProtoframePubsub.iframe(tlsyncProtocol);

manager.handleAsk(
  "initiate",
  async (body): Promise<{ state: "ok" | "failed" }> => {
    console.info(
      "Holodex+ TL Sync Initiation Requested:",
      body,
      "at",
      new Date(),
    );

    if (body?.info) {
      console.debug("Additional initiation info:", body.info);
    }

    const tgt = document.getElementById("chat-messages");
    if (tgt && !tgt.contains(ExtContainer)) {
      tgt.prepend(ExtContainer);
      console.debug("Extension container prepended to chat-messages.");
    }

    if (setupState()) {
      console.info("Initialization successful.");
      return { state: "ok" };
    } else {
      console.error("Initialization failed.");
      return { state: "failed" };
    }
  },
);

manager.handleTell("sendMessage", (body) => {
  console.info("Received message to send:", body.text, "at", new Date());
  SendTextEnter(body.text);
});
