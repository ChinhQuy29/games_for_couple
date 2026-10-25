import { Route, Routes } from 'react-router-dom';
import PortalHome from './portal/PortalHome';
import AogApp from '@gfc/aog/client';
import DoodleApp from '@gfc/doodle/client';
import FmsApp from '@gfc/fms/client';
import WyrApp from '@gfc/wyr/client';
import NotFound from './portal/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PortalHome />} />
      {/* One route per React game (games/<id>/client). Add new games here and in shared/src/games.ts. */}
      <Route path="/fms/*" element={<FmsApp />} />
      <Route path="/doodle/*" element={<DoodleApp />} />
      <Route path="/wyr/*" element={<WyrApp />} />
      <Route path="/aog/*" element={<AogApp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
