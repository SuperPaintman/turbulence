'use strict';

import 'normalize.css';
import '~/common/global.css';

import App from './App.svelte';

if (!module.parent && typeof global.document !== 'undefined') {
  new App({
    target: document.getElementById('root')!
  });
}

// document.body.classList.add('light');

export default App;
