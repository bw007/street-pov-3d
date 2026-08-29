import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// TEMP DIAGNOSTIC — logs every main-thread block over 50ms to the console
// (name/duration/start) so we can see exactly what's causing the freeze
// reported when new chunks stream in, instead of guessing. Safe to remove
// once the cause is found.
if ('PerformanceObserver' in window) {
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // eslint-disable-next-line no-console
        console.warn(
          `[LONGTASK] ${entry.duration.toFixed(0)}ms at t=${entry.startTime.toFixed(0)}ms`,
          entry
        );
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {
    // longtask not supported in this browser
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
