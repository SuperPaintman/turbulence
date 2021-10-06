<script lang="ts">
  /* Imports */
  import { onDestroy, onMount } from 'svelte';
  import Header from '~/common/Header.svelte';
  import Tab from '~/common/Tab.svelte';

  /* Types */
  type Range = [start: number, end: number];
  type Tab = chrome.tabs.Tab & {
    selected: boolean;
    titleHighlightRanges?: Range[];
    urlHighlightRanges?: Range[];
  };
  type Where = {
    title: boolean;
    url: boolean;
  };

  function fuzzySearch(
    needle: string,
    haystack: string
  ): { found: boolean; positions: Range[] } {
    if (needle.length > haystack.length) {
      return { found: false, positions: [] };
    }

    if (needle.length === haystack.length && needle === haystack) {
      return { found: true, positions: [[0, needle.length]] };
    }

    let i = 0;
    let j = 0;
    let start = -1;
    let end = -1;

    const positions: Range[] = [];

    outer: while (i < needle.length) {
      const nch = needle[i++].toLowerCase();

      while (j < haystack.length) {
        const pos = j;
        const hch = haystack[j++].toLowerCase();

        if (nch === hch) {
          if (start === -1) {
            start = pos;
          }

          end = pos + 1;

          continue outer;
        } else {
          if (start !== -1) {
            positions.push([start, end]);
          }

          start = -1;
          end = -1;
        }
      }

      return { found: false, positions };
    }

    if (start !== -1) {
      positions.push([start, end]);
    }

    return { found: true, positions };
  }

  function exactSearch(
    needle: string,
    haystack: string
  ): { found: boolean; positions: Range[] } {
    if (needle.length === 0) {
      return { found: true, positions: [] };
    }

    const pos = haystack.toLowerCase().indexOf(needle.toLowerCase());
    if (pos === -1) {
      return { found: false, positions: [] };
    }

    return { found: true, positions: [[pos, pos + needle.length]] };
  }

  function regexpSearch(
    needle: RegExp,
    haystack: string
  ): { found: boolean; positions: Range[] } {
    const match = needle.exec(haystack);
    if (match === null) {
      return { found: false, positions: [] };
    }

    return {
      found: true,
      positions: [[match.index, match.index + match[0].length]]
    };
  }

  function detectSearchAlgo(
    needle: string
  ): (haystack: string) => { found: boolean; positions: Range[] } {
    if (needle[0] === "'") {
      needle = needle.slice(1);
      return (haystack) => exactSearch(needle, haystack);
    }

    if (needle[0] === '/') {
      needle = needle.slice(1);

      try {
        const re = new RegExp(needle, 'i');

        return (haystack) => regexpSearch(re, haystack);
      } catch {}
    }

    // Escape ' and /.
    if (needle[0] === '\\') {
      if (needle[1] === '\\' || needle[1] === "'" || needle[1] === '/') {
        needle = needle.slice(1);
      }
    }

    return (haystack) => fuzzySearch(needle, haystack);
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
        for (let i = 0, ii = tabs.length; i < ii; i++) {
          if (tabs[i].id === id) {
            tabs[i].selected = !tabs[i].selected;
            break;
          }
        }
        break;
    }
  }

  function matchTab(
    tab: chrome.tabs.Tab,
    search: (haystack: string) => { found: boolean; positions: Range[] },
    searchWord: string,
    where: Where
  ): Tab | null {
    const newTab: Tab = { ...tab, selected: false };

    let found = false;

    if (where.title && tab.title) {
      const titleMatch = search(tab.title);

      if (titleMatch.found) {
        found = true;
        newTab.titleHighlightRanges = titleMatch.positions;
      }
    }

    if (where.url && tab.url) {
      const urlMatch = search(tab.url);

      if (urlMatch.found) {
        found = true;
        newTab.urlHighlightRanges = urlMatch.positions;
      }
    }

    if (!found) {
      return null;
    }

    newTab.selected = searchWord.length > 0;

    return newTab;
  }

  function detectWhere(searchWord: string): {
    searchWord: string;
    where: Where;
  } {
    if (searchWord[0] !== ':') {
      return {
        searchWord,
        where: {
          title: true,
          url: true
        }
      };
    }

    searchWord = searchWord.slice(1); // Eat first :

    let idx = searchWord.indexOf(':');
    let found = false;
    const where: Where = { title: false, url: false };

    loop: while (idx !== -1) {
      const field = searchWord.slice(0, idx);

      switch (field) {
        case 'title':
          found = true;
          where.title = true;
          searchWord = searchWord.slice(idx + 1);
          break;

        case 'url':
          found = true;
          where.url = true;
          searchWord = searchWord.slice(idx + 1);
          break;

        default:
          break loop;
      }

      idx = searchWord.indexOf(':');
    }

    if (!found) {
      return {
        searchWord,
        where: {
          title: true,
          url: true
        }
      };
    }

    return {
      searchWord,
      where
    };
  }

  function filterTabs(tabs: chrome.tabs.Tab[], input: string): Tab[] {
    const { searchWord, where } = detectWhere(input);
    const search = detectSearchAlgo(searchWord);
    const res: Tab[] = [];

    for (const tab of tabs) {
      const newTab = matchTab(tab, search, searchWord, where);

      if (newTab !== null) {
        res.push(newTab);
      }
    }

    return res;
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
    allTabs: chrome.tabs.Tab[],
    tabs: Tab[]
  ): Array<{
    windowId: string;
    windowIndex: number;
    tabs: Tab[];
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
    for (const tab of tabs) {
      map[tab.windowId] ??= {
        index: windowIndex++,
        tabs: [],
        count: 0
      };
      map[tab.windowId].tabs.push(tab);
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
        selected: count(data.tabs, (tab) => tab.selected)
      });
    }

    return res;
  }

  let searchWord: string = '';
  $: allTabs = [] as chrome.tabs.Tab[];
  $: tabs = filterTabs(allTabs, searchWord);
  $: tabsInWindows = splitTabsByWindows(allTabs, tabs);

  function handleBrowserTabsCreated(tab: chrome.tabs.Tab) {
    allTabs.push(tab);
    allTabs.sort((a, b) => a.index - b.index);
  }

  function handleBrowserTabsUpdate(
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ) {
    // Mark the old tab (in this window) as deactiveted.
    if (tab.active) {
      for (let i = 0, ii = allTabs.length; i < ii; i++) {
        if (allTabs[i].windowId === tab.windowId) {
          allTabs[i].active = false;
        }
      }
    }

    for (let i = 0, ii = allTabs.length; i < ii; i++) {
      if (allTabs[i].id === tabId) {
        allTabs[i] = tab;
        allTabs.sort((a, b) => a.index - b.index);
        return;
      }
    }
  }

  function handleBrowserTabsRemoved(
    tabId: number,
    removeInfo: chrome.tabs.TabRemoveInfo
  ) {
    allTabs = allTabs.filter((tab) => tab.id !== tabId);
  }

  function handleRemoveSelected() {
    const ids: number[] = [];
    for (const tab of tabs) {
      const { id, selected } = tab;

      if (id !== undefined && selected) {
        ids.push(id);
      }
    }

    if (ids.length > 0) {
      browser.tabs.remove(ids);
    }
  }

  onMount(() => {
    browser.tabs.query({}, (ts) => {
      allTabs = ts;
    });

    browser.tabs.onCreated.addListener(handleBrowserTabsCreated);
    browser.tabs.onUpdated.addListener(handleBrowserTabsUpdate);
    browser.tabs.onRemoved.addListener(handleBrowserTabsRemoved);
  });

  onDestroy(() => {
    browser.tabs.onCreated.removeListener(handleBrowserTabsCreated);
    browser.tabs.onUpdated.removeListener(handleBrowserTabsUpdate);
    browser.tabs.onRemoved.removeListener(handleBrowserTabsRemoved);
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
          {#each tabsInWindow.tabs as tab (tab.id)}
            <Tab
              id={tab.id}
              title={tab.title}
              url={tab.url}
              favIconUrl={tab.favIconUrl}
              active={tab.active}
              selected={tab.selected}
              titleHighlightRanges={tab.titleHighlightRanges}
              urlHighlightRanges={tab.urlHighlightRanges}
              on:click={handleTabClick}
            />
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if tabs.length === 0}
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
