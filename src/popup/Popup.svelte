<span>Hello, popup!</span>
<button type="button" on:click={() => chrome.runtime.openOptionsPage()}>
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
