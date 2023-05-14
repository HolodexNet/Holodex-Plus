# v0.2

Thanks lbmaian for majority of these fixes.

- "Open Holodex" extension icon click now:
  - works for the new YT @channel and shorts pages (also opens first video for playlist pages)
  - works for any URL (whether YT or not) that has 24-character id (channel) or 11-character id (video)
  - does nothing when already on a Holodex page
  - ensures new tab is opened next to current tab (and same tab group if applicable)
  - fixed certain edge cases
- "Open Holodex" button inserted under video in YT watch page now:
  - fixed for the current YT layout
  - respects the "Open holodex in new tab" option
- Remove obsolete YT chat memory leak fix


# v0.0.4

- Bounce translation to youtube / twitch livechat in tlclient.
- Proxy control iframe video player in script editor.
- Improve "Open Holodex" on extension icon click, supports channel pages
- Add option to open holodex in new tab or same tab