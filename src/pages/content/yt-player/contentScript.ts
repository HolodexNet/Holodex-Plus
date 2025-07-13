/* eslint-disable no-inner-declarations */
import { Options, sha1, validOrigin } from "@src/utils";
// import injectPath from "./injectPlayer?script&module";

const videoId = window.location.pathname.split("/").slice(-1)[0];

// TODO: Optimize fetch audio, or move to a TLSync specific extension
// if (videoId) {
//   console.log(inject, injectPath);
//   inject(injectPath);
// }

window.addEventListener("message", async (event) => {
  if (validOrigin(event.origin)) {
    if (event.data?.event === "likeVideo") {
      if (!(await Options.get("remoteYoutubeLikeButton"))) return;
      console.log("[Holodex+] Liking the video");
      const res = await like();

      // Show an indicator based on the response
      const indicator = document.createElement("div");
      indicator.style.position = "fixed";
      indicator.style.bottom = "20px";
      indicator.style.right = "20px";
      indicator.style.padding = "10px 20px";
      indicator.style.borderRadius = "5px";
      indicator.style.color = "white";
      indicator.style.fontSize = "14px";
      indicator.style.zIndex = "9999";
      indicator.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      indicator.style.transition = "opacity 0.3s ease-in-out";
      indicator.style.opacity = "1";

      if (res) {
        indicator.style.backgroundColor = "#4CAF50"; // Green for success
        indicator.innerText = "Video liked!";
      } else {
        indicator.style.backgroundColor = "#F44336"; // Red for failure
        indicator.innerText = "Failed to like the video.";
      }

      document.body.appendChild(indicator);

      // Remove the indicator after 3 seconds
      setTimeout(() => {
        indicator.style.opacity = "0";
        setTimeout(() => indicator.remove(), 300); // Wait for fade-out transition
      }, 3000);
    }
  }
});

async function getYtLikeData() {
  const doc = await fetch(`https://www.youtube.com/watch?v=${videoId}`).then(
    (r) => r.text()
  );
  const apiKey = doc.match(/"INNERTUBE_API_KEY":"(.*?)"/)?.[1];
  const context = JSON.parse(
    (doc.match(/\(\{"INNERTUBE_CONTEXT":([\w\W]*?)\}\)/) ||
      doc.match(/"INNERTUBE_CONTEXT":([\w\W]*?\}),"INNERTUBE/))?.[1] ?? "{}"
  );
  const ytClientName = doc.match(/"INNERTUBE_CONTEXT_CLIENT_NAME":(\d+),/)?.[1];
  const ytClientVersion = doc.match(
    /"INNERTUBE_CONTEXT_CLIENT_VERSION":"(.*?)"/
  )?.[1];
  const pageId = doc.match(/"DELEGATED_SESSION_ID":"(.*?)"/)?.[1];
  const likeParams = doc.match(/"likeParams":"(.*?)"/)?.[1];
  const removeLikeParams = doc.match(/"removeLikeParams":"(.*?)"/)?.[1];
  const PAPISID = document.cookie.match(/3PAPISID=([^;]*);?.*$/)?.[1];
  if (
    !apiKey ||
    Object.keys(context).length === 0 ||
    !ytClientName ||
    !ytClientVersion ||
    // !pageId ||
    !likeParams ||
    !PAPISID
  ) {
    return null;
  }
  return {
    apiKey,
    context,
    ytClientName,
    ytClientVersion,
    pageId,
    likeParams,
    removeLikeParams,
    PAPISID,
  };
}

async function like() {
  const ytLikeData = await getYtLikeData();
  if (!ytLikeData) return false;
  const {
    apiKey,
    context,
    pageId,
    ytClientName,
    ytClientVersion,
    PAPISID,
    likeParams,
  } = ytLikeData;
  const nowTime = Math.floor(Date.now() / 1000);
  try {
    const res = await fetch(
      `https://www.youtube.com/youtubei/v1/like/like?key=${apiKey}`,
      {
        method: "POST",
        referrer: `https://youtube.com/watch?v=${videoId}`,
        mode: "same-origin",
        referrerPolicy: "origin-when-cross-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-AuthUser": "0",
          "X-Goog-Visitor-Id": context.client.visitorData,
          ...(pageId && { "X-Goog-PageId": pageId }),
          "X-Youtube-Client-Name": ytClientName,
          "X-Youtube-Client-Version": ytClientVersion,
          "X-Origin": "https://www.youtube.com",
          "SEC-CH-UA-ARCH": "x86",
          "sec-ch-ua-platform-version": "10.0.0",
          "sec-ch-ua-full-version": "93.0.4577.82",
          Authorization: `SAPISIDHASH ${nowTime}_${await sha1(
            `${nowTime} ${PAPISID} https://www.youtube.com`
          )}`,
        },
        body: JSON.stringify({
          context,
          target: { videoId },
          params: likeParams,
        }),
      }
    ).then(async (r) => ({ status: r.status, body: await r.text() }));
    if (res.status === 200) {
      return true;
    }
  } catch (e) {
    console.error("[Holodex+] Error while sending like:", e);
  }
  return false;
}
