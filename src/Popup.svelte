<script lang="ts">
  /* Imports */
  import { onMount } from 'svelte';
  import Tab from './Tab.svelte';

  /* Init */
  if (!browser) {
    (browser as any) = chrome;
  }

  const enum Button {
    Left = 0,
    Middle = 1,
    Right = 2
  }

  function handleTabClick(
    e: CustomEvent<{
      id: number | undefined;
      button: number;
      altKey: boolean;
      ctrlKey: boolean;
      shiftKey: boolean;
    }>
  ) {
    const { id, button } = e.detail;
    if (id === undefined) {
      return;
    }

    switch (button) {
      case Button.Left:
        browser.tabs.update(id, {
          active: true
        });
        break;

      case Button.Middle:
        browser.tabs.remove(id);
        break;

      case Button.Right:
        break;
    }
  }

  $: tabs = [] as chrome.tabs.Tab[];

  onMount(() => {
    browser.tabs.query({}, (ts) => {
      tabs = ts;
    });
  });
</script>

<div>
  <h1>Tabs</h1>
  <div>
    {#each tabs as tab (tab.id)}
      <Tab
        id={tab.id}
        title={tab.title}
        url={tab.url}
        favIconUrl={tab.favIconUrl}
        on:click={handleTabClick}
      />
    {/each}
  </div>
</div>
