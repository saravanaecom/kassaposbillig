import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/login";
import Dashboard from "./components/Dashboard";
import ItemMaster from "./components/Itemmaster";
import ProtectedRoute from "./components/ProtectedRoute"; // ← new

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public: Login page */}
        <Route path="/" element={<Login />} />

        {/* Protected: Dashboard — requires a valid token */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: Item Master — requires a valid token */}
        <Route
          path="/itemmaster"
          element={
            <ProtectedRoute>
              <ItemMaster />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
