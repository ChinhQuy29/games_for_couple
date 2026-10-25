import { Route, Routes } from 'react-router-dom';
import PortalHome from './portal/PortalHome';
import AogApp from '@gfc/aog/client';
import DoodleApp from '@gfc/doodle/client';
import FmsApp from '@gfc/fms/client';
import HnsApp from '@gfc/hns/client';
import RushApp from '@gfc/rush/client';
import BombApp from '@gfc/bomb/client';
import KitchenApp from '@gfc/kitchen/client';
import GhostApp from '@gfc/ghost/client';
import TetheredApp from '@gfc/tethered/client';
import TwoBodyApp from '@gfc/twobody/client';
import MovingInApp from '@gfc/movingin/client';
import EscapeApp from '@gfc/escape/client';
import CarryApp from '@gfc/carry/client';
import RoadTripApp from '@gfc/roadtrip/client';
import DuetApp from '@gfc/duet/client';
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
      <Route path="/hns/*" element={<HnsApp />} />
      <Route path="/rush/*" element={<RushApp />} />
      <Route path="/bomb/*" element={<BombApp />} />
      <Route path="/kitchen/*" element={<KitchenApp />} />
      <Route path="/ghost/*" element={<GhostApp />} />
      <Route path="/tethered/*" element={<TetheredApp />} />
      <Route path="/two-body-problem/*" element={<TwoBodyApp />} />
      <Route path="/moving-in/*" element={<MovingInApp />} />
      <Route path="/escape/*" element={<EscapeApp />} />
      <Route path="/carry/*" element={<CarryApp />} />
      <Route path="/road-trip/*" element={<RoadTripApp />} />
      <Route path="/codenames/*" element={<DuetApp />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
