<script lang="ts">
  /* Imports */
  import { createEventDispatcher } from 'svelte';

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

  export let id: number | undefined;
  export let title: string | undefined;
  export let url: string | undefined;
  export let favIconUrl: string | undefined;
</script>

<div class="tab" use:bindCustomEvents>
  <div
    class="icon"
    style={favIconUrl ? `background-image: url(${favIconUrl})` : undefined}
  />

  <div>
    <span>{id}</span> - <span>{title}</span>
  </div>

  <div>{url}</div>
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
</style>
