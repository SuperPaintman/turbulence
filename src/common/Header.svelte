<script lang="ts">
  /* Imports */
  import { createEventDispatcher } from 'svelte';

  export let search: string = '';

  const dispatch =
    createEventDispatcher<{
      clickRemove: undefined;
    }>();

  function handleRemoveClick(e: MouseEvent) {
    dispatch('clickRemove');
  }

  function autofocus(elem: HTMLInputElement) {
    setTimeout(() => {
      elem.focus();
    });
  }
</script>

<header class="header-box">
  <div class="header">
    <div class="inner">
      <input
        class="input"
        placeholder="Search..."
        use:autofocus
        bind:value={search}
      />
      <div class="buttons">
        <div class="button remove" on:click={handleRemoveClick}>
          <i class="icon fas fa-trash-alt" />
        </div>
      </div>
    </div>
  </div>
  <div class="header-holder" />
</header>

<style>
  @import './config.css';

  :root {
    --header-height: 48px;
  }

  .header-box {
    height: var(--header-height);
  }

  .header {
    position: fixed;

    width: 100%;
    height: var(--header-height);

    top: 0;
    left: 0;

    background: var(--color-bg);

    box-shadow: 0px 2px 8px rgba(27, 27, 27, 0.2);

    z-index: 200;
  }

  :global(body.dark) .header {
    background: color(var(--color-dark-bg) tint(3%));

    box-shadow: 0px 8px 12px rgba(27, 27, 27, 0.5);
  }

  @media (prefers-color-scheme: dark) {
    :global(body:not(.light)) .header {
      background: color(var(--color-dark-bg) tint(3%));

      box-shadow: 0px 8px 12px rgba(27, 27, 27, 0.5);
    }
  }

  .inner {
    display: flex;

    padding: 8px;
  }

  .input {
    flex: 1 1 auto;
    display: block;

    height: 32px;

    margin: 0;
    padding: 4px 8px;
    border: none;
    outline: none;

    box-sizing: border-box;

    border-radius: 4px;

    background: color(var(--color-bg) shade(5%));

    font-family: monospace, sans-serif;
    font-size: 16px;
    line-height: 16px;
  }

  .input:focus {
    box-shadow: 0px 0px 0px 1px var(--color-blue) inset;
  }

  :global(body.dark) .input {
    background: color(var(--color-dark-bg) tint(10%));
    color: var(--color-dark-fg);
  }

  @media (prefers-color-scheme: dark) {
    :global(body:not(.light)) .input {
      background: color(var(--color-dark-bg) tint(10%));
      color: var(--color-dark-fg);
    }
  }

  .button {
    flex: 0 0 auto;

    width: 32px;
    height: 32px;

    margin: 0 4px;

    background: color(var(--color-bg) shade(5%));

    border-radius: 4px;

    cursor: pointer;
  }

  :global(body.dark) .button {
    background: color(var(--color-dark-bg) tint(10%));
  }

  @media (prefers-color-scheme: dark) {
    :global(body:not(.light)) .button {
      background: color(var(--color-dark-bg) tint(10%));
    }
  }

  .icon {
    width: 100%;
    height: 100%;

    text-align: center;
    line-height: 32px;
  }
</style>
