<script lang="ts">
  /* Imports */
  import Tab from '~/common/Tab.svelte';

  /* Types */
  type Range = [start: number, end: number];
  type Tab = Partial<chrome.tabs.Tab> & {
    selected?: boolean;
    titleHighlightRanges?: Range[];
    urlHighlightRanges?: Range[];
  };

  $: tabs = [
    {
      id: 1,
      title: 'Test',
      url: 'https://example.com'
    },
    {
      id: 2,
      title: 'GitHub',
      url: 'https://github.com/',
      favIconUrl: 'https://github.com/favicon.ico',
      active: true
    },
    {
      id: 3,
      title: 'Google',
      url: 'https://google.com/',
      favIconUrl: 'https://google.com/favicon.ico',
      selected: true
    },
    {
      id: 4,
      title: 'TypeScript: TSConfig Reference - Docs on every TS',
      url: 'https://www.typescriptlang.org/tsconfig#paths',
      favIconUrl: 'https://www.typescriptlang.org/favicon.ico'
    }
  ] as Tab[];

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
        for (let i = 0, ii = tabs.length; i < ii; i++) {
          tabs[i].active = tabs[i].id === id;
        }
        break;

      case Button.Middle:
        tabs = tabs.filter((tab) => tab.id !== id);
        break;

      case Button.Right:
        for (let i = 0, ii = tabs.length; i < ii; i++) {
          if (tabs[i].id === id) {
            tabs[i].selected = !tabs[i].selected;
            break;
          }
        }
        break;
    }
  }
</script>

<div class="root">
  {#each tabs as tab (tab.id)}
    <Tab
      id={tab.id}
      title={tab.title}
      url={tab.url}
      favIconUrl={tab.favIconUrl}
      active={tab.active}
      selected={tab.selected}
      showUrl
      titleHighlightRanges={tab.titleHighlightRanges}
      urlHighlightRanges={tab.urlHighlightRanges}
      on:click={handleTabClick}
    />
  {/each}
</div>

<style>
  .root {
    width: 100%;
  }
</style>
