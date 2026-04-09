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
import { Messages } from "./components/Messages";
import { Chat } from "./components/Chat";
import { BusinessDashboard } from "./components/BusinessDashboard";
import { MapView } from "./components/MapView";
import { Payment } from "./components/Payment";

const App = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/request" element={<Request />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/account" element={<Account />} />
              <Route path="/provider/:id" element={<ProviderDetail />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:conversationId" element={<Chat />} />
              <Route path="/business" element={<BusinessDashboard />} />
              <Route path="/payment/:requestId" element={<Payment />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
