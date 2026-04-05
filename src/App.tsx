import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AppProvider } from "./hooks/useAppContext";
import { BottomNav } from "./components/BottomNav";
import { Home } from "./components/Home";
import { Discover } from "./components/Discover";
import { Request } from "./components/Request";
import { Bookmarks } from "./components/Bookmarks";
import { Account } from "./components/Account";
import { ProviderDetail } from "./components/ProviderDetail";

const App = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <div className="max-w-lg mx-auto relative min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/request" element={<Request />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/account" element={<Account />} />
              <Route path="/provider/:id" element={<ProviderDetail />} />
            </Routes>
          </div>
          <BottomNav />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
