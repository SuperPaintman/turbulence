<script lang="ts">
  /* Imports */
  import { onDestroy, onMount } from 'svelte';
  import { TabManager } from '~/common/tab-manager';
  import { SearchEngine, FoundTab } from '~/common/search-engine';
  import Header from '~/common/Header.svelte';
  import Tab from '~/common/Tab.svelte';
  import type { DeepReadonlyArray } from '~/common/util';

  /* Types */
  type Tab = FoundTab & {
    selected: boolean;
  };

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
        for (let i = 0, ii = foundTabs.length; i < ii; i++) {
          if (foundTabs[i].tab.id === id) {
            foundTabs[i].selected = !foundTabs[i].selected;
            break;
          }
        }
        break;
    }
  }

  function count<T>(arr: Array<T>, fn: (el: T) => boolean): number {
    let res = 0;
    for (const el of arr) {
      if (fn(el)) {
        res++;
      }
    }
    return res;
  }

  function splitTabsByWindows(
    allTabs: DeepReadonlyArray<chrome.tabs.Tab>,
    foundTabs: ReadonlyArray<Tab>
  ): Array<{
    windowId: string;
    windowIndex: number;
    tabs: ReadonlyArray<Tab>;
    count: number;
    selected: number;
  }> {
    const map: {
      [windowId: string]: {
        index: number;
        tabs: Tab[];
        count: 0;
      };
    } = {};

    let windowIndex = 0;
    for (const foundTab of foundTabs) {
      map[foundTab.tab.windowId] ??= {
        index: windowIndex++,
        tabs: [],
        count: 0
      };
      map[foundTab.tab.windowId].tabs.push(foundTab);
    }

    for (const tab of allTabs) {
      map[tab.windowId] ??= {
        index: windowIndex++,
        tabs: [],
        count: 0
      };
      map[tab.windowId].count++;
    }

    const res = [];
    for (const [windowId, data] of Object.entries(map)) {
      if (data.tabs.length === 0) {
        continue;
      }

      res.push({
        windowId,
        windowIndex: data.index,
        tabs: data.tabs,
        count: data.count,
        selected: count(data.tabs, ({ selected }) => selected)
      });
    }

    return res;
  }

  const tabManager = new TabManager();
  const searchEngine = new SearchEngine();

  function searchAndSelect(
    allTabs: DeepReadonlyArray<chrome.tabs.Tab>,
    input: string
  ): ReadonlyArray<Tab> {
    const { tabs, emptySearch } = searchEngine.search(allTabs, input);

    if (!emptySearch) {
      for (const tab of tabs as ReadonlyArray<Tab>) {
        tab.selected = true;
      }
    }

    return tabs as ReadonlyArray<Tab>;
  }

  let searchWord: string = '';
  $: foundTabs = searchAndSelect($tabManager, searchWord);
  $: tabsInWindows = splitTabsByWindows($tabManager, foundTabs);

  function handleRemoveSelected() {
    const ids: number[] = [];
    for (const foundTab of foundTabs) {
      const { id, selected } = foundTab.tab;

      if (id !== undefined && selected) {
        ids.push(id);
      }
    }

    if (ids.length > 0) {
      browser.tabs.remove(ids);
    }
  }

  onMount(() => {
    browser.tabs.query({}, tabManager.sync);
    tabManager.addListeners(browser.tabs);
  });

  onDestroy(() => {
    tabManager.removeListeners(browser.tabs);
  });
</script>

<div class="popup">
  <Header bind:search={searchWord} on:clickRemove={handleRemoveSelected} />

  <div class="windows">
    {#each tabsInWindows as tabsInWindow (tabsInWindow.windowId)}
      <div class="window">
        <div class="window-title">
          <b>Window {tabsInWindow.windowIndex + 1}</b> ({tabsInWindow.count} tabs,
          {tabsInWindow.selected}
          selected)
        </div>

        <div class="tabs">
          {#each tabsInWindow.tabs as { tab, highlight, selected } (tab.id)}
            <Tab
              id={tab.id}
              title={tab.title}
              url={tab.url}
              favIconUrl={tab.favIconUrl}
              active={tab.active}
              {selected}
              titleHighlightRanges={highlight.title ?? []}
              urlHighlightRanges={highlight.url ?? []}
              on:click={handleTabClick}
            />
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if foundTabs.length === 0}
    <div class="zero-state">No tabs</div>
  {/if}
</div>

<style>
  @import '../common/config.css';

  :global(body) {
    width: 640px;
    overflow-x: hidden;
  }

  .window-title {
    padding: 16px 32px;
    margin-top: 24px;
  }

  :global(body.dark) .window-title {
    background: color(var(--color-dark-bg) shade(15%));
  }

  @media (prefers-color-scheme: dark) {
    :global(body:not(.light)) .window-title {
      background: color(var(--color-dark-bg) shade(15%));
    }
  }

  .window:first-child .window-title {
    margin-top: 8px;
  }

  .zero-state {
    padding: 32px;

    font-size: 18px;
    font-weight: 700;
  }
</style>
