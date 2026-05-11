import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Login } from './pages/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return <RouterProvider router={router} />;
}