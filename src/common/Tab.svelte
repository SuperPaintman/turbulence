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

  function bindCustomEvents(elem: HTMLElement) {
    elem.addEventListener('click', handleClick);
    elem.addEventListener('auxclick', handleClick);

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

<div class="tab" use:bindCustomEvents>
  <div
    class="icon"
    style={favIconUrl ? `background-image: url(${favIconUrl})` : undefined}
  />

  <div>
    <span>{id}</span> -
    {#each titleParts as part}
      <span class:highlighted={part.highlighted}>{part.text}</span>
    {/each}
  </div>

  <div>
    {#each urlParts as part}
      <span class:highlighted={part.highlighted}>{part.text}</span>
    {/each}
  </div>
</div>

<style>
  .tab {
    margin: 8px;
    padding: 8px;

    border-radius: 4px;

    overflow: hidden;

    box-shadow: 0px 2px 8px rgba(27, 27, 27, 0.1);

    cursor: pointer;
  }

  .icon {
    width: 16px;
    height: 16px;

    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
  }

  .highlighted {
    color: rgb(0, 110, 255);
  }
</style>
