'use strict';

import 'normalize.css';
import './global.css';

import Popup from './Popup.svelte';

if (!module.parent && typeof global.document !== 'undefined') {
  new Popup({
    target: document.getElementById('root')!
  });
}

export default Popup;
