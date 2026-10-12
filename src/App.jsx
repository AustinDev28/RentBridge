import { useState } from 'react';
import {Routes, Route} from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/public/Home.jsx";
import SafetyTips from './pages/public/SafetyTips.jsx';
import Properties from './components/Properties.jsx'
import About from './pages/public/About.jsx';
function App() {
  return (
    <>
    <Navbar />

    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/safetytips" element={<SafetyTips />} />
      <Route path="/properties" element={<Properties/>} />
      <Route path="/about" element={<About />} />
    </Routes>

    <Footer />
    </>
  )
}

export default App;