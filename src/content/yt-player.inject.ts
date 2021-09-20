import { inject, sha1 } from "../util";
import browser from "webextension-polyfill";

const id = window.location.pathname.split("/").slice(-1)[0];
if (id) {
  inject(browser.runtime.getURL("content/yt-player-overrides.inject.js"));
  browser.runtime.sendMessage(browser.runtime.id, { id, type: "loaded" });
}

function like(videoId: string) {
  return new Promise<Response>((resolve, reject) => {
    let req = new XMLHttpRequest();
    req.open("GET", `https://www.youtube.com/watch?v=${videoId}`);
    req.send();
    req.onload = async () => {
      console.log(req.responseText);
      const apiKey = req.responseText.match(/"INNERTUBE_API_KEY":"(.*?)"/)?.[1];
      const context = JSON.parse(
        (req.responseText.match(/\(\{"INNERTUBE_CONTEXT":([\w\W]*?)\}\)/) ||
          req.responseText.match(/"INNERTUBE_CONTEXT":([\w\W]*?\}),"INNERTUBE/))?.[1] || "{}"
      );
      const ytClientName = req.responseText.match(/"INNERTUBE_CONTEXT_CLIENT_NAME":(\d+),/)?.[1];
      const ytClientVersion = req.responseText.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"(.*?)"/)?.[1];
      const pageId = req.responseText.match(/"DELEGATED_SESSION_ID":"(.*?)"/)?.[1];
      const likeParams = req.responseText.match(/"likeParams":"(.*?)"/)?.[1];
      const likeVideoData = {
        context: {
          ...context,
          request: {
            ...context.request,
            consistencyTokenJars: [],
            internalExperimentFlags: [],
          },
        },
        target: { videoId },
        params: likeParams,
      };
      const sidStart = document.cookie.indexOf("__Secure-3PAPISID=") + "__Secure-3PAPISID=".length;
      const sidEnd = sidStart + document.cookie.substring(sidStart).indexOf(";");
      const PAPISID = document.cookie.substring(sidStart, sidEnd);
      const nowTime = Math.floor(Date.now() / 1000);

      console.log("[Holodex+] data", context, "out", likeVideoData);

      // TODO: get the low-hanging fruit: sec-fetch-mode, etc.
      // TODO: adSignalsInfo
      // TODO: clickTrackingParams
      // TODO: missing fields in 'client'

      fetch(`https://www.youtube.com/youtubei/v1/like/like?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-AuthUser": "0",
          "X-Goog-Visitor-Id": context.client.visitorData,
          "X-Goog-PageId": pageId!,
          "X-Youtube-Client-Name": ytClientName!,
          "X-Youtube-Client-Version": ytClientVersion!,
          "X-Origin": "https://www.youtube.com",
          Authorization: `SAPISIDHASH ${nowTime}_${await sha1(`${nowTime} ${PAPISID} https://www.youtube.com`)}`,
        },
        body: JSON.stringify(likeVideoData),
      }).then(async (res) => {
        const text = await res.text();
        if (
          res.status === 200 &&
          (text.includes("Added to Liked videos") || text.includes("Removed from Liked videos"))
        ) {
          resolve(res);
        } else {
          reject(res);
        }
      });
    };
  });
}

if (window.confirm("Like video?")) {
  like(id).then(() => window.alert("Liked!"));
}
