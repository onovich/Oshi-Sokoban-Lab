import { App } from './App';

export function PlaytestApp() {
  return (
    <App
      authoringMode={false}
      initialCatalogId="mastery-v2"
      lessonAccessMode="free"
      progressStorage={window.sessionStorage}
    />
  );
}
