'use strict';

import 'normalize.css';
import './global.css';

import App from './App.svelte';

if (!module.parent && typeof global.document !== 'undefined') {
  new App({
    target: document.getElementById('root')!
  });
}

export default App;
