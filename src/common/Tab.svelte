<script lang="ts">
  /* Imports */
  import { createEventDispatcher } from 'svelte';

  /* Types */
  type Range = [start: number, end: number];
  type Part = {
    text: string;
    highlighted: boolean;
  };

  /* Props */
  export let id: number | undefined;
  export let title: string | undefined;
  export let url: string | undefined;
  export let favIconUrl: string | undefined;
  export let active: boolean | undefined;
  export let selected: boolean = false;
  export let showUrl: boolean = false;
  export let titleHighlightRanges: Range[] | undefined = undefined;
  export let urlHighlightRanges: Range[] | undefined = undefined;

  const dispatch =
    createEventDispatcher<{
      click: {
        id: number | undefined;
        button: number;
        altKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
      };
    }>();

  function handleClick(e: MouseEvent) {
    dispatch('click', {
      id,
      button: e.button,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey
    });
  }

  function deepPreventContextMenu(elem: Element, e: MouseEvent) {
    let target: EventTarget | null = e.target;
    while (target) {
      if (elem === target) {
        e.preventDefault();
        return;
      }

      target = (target as Element).parentElement || null;
    }
  }

  function bindCustomEvents(elem: HTMLElement) {
    elem.addEventListener('click', handleClick);
    elem.addEventListener('auxclick', handleClick);

    function handlePreventContextMenu(e: MouseEvent) {
      deepPreventContextMenu(elem, e);
    }

    if (window) {
      window.addEventListener('contextmenu', handlePreventContextMenu);
    }

    return {
      destroy() {
        elem.removeEventListener('click', handleClick);
        elem.removeEventListener('auxclick', handleClick);

        if (window) {
          window.removeEventListener('contextmenu', handlePreventContextMenu);
        }
      }
    };
  }

  function textToParts(text?: string, ranges?: Range[]): Part[] {
    if (text === undefined) {
      return [];
    }

    if (ranges === undefined || ranges.length === 0) {
      return [{ text, highlighted: false }];
    }

    const parts: Part[] = [];

    let i = 0;
    for (const range of ranges) {
      const [start, end] = range;

      if (start >= text.length) {
        i = start;
        break;
      }

      if (start !== i) {
        parts.push({
          text: text.slice(i, start),
          highlighted: false
        });
      }

      parts.push({
        text: text.slice(start, Math.min(end, text.length)),
        highlighted: true
      });

      i = end;
    }

    if (i < text.length) {
      parts.push({
        text: text.slice(i),
        highlighted: false
      });
    }

    return parts;
  }

  $: titleParts = textToParts(title, titleHighlightRanges);
  $: urlParts = textToParts(url, urlHighlightRanges);
</script>

<div class="tab" class:active class:show-url={showUrl} use:bindCustomEvents>
  <div class="inner" class:selected>
    <div
      class="icon"
      class:no-icon={!favIconUrl}
      style={favIconUrl ? `background-image: url(${favIconUrl})` : undefined}
    />

    <div class="content">
      <div class="title">
        {#each titleParts as part}
          <span class:highlighted={part.highlighted}>{part.text}</span>
        {/each}
      </div>

      {#if showUrl}
        <div class="url">
          {#each urlParts as part}
            <span class:highlighted={part.highlighted}>{part.text}</span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @import './config.css';

  .tab {
    position: relative;

    margin: 8px;

    border-radius: 4px;

    overflow: hidden;

    background: var(--color-bg);

    box-shadow: 0px 2px 8px rgba(27, 27, 27, 0.1);

    font-size: 16px;
    line-height: 16px;

    cursor: pointer;
  }

  .tab.active::before {
    content: '';
    display: block;

    position: absolute;

    left: 0;
    top: 0;

    width: 8px;
    height: 100%;

    background: var(--color-blue);

    z-index: 1;
  }

  :global(body.dark) .tab {
    background: var(--color-dark-bg);

    box-shadow: 0px 2px 8px rgba(179, 179, 179, 0.03);
  }

  @media (prefers-color-scheme: dark) {
    :global(body:not(.light)) .tab {
      background: var(--color-dark-bg);

      box-shadow: 0px 2px 8px rgba(179, 179, 179, 0.03);
    }
  }

  .inner {
    position: relative;

    display: flex;
    align-items: center;

    padding: 8px;
    padding-left: 16px;

    border-radius: 4px;

    z-index: 2;
  }

  .inner.selected {
    box-shadow: 0px 0px 0px 1px var(--color-blue) inset;
  }

  .icon {
    flex: 0 0 auto;

    width: 16px;
    height: 16px;

    margin-left: 8px;
    margin-right: 16px;

    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
  }

  .tab.show-url .icon {
    margin: 8px;
    margin-right: 16px;
  }

  .no-icon {
    background: rgba(27, 27, 27, 0.1);
    border-radius: 4px;
  }

  :global(body.dark) .no-icon {
    background: rgba(192, 192, 192, 0.1);
  }

  @media (prefers-color-scheme: dark) {
    :global(body:not(.light)) .no-icon {
      background: rgba(192, 192, 192, 0.1);
    }
  }

  .content {
    display: flex;
    flex: 0 1 auto;
    flex-direction: column;
    justify-content: center;

    height: 20px;

    margin: -2px 0;

    overflow: hidden;
  }

  .tab.show-url .content {
    height: 36px;
  }

  .title {
    width: 100%;
    height: 22px;

    margin: -3px 0;

    font-size: 14px;
    line-height: 22px;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .url {
    height: 16px;

    margin-top: 2px;
    margin-bottom: -2px;

    font-size: 12px;
    line-height: 16px;
    font-weight: 300;

    font-family: monospace, sans-serif;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .highlighted {
    color: color(var(--color-blue) shade(20%));
  }

  :global(body.dark) .highlighted {
    color: var(--color-blue);
  }

  @media (prefers-color-scheme: dark) {
    :global(body:not(.light)) .highlighted {
      color: var(--color-blue);
    }
  }
</style>
