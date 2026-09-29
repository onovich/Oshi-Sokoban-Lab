import { App } from './App';

export function PlaytestApp() {
  const levelId = new URLSearchParams(window.location.search).get('level') ?? undefined;
  return (
    <App
      initialLevelId={levelId}
      blindPlaytest={levelId !== undefined}
      authoringMode={false}
      initialCatalogId="mastery-v2"
      lessonAccessMode="free"
      progressStorage={window.sessionStorage}
    />
  );
}
