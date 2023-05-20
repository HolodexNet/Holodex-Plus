import { validOrigin } from "../util";
import { ProtoframePubsub } from "protoframe";
import { tlsyncProtocol } from "./tlsync_comm";

//---------------------------------------   SYNC TRANSLATION   -------------------------------------------

// Targets for sending translation automation
var SendButtonElement: any;
var InputTextField: any;

var spn = Object.assign(document.createElement("p"), {
  textContent: "Looking for the chatbox...",
  style: {
    fontSize: "15px",
    background: "black",
    color: "white",
    margin: "3px 10px 3px 10px",
    width: "100%",
    textAlign: "center",
  },
});
var ExtContainer = Object.assign(document.createElement("div"), { id: "Extcontainer" });
ExtContainer.appendChild(spn);

function SendTextEnter(inputtext: string) {
  InputTextField.textContent = inputtext.replaceAll('\\"', '"');
  InputTextField.dispatchEvent(new InputEvent("input"));
  SendButtonElement.click();
}

function setupState(): boolean {
  SendButtonElement = document.querySelector("#send-button button");
  InputTextField = document.querySelector("#input.yt-live-chat-text-input-field-renderer");
  if (SendButtonElement == null || InputTextField == null) {
    spn.textContent = "Can't find message input.";
    return false;
  } else {
    spn.textContent = "Synced and ready.";
    return true;
  }
}

function LatchChatBox() {
  // legacy route.
  setupState();
  if (SendButtonElement && InputTextField) {
    window.addEventListener("message", Bouncer);
  }
}
//=============================================================================================================

function Bouncer(e: any) {
  if (validOrigin(e.origin)) {
    if (e.data.n == "HolodexSync") {
      if (InputTextField) {
        SendTextEnter(e.data.d);
      }
    }
  }
}

function Initializator(e: any) {
  if (validOrigin(e.origin)) {
    if (e.data.n == "HolodexSync") {
      if (e.data.d == "Initiate") {
        var i = 0;
        const intv = setInterval(() => {
          i++;
          var target = document.getElementById("chat-messages");
          if (target != null) {
            // reset the previous
            const prevExtContainer = document.getElementById("Extcontainer");
            if (prevExtContainer) {
              prevExtContainer.parentNode?.removeChild(prevExtContainer);
            }

            target.prepend(ExtContainer);
            window.removeEventListener("message", Initializator);
            LatchChatBox();
            clearInterval(intv);
          }
          if (i == 30) {
            clearInterval(intv);
          }
        }, 1000);
      }
    }
  }
}

function Load() {
  if (window.location != parent.location) {
    window.addEventListener("message", Initializator);
  }
}

Load();

const manager = ProtoframePubsub.iframe(tlsyncProtocol);

manager.handleAsk("initiate", (body): Promise<{ state: "ok" | "failed" }> => {
  console.log("Holodex+ TL Sync Initiation Requested in frame ", window.location, new Date());
  if (body?.info) console.debug(body.info);

  if (setupState()) {
    return Promise.resolve({ state: "ok" });
  } else {
    return Promise.resolve({ state: "failed" });
  }
});

manager.handleTell("sendMessage", (body) => {
  console.log("Holodex+ TL Sync Relay Received Message of:", body.text, "in frame", window.location, "at", new Date());
  SendTextEnter(body.text);
});

