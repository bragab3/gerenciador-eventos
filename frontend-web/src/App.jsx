import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Cadastro from './pages/Cadastro.jsx';
import Home from './pages/Home.jsx';
import { getSessao } from './auth.js';

function RotaProtegida({ children }) {
  return getSessao()?.token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route
        path="/home"
        element={
          <RotaProtegida>
            <Home />
          </RotaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
