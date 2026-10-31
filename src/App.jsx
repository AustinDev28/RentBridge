import {Routes, Route, useLocation} from "react-router-dom";
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
import PrivacyPolicy from './pages/public/PrivacyPolicy.jsx';
import Terms from './pages/public/Terms.jsx';
import UserAuth from './pages/public/UserAuth.jsx';
import UserProfile from './pages/public/UserProfile.jsx';
function App() {
  const { pathname } = useLocation();
  const isHomeFeed = pathname === "/";
  return (
    <>
    {!isHomeFeed && <Navbar />}

    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/safetytips" element={<SafetyTips />} />
      <Route path="/properties" element={<Properties/>} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/agent/login" element={<AgentLogin />} />
      <Route path="/agent/signup" element={<AgentSignup />} />
      <Route path="/user/login" element={<UserAuth />} />
      <Route path="/user/signup" element={<UserAuth signup />} />
      <Route path="/user/profile" element={<UserProfile />} />
      <Route
        path="/agent/dashboard"
        element={
          <AgentRouteGuard>
            <AgentDashboard />
          </AgentRouteGuard>
        }
      />
    </Routes>

    {!isHomeFeed && <Footer />}
    </>
  )
}

export default App;
