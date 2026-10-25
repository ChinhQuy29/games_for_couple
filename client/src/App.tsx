import { Route, Routes } from 'react-router-dom';
import PortalHome from './portal/PortalHome';
import FmsApp from './games/fms/FmsApp';
import NotFound from './portal/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PortalHome />} />
      {/* One route per game. Add new games here and in shared/src/games.ts. */}
      <Route path="/fms/*" element={<FmsApp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
