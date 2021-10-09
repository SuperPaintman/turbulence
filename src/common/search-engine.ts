'use strict';

import type { DeepReadonly, DeepReadonlyArray } from './util';

/* Types */
export type Range = [start: number, end: number];

export type FoundTab = {
  readonly tab: DeepReadonly<chrome.tabs.Tab>;
  readonly highlight: {
    readonly title?: Range[];
    readonly url?: Range[];
  };
};

export type FoundTabs = ReadonlyArray<FoundTab>;

type Where = {
  title: boolean;
  url: boolean;
};

type TextSearchResults = {
  found: boolean;
  positions: Range[];
};

export class SearchEngine {
  search(
    tabs: DeepReadonlyArray<chrome.tabs.Tab>,
    input: string
  ): { tabs: FoundTabs; emptySearch: boolean } {
    const { needle, where } = detectWhere(input);
    const fn = detectSearchAlgo(needle);

    if (needle.length === 0) {
      return {
        tabs: tabs.map((tab) => ({ tab, highlight: {} })),
        emptySearch: true
      };
    }

    const foundTabs: FoundTab[] = [];

    for (const tab of tabs) {
      const foundTab = matchTab(tab, fn, where);

      if (foundTab !== null) {
        foundTabs.push(foundTab);
      }
    }

    return { tabs: foundTabs, emptySearch: false };
  }
}

function matchTab(
  tab: chrome.tabs.Tab,
  fn: (haystack: string) => { found: boolean; positions: Range[] },
  where: Where
): FoundTab | null {
  const foundTab: {
    readonly tab: DeepReadonly<chrome.tabs.Tab>;
    readonly highlight: {
      title?: Range[];
      url?: Range[];
    };
  } = { tab, highlight: {} };

  let found = false;

  if (where.title && tab.title) {
    const titleMatch = fn(tab.title);

    if (titleMatch.found) {
      found = true;
      foundTab.highlight.title = titleMatch.positions;
    }
  }

  if (where.url && tab.url) {
    const urlMatch = fn(tab.url);

    if (urlMatch.found) {
      found = true;
      foundTab.highlight.url = urlMatch.positions;
    }
  }

  if (!found) {
    return null;
  }

  return foundTab;
}

export function detectWhere(needle: string): {
  needle: string;
  where: Where;
} {
  if (needle[0] !== ':') {
    return {
      needle: needle,
      where: {
        title: true,
        url: true
      }
    };
  }

  needle = needle.slice(1); // Eat first :

  let idx = needle.indexOf(':');
  let found = false;
  const where: Where = { title: false, url: false };

  loop: while (idx !== -1) {
    const field = needle.slice(0, idx);

    switch (field) {
      case 'title':
        found = true;
        where.title = true;
        needle = needle.slice(idx + 1);
        break;

      case 'url':
        found = true;
        where.url = true;
        needle = needle.slice(idx + 1);
        break;

      default:
        break loop;
    }

    idx = needle.indexOf(':');
  }

  if (!found) {
    return {
      needle,
      where: {
        title: true,
        url: true
      }
    };
  }

  return {
    needle,
    where
  };
}

export function detectSearchAlgo(
  needle: string
): (haystack: string) => TextSearchResults {
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

export function fuzzySearch(
  needle: string,
  haystack: string
): TextSearchResults {
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

    return { found: false, positions: [] };
  }

  if (start !== -1) {
    positions.push([start, end]);
  }

  return { found: true, positions };
}

export function exactSearch(
  needle: string,
  haystack: string
): TextSearchResults {
  if (needle.length === 0) {
    return { found: true, positions: [] };
  }

  const pos = haystack.toLowerCase().indexOf(needle.toLowerCase());
  if (pos === -1) {
    return { found: false, positions: [] };
  }

  return { found: true, positions: [[pos, pos + needle.length]] };
}

export function regexpSearch(
  needle: RegExp,
  haystack: string
): TextSearchResults {
  const match = needle.exec(haystack);
  if (match === null) {
    return { found: false, positions: [] };
  }

  return {
    found: true,
    positions: [[match.index, match.index + match[0].length]]
  };
}
