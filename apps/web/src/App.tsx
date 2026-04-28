import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { ListPage } from "./pages/ListPage";
import { DetailPage } from "./pages/DetailPage";

export function App() {
  return (
    <div className="app">
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ListPage />} />
          <Route path="/skills/:id" element={<DetailPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
