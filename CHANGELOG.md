# v0.2

Thanks Lbmaian for majority of these fixes.

- Fix regression where Holodex button wasn't matching channel/video ids beginning and/or ending in a dash (-)
- Fix regression where @handle channels were being treated as channel/video ids if they had exactly 24 or 11, respectively, characters
- Holodex button for YT homepage and feeds (e.g. subscription, history, library) go to Holodex homepage
- Clicking Holodex button injected in watch page now ensures newly opened tab is focused (already happens when clicking the Holodex button extension icon)
- Simplify/revamp Holodex button internals such that now a single message is sent from background to content script
- More reliable access to yt* global vars fallback for page data (used for getting Holodex URL) via injected page script
- Misc other minor chances to improve reliability and performance

- Disabled Youtube Chat memory leak fix as youtube has already fixed it themselves.



# v0.0.4

- Bounce translation to youtube / twitch livechat in tlclient.
- Proxy control iframe video player in script editor.
- Improve "Open Holodex" on extension icon click, supports channel pages
- Add option to open holodex in new tab or same tab