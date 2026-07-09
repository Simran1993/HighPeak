import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from './components/ui/Toaster';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      // Keep data around for a week so itineraries stay readable offline
      // (e.g. checking your flight's arrival time mid-air).
      gcTime: 7 * 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Persist the query cache to localStorage → trips, itineraries, and posts
// you've already viewed remain available with no connection.
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'highpeak-query-cache',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        dehydrateOptions: {
          // don't persist volatile live-tracking queries
          shouldDehydrateQuery: (q) => q.queryKey[0] !== 'flight-track',
        },
      }}
    >
      <RouterProvider router={router} />
      <Toaster />
    </PersistQueryClientProvider>
  </React.StrictMode>,
);
