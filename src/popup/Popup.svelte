<script lang="ts">
  import browser from "webextension-polyfill";

  async function openInHolodex() {
    const tab = await browser.tabs.query({ active: true, currentWindow: true });
    const id = tab[0].id;
    browser.tabs.executeScript(id, {
      code: `window.location.host = "holodex.net"`,
    });
  }
</script>

<span>Hello, popup!</span>
<button type="button" on:click={() => openInHolodex()}>Open in Holodex</button>
<button type="button" on:click={() => browser.runtime.openOptionsPage()}>
  Options
</button>

<style>
  span {
    font-size: 14px;
    font-weight: 500;
    color: white;
    background-color: black;
  }
</style>
