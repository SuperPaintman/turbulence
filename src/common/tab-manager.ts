'use strict';
/* Imports */
import type { Subscriber, Unsubscriber, Readable } from 'svelte/store';
import type { DeepReadonlyArray } from './util';

/* Types */
type TabsObserver = {
  readonly onCreated: chrome.tabs.TabCreatedEvent;
  readonly onUpdated: chrome.tabs.TabUpdatedEvent;
  readonly onRemoved: chrome.tabs.TabRemovedEvent;
};

export class TabManager
  implements Readable<DeepReadonlyArray<chrome.tabs.Tab>>
{
  private _subscribers: Array<Subscriber<DeepReadonlyArray<chrome.tabs.Tab>>> =
    [];
  private _tabs: chrome.tabs.Tab[] = [];

  get tabs(): DeepReadonlyArray<chrome.tabs.Tab> {
    return this._tabs;
  }

  readonly sync = (tabs: chrome.tabs.Tab[]): void => {
    this._tabs = tabs;
    this._notify();
  };

  readonly handleTabOnCreated = (tab: chrome.tabs.Tab): void => {
    this._tabs.push(tab);
    this._tabs.sort(byIndex);
    this._notify();
  };

  readonly handleTabOnUpdated = (
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ): void => {
    let changed = false;

    // Mark the old tab (in this window) as deactiveted.
    if (tab.active) {
      for (let i = 0, ii = this._tabs.length; i < ii; i++) {
        if (this._tabs[i].windowId === tab.windowId) {
          changed = true;
          this._tabs[i].active = false;
        }
      }
    }

    for (let i = 0, ii = this._tabs.length; i < ii; i++) {
      if (this._tabs[i].id === tabId) {
        changed = true;
        this._tabs[i] = tab;
        this._tabs.sort(byIndex);
        break;
      }
    }

    if (changed) {
      this._notify();
    }
  };

  readonly handleTabOnRemoved = (
    tabId: number,
    removeInfo: chrome.tabs.TabRemoveInfo
  ): void => {
    let changed = false;

    for (let i = 0, ii = this._tabs.length; i < ii; i++) {
      if (this._tabs[i].id === tabId) {
        changed = true;
        this._tabs.splice(i, 1);
        break;
      }
    }

    if (changed) {
      this._notify();
    }
  };

  addListeners(observer: TabsObserver): void {
    observer.onCreated.addListener(this.handleTabOnCreated);
    observer.onUpdated.addListener(this.handleTabOnUpdated);
    observer.onRemoved.addListener(this.handleTabOnRemoved);
  }

  removeListeners(observer: TabsObserver): void {
    observer.onCreated.removeListener(this.handleTabOnCreated);
    observer.onUpdated.removeListener(this.handleTabOnUpdated);
    observer.onRemoved.removeListener(this.handleTabOnRemoved);
  }

  subscribe(
    run: Subscriber<DeepReadonlyArray<chrome.tabs.Tab>>,
    invalidate?: (value?: DeepReadonlyArray<chrome.tabs.Tab>) => void
  ): Unsubscriber {
    this._subscribers.push(run);
    run(this._tabs);

    return () => {
      for (let i = 0, ii = this._subscribers.length; i < ii; i++) {
        if (this._subscribers[i] === run) {
          this._subscribers.splice(i, 1);
          return;
        }
      }
    };
  }

  private _notify() {
    for (const subscriber of this._subscribers) {
      subscriber(this._tabs);
    }
  }
}

function byIndex(a: chrome.tabs.Tab, b: chrome.tabs.Tab): number {
  return a.index - b.index;
}
