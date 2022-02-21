//---------------------------------------   BOUNCING TRANSLATION   -------------------------------------------
//   BOUNCING INCOMING MESSAGE TO THE LIVE CHAT SUBMITTER 
var sendBtn: any;
var ChatText: any;

function SendTextEnter(inputtext: string){
	ChatText.textContent = inputtext.replaceAll("\\\"", "\"");
	ChatText.dispatchEvent(new InputEvent("input"));
	sendBtn.click();
}

function LatchChatBox(){
	sendBtn = document.querySelector("#send-button button",); 
	ChatText = document.querySelector("#input.yt-live-chat-text-input-field-renderer",);
	if ((sendBtn == null) || (ChatText == null)) {
		spn.textContent = "Can't find message input.";
	} else {
        spn.textContent = "Synced and ready.";
        window.addEventListener('message', Bouncer);
    }
}
//=============================================================================================================

import { validOrigin } from "../util";

var ChatElementTarget = "chat-messages";

var spn = document.createElement('p');
spn.textContent = "Looking for the chatbox...";
spn.style.fontSize = '15px';
spn.style.background = 'black';
spn.style.color = 'white';
spn.style.margin = '3px 10px 3px 10px';
spn.style.width = "100%"
spn.style.textAlign = "center";

var ExtContainer = document.createElement('div');
ExtContainer.id = "Extcontainer";
ExtContainer.appendChild(spn);

function Bouncer(e : any) {
  if (validOrigin(e.origin)) {
    if (e.data.n == "HolodexSync") {
      if (ChatText) {
        SendTextEnter(e.data.d);
      }
    }
  }
}

function Initializator(e : any) {
  if (validOrigin(e.origin)) {
    if (e.data.n == "HolodexSync") {
      if (e.data.d == "Initiate") {
        var i = 0;
        const intv = setInterval(() => {
            i++;
            var target = document.getElementById(ChatElementTarget);
            if (target != null){
                if (document.getElementById("Extcontainer") != null){
                    var ExtcontainerTemp = document.getElementById("Extcontainer");
                    if (ExtcontainerTemp != null) {
                      ExtcontainerTemp.parentNode?.removeChild(ExtcontainerTemp);
                    }                    
                }
                target.prepend(ExtContainer);
                window.removeEventListener('message', Initializator);
                LatchChatBox();
                clearInterval(intv);
            } if (i == 30){
                clearInterval(intv);
            }
        }, 1000);
      }
    }
  }
}

function Load() {
  if (window.location != parent.location) {
    window.addEventListener('message', Initializator);
  }
}

Load();