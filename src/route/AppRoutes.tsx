import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import PresentationPage from '../pages/PresentationPage';

interface AppRoutesProps {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

const AppRoutes: React.FC<AppRoutesProps> = ({ isAuthenticated, setIsAuthenticated }) => {
  return (
    <Routes>
      <Route
        path="/"
        element={<LoginPage setIsAuthenticated={setIsAuthenticated} />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />}
      />
      <Route
        path="/presentation/:id"
        element={isAuthenticated ? <PresentationPage /> : <Navigate to="/" />}
      />
    </Routes>
  );
};

export default AppRoutes;