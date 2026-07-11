import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../lib/theme.css';
import { App } from './App';
import { I18nProvider } from '../../i18n';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
