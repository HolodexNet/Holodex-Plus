import { validOrigin } from "../util";
var parentOrigin: string = "";

function TransmitTime(vid: any) {
  if (parent) {
      setInterval(() => {
          parent.postMessage({
              n: "SyncHolodex",
              d: vid.currentTime*1000
            }, parentOrigin);
      }, 33);
  }
}

function OpenReceiver(vid: any) {
  window.addEventListener('message', (e) => {
      if (validOrigin(e.origin)) {
          if (e.data.n == "HolodexSync") {
              switch (e.data.d) {
                  case "s":
                      vid.play();
                      break;
                  
                  case "p":
                      vid.pause();
                      break;
                  
                  case "w":
                      if (vid.paused) {
                          vid.play();
                      } else {
                          vid.pause();
                      }
                      break;

                  default:
                      if (typeof e.data.d == 'number'){
                          vid.currentTime += e.data.d/1000;
                      }
                      break;
              }
          }
      }
  });
}

function Initializator(e : any) {
  if (validOrigin(e.origin)) {
    if (e.data.n == "HolodexSync") {
      if (e.data.d == "TC") {
        parentOrigin = e.origin;
        var i = 0;
        const intv = setInterval(() => {
            i++;
            if (document.getElementsByTagName('video').length > 0) {
                TransmitTime(document.getElementsByTagName('video')[0]);
                OpenReceiver(document.getElementsByTagName('video')[0]);
                clearInterval(intv);
            } 
            if (i == 30){
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