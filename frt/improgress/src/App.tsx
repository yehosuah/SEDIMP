import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Login } from './pages/Login';
import type { AuthResponse } from './lib/api';

export default function App() {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return <RouterProvider router={router} />;
}