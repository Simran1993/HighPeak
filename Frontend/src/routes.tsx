import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NewTripPage } from '@/pages/NewTripPage';
import { TripDetailPage } from '@/pages/TripDetailPage';
import { ExplorePage } from '@/pages/ExplorePage';
import { PostDetailPage } from '@/pages/PostDetailPage';
import { SavedPostsPage } from '@/pages/SavedPostsPage';
import { InviteAcceptPage } from '@/pages/InviteAcceptPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/auth/callback', element: <OAuthCallbackPage /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/', element: <Navigate to="/explore" replace /> },
      { path: '/explore', element: <ExplorePage /> },
      { path: '/explore/:postId', element: <PostDetailPage /> },
      { path: '/saved', element: <SavedPostsPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/trips/new', element: <NewTripPage /> },
      { path: '/trips/:id', element: <TripDetailPage /> },
      { path: '/invites/:token/accept', element: <InviteAcceptPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
