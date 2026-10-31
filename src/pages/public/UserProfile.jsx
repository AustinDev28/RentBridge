import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun, LogOut, UserRound } from "lucide-react";
import { logoutUser } from "../../user/userAuthService.js";
import { useUserPreferences } from "../../user/UserPreferences.jsx";
import "./UserProfile.css";

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, setUser, theme, setTheme } = useUserPreferences();
  if (!user) return <Navigate to="/user/login" replace />;

  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const handleLogout = () => {
    logoutUser();
    setUser(null);
    navigate("/", { replace: true });
  };

  return (
    <main className={`user-profile-page theme-${theme}`}>
      <div className="user-profile-wrap">
        <Link className="user-profile-back" to="/"><ArrowLeft size={17} /> Back to feed</Link>
        <header className="user-profile-heading">
          <span className="user-profile-avatar">{initials || <UserRound size={22} />}</span>
          <div><p>YOUR RENTBRIDGE ACCOUNT</p><h1>{user.name}</h1><span>{user.email}</span></div>
        </header>

        <section className="user-settings-panel" aria-labelledby="appearance-title">
          <div className="user-settings-title"><span className="user-settings-icon"><Sun size={20} /></span><div><h2 id="appearance-title">Appearance</h2><p>Choose how RentBridge looks for your account.</p></div></div>
          <div className="user-theme-options" role="radiogroup" aria-label="Color theme">
            <button type="button" role="radio" aria-checked={theme === "light"} className={theme === "light" ? "is-selected" : ""} onClick={() => setTheme("light")}>
              <Sun size={21} /><span><strong>Light mode</strong><small>Bright and clear</small></span><i />
            </button>
            <button type="button" role="radio" aria-checked={theme === "dark"} className={theme === "dark" ? "is-selected" : ""} onClick={() => setTheme("dark")}>
              <Moon size={21} /><span><strong>Dark mode</strong><small>Easy on the eyes</small></span><i />
            </button>
          </div>
        </section>

        <section className="user-settings-panel user-account-panel">
          <div><h2>Account</h2><p>Your RentBridge home seeker account is active.</p></div>
          <button type="button" className="user-logout-button" onClick={handleLogout}><LogOut size={17} /> Sign out</button>
        </section>
      </div>
    </main>
  );
}
