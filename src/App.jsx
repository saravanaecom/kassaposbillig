import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PurchaseMasterPage } from './presentation/pages/PurchaseMasterPage';
import { LoginPage } from './presentation/pages/LoginPage';
import { DashboardLayout } from './presentation/pages/DashboardLayout';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login page */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/PurchaseMasterPage" element={<PurchaseMasterPage />} />
           <Route path="/Home/Index" element={<DashboardLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;