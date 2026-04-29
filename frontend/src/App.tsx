import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav.js';
import PricesPage from './pages/PricesPage.js';
import BanksPage from './pages/BanksPage.js';

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-background text-on-background min-h-screen">
        <Routes>
          <Route path="/" element={<PricesPage />} />
          <Route path="/banks" element={<BanksPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
