'use strict';

import 'normalize.css';
import '~/common/global.css';

import Popup from './Popup.svelte';

if (!module.parent && typeof global.document !== 'undefined') {
  new Popup({
    target: document.getElementById('root')!
  });
}

// document.body.classList.add('light');

export default Popup;
