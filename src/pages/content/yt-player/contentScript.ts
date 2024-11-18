/* eslint-disable no-inner-declarations */
import { inject, Options, sha1, validOrigin } from "@src/utils";
import injectPath from "./injectPlayer?script&module";

const videoId = window.location.pathname.split("/").slice(-1)[0];
if (videoId) {
  console.log(inject, injectPath);
  inject(injectPath);
  // alternate:
  function injectScript(content: () => void) {
    const script = document.createElement("script");
    script.textContent = `
    (${content.toString()})();
  `;
    (document.head || document.documentElement).appendChild(script);
  }

  function modifyYouTubeConfig() {
    // @ts-expect-error "ytcfg" is a YT global
    const currentConfig = window.ytcfg.d();

    const resilienceOptimizations = {
      // Core network resilience
      network_polling_interval: 15000, // Reduced from 30000 for faster recovery
      enable_variable_timeout_web: true,
      innertube_request_limit_ms: 5000, // Increased from 3000 for more retry time

      // Player bootstrap and recovery
      player_bootstrap_method: true,
      kevlar_continue_playback_without_player_response: true,
      enable_frontend_queue_recover: true,
      enable_player_entities_middleware: true,

      // Enhanced error handling
      log_errors_through_nwl_on_retry: true,
      enable_servlet_streamz: true,
      enable_servlet_errors_streamz: true,

      // Connection monitoring
      web_foreground_heartbeat_interval_ms: 14000, // Reduced from 28000 for faster detection
      enable_is_extended_monitoring: true,

      // Player state management
      kevlar_player_check_ad_state_on_stop: true,
      kevlar_player_new_bootstrap_adoption: true,

      // Request handling optimizations
      gel_queue_timeout_max_ms: 60000, // Increased from default for longer retry windows
      get_async_timeout_ms: 90000, // Increased for longer async operations

      // Additional resilience features
      enable_active_view_display_ad_renderer_web_home: true,
      enable_async_ab_enf: true,
      enable_client_streamz_web: true,
      enable_service_ajax_csn: true,

      // Recovery mechanisms
      kevlar_frontend_queue_recover: true,
      web_player_move_autonav_toggle: true,
      web_player_vimio_use_shared_monitor: true,

      // Enhanced playback stability
      html5_recognize_predict_start_cue_point: true,
      html5_report_supports_vp9_encoding: true,
      html5_server_stitched_dai_group: true,

      // State persistence
      enable_persistent_device_token: true,
      enable_client_sli_logging: true,

      // Performance optimizations
      compress_gel: true,
      defer_overlays: true,
      defer_rendering_outside_visible_area: true,

      // Buffer management
      max_prefetch_window_sec_for_livestream_optimization: 20, // Doubled from 10
      min_prefetch_offset_sec_for_livestream_optimization: 30, // Increased from 20

      // Retry logic
      ytidb_remake_db_retries: 3, // Increased from 1
      ytidb_reopen_db_retries: 2, // Increased from 0
      slow_compressions_before_abandon_count: 8, // Doubled from 4

      // Network handling
      networkless_logging: true,
      nwl_send_fast_on_unload: true,
      use_new_in_memory_storage: true,
      use_session_based_sampling: true,
    };
    // Preserve existing config while updating specific flags
    const updatedFlags = {
      ...currentConfig.EXPERIMENT_FLAGS,
      ...resilienceOptimizations,
      // network_polling_interval: 15000,
      // html5_delayed_retry_count: 3,
      // html5_delayed_retry_delay_ms: 2000,
      // live_chunk_readahead: 5,
      // // Additional reliability settings you might want to modify
      // html5_live_abr_head_miss_fraction: 0.0,
      // html5_streaming_xhr_time_based_consolidation_ms: 1000,
      // html5_max_headm_for_streaming_xhr: 0,
      // html5_min_readbehind_secs: 3,
      // html5_min_startup_buffered_media_duration_for_live_secs: 0.5,
      // html5_subsegment_readahead_target_buffer_health_secs: 1.0,
      // html5_subsegment_readahead_timeout_secs: 3.0,
    };
    console.log(JSON.stringify(currentConfig, null, 2));

    // @ts-expect-error "ytcfg" is a YT global
    window.ytcfg.set({
      ...currentConfig,
      EXPERIMENT_FLAGS: updatedFlags,
    });

    // @ts-expect-error "ytcfg" is a YT global
    console.log(JSON.stringify(window.ytcfg.d(), null, 2));
  }

  // Inject the script
  injectScript(modifyYouTubeConfig);
}
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
