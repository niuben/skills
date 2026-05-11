import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { ListPage } from "./pages/ListPage";
import { DetailPage } from "./pages/DetailPage";
import { PublishPage } from "./pages/PublishPage";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";

export function App() {
  return (
    <div className="app">
      <main style={{ flex: 1 }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ListPage />} />
          <Route path="/skills/:id" element={<DetailPage />} />
          <Route path="/publish" element={<PublishPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/me" element={<MyPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
