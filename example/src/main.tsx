import React from 'react';
import ReactDOM from 'react-dom/client';
import { Frshly } from 'frshly';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Frshly mode="prompt" debug={true}>
      <App />
    </Frshly>
  </React.StrictMode>
);
