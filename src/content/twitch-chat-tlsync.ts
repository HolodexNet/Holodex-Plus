//---------------------------------------   BOUNCING TRANSLATION   -------------------------------------------
//   BOUNCING INCOMING MESSAGE TO THE LIVE CHAT SUBMITTER 
var sendBtn: any; 
var ChatText: any;
var ChatInputPanel;

function SendTextEnter(inputtext: string){
	ChatText.value = inputtext.replaceAll("\\\"", "\"");
	var evt = document.createEvent("Events");
	evt.initEvent("change", true, true);
	ChatText.dispatchEvent(evt);
	sendBtn.click();
}

function LatchChatBox(){
	ChatText = null;
	sendBtn = null;

	var testT = document.getElementsByTagName('textarea');
	for (var i = 0; i < testT.length; i++) {
		if (!testT[i].getAttribute("data-a-target")){
			continue;
		} else if (testT[i].getAttribute("data-a-target")?.indexOf("chat-input") != -1) {
			ChatText = testT[i];
			break;
		}
	}

	var testB = document.getElementsByTagName('button');
	for (var i = 0; i < testB.length; i++) {
		if (!testB[i].getAttribute("data-a-target")){
			continue;
		} else if (testB[i].getAttribute("data-a-target")?.indexOf("chat-send-button") != -1) {
			sendBtn = testB[i];
			break;
		}
	}	

	if ((ChatText != null) && (sendBtn != null)){
        spn.textContent = "Synced and ready.";
        window.addEventListener('message', Bouncer);
	} else {
		spn.textContent = "Can't find Live Chat Input";
	}
}
//=============================================================================================================

import { validOrigin } from "../util";

var ChatElementTarget = "chat-room-header-label";

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