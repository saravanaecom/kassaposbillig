import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/login";
import Dashboard from "./components/Dashboard";
import ItemMaster from "./components/Itemmaster";
import { PurchaseMasterPage } from './presentation/pages/PurchaseMasterPage';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login page */}
        <Route path="/" element={<Login />} />

        {/* Dashboard page */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Item Master page */}
        <Route path="/itemmaster" element={<ItemMaster />} />
        <Route path="/PurchaseMasterPage" element={<PurchaseMasterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;