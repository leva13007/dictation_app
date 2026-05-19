import { Navigate, Route, Routes } from 'react-router-dom';
import { DictationListPage } from './pages/DictationListPage';
import { PlayerPage } from './pages/PlayerPage';

const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/list" replace />} />
    <Route path="/list" element={<DictationListPage />} />
    <Route path="/player/:id" element={<PlayerPage />} />
  </Routes>
);

export default App;
