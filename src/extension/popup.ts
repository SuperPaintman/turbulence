'use strict';

import 'normalize.css';
import '@fortawesome/fontawesome-free/css/all.css';
import '~/common/global.css';

import Popup from './Popup.svelte';

/* Init */
if (!(global as any).browser) {
  (global as any).browser = chrome;
}

if (!module.parent && typeof global.document !== 'undefined') {
  new Popup({
    target: document.getElementById('root')!
  });
}

// document.body.classList.add('light');

export default Popup;
