import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { PlaytestApp } from './PlaytestApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlaytestApp />
  </StrictMode>,
);
