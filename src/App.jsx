import { useState } from 'react';
import {Routes, Route} from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/public/Home.jsx";
import SafetyTips from './pages/public/SafetyTips.jsx';
import Properties from './components/Properties.jsx'
import About from './pages/public/About.jsx';
import AgentLogin from './agent/AgentLogin.jsx';
import AgentSignup from './agent/AgentSignup.jsx';
import AgentDashboard from './agent/AgentDashboard.jsx';
import AgentRouteGuard from './agent/AgentRouteGuard.jsx';
function App() {
  return (
    <>
    <Navbar />

    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/safetytips" element={<SafetyTips />} />
      <Route path="/properties" element={<Properties/>} />
      <Route path="/about" element={<About />} />
      <Route path="/agent/login" element={<AgentLogin />} />
      <Route path="/agent/signup" element={<AgentSignup />} />
      <Route
        path="/agent/dashboard"
        element={
          <AgentRouteGuard>
            <AgentDashboard />
          </AgentRouteGuard>
        }
      />
    </Routes>

    <Footer />
    </>
  )
}

export default App;
