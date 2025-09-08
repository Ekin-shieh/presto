import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import PresentationPage from '../pages/PresentationPage';
import PreviewPage from '../pages/PreviewPage';

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
      <Route
        path="/preview/:id"
        element={isAuthenticated ? <PreviewPage /> : <Navigate to="/" />}
      />
    </Routes>
  );
};

export default AppRoutes;