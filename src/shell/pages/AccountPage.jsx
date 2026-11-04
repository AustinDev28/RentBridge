import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Bell, BellOff, LogOut, Monitor, Moon, Sun, UserRound } from "lucide-react";
import { getCurrentAgent, logout as logoutAgent } from "../../agent/authService.js";
import { getCurrentUser, logoutUser, updateUserProfile, changeUserPassword } from "../../user/userAuthService.js";
import { useUserPreferences } from "../../user/UserPreferences.jsx";
import { getDirectoryAgents, toggleAgentFollow } from "../agentDirectoryService.js";
import { USE_THEME_SYSTEM } from "../../theme/config.js";
import { useTheme } from "../../theme/useTheme.js";
import { getUserSettings, saveUserSettings } from "../../user/userSettings.js";
import { getSavedPropertyIds, toggleSavedProperty } from "../../user/savedProperties.js";
import { PROPERTIES } from "../../components/FeaturedProperties.jsx";
import PasswordField from "../../user/PasswordField.jsx";

const THEME_OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

function AppearanceControl() {
  const { mode, setMode } = useTheme();
  return <section className="shell-appearance" aria-labelledby="shell-appearance-title">
    <h2 id="shell-appearance-title">Appearance</h2>
    <p>Choose Light, Dark, or match your device setting.</p>
    <fieldset disabled={!USE_THEME_SYSTEM}>
      <legend className="shell-sr-only">Color theme</legend>
      <div className="shell-theme-options" role="radiogroup" aria-label="Color theme">
        {THEME_OPTIONS.map(({ value, label, Icon }) => <label className={mode === value ? "is-selected" : ""} key={value}>
          <input type="radio" name="rentbridge-theme-mode" value={value} checked={mode === value} onChange={() => setMode(value)} aria-label={`${label} theme`} />
          <Icon size={18} aria-hidden="true" /><span>{label}</span>
        </label>)}
      </div>
    </fieldset>
  </section>;
}

function UserNotificationSettings({ user }) {
  const [settings, setSettings] = useState(() => getUserSettings(user.id));
  const [message, setMessage] = useState("");
  const browserNotificationsAvailable = typeof window !== "undefined" && "Notification" in window;

  const updateSetting = async (key, enabled) => {
    if (key === "browserStatusNotifications" && enabled && browserNotificationsAvailable && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setSettings(saveUserSettings(user.id, { [key]: false }));
        setMessage(permission === "denied" ? "Browser notifications are blocked in your browser settings." : "Browser notifications were not enabled.");
        return;
      }
    }
    setSettings(saveUserSettings(user.id, { [key]: enabled }));
    setMessage(key === "browserStatusNotifications" && enabled ? "Browser alerts are enabled when your browser permits them." : "Notification preferences updated.");
  };

  return <section className="shell-account-card shell-user-notifications" aria-labelledby="shell-user-notifications-title">
    <h2 id="shell-user-notifications-title">Notifications</h2>
    <p>Choose how you hear about new updates from agents you follow.</p>
    <label className="shell-user-setting-row">
      <span><strong><Bell size={17} aria-hidden="true" /> In-app notifications</strong><small>Show new updates in the notification bell.</small></span>
      <input type="checkbox" checked={settings.inAppStatusNotifications} onChange={(event) => updateSetting("inAppStatusNotifications", event.target.checked)} />
    </label>
    <label className={`shell-user-setting-row${!browserNotificationsAvailable ? " is-disabled" : ""}`}>
      <span><strong><BellOff size={17} aria-hidden="true" /> Browser notifications</strong><small>{browserNotificationsAvailable ? "Show browser alerts while RentBridge is open." : "This browser does not support notifications."}</small></span>
      <input type="checkbox" checked={settings.browserStatusNotifications && browserNotificationsAvailable} disabled={!browserNotificationsAvailable} onChange={(event) => updateSetting("browserStatusNotifications", event.target.checked)} />
    </label>
    {message && <p className="shell-user-setting-message" role="status">{message}</p>}
    <p className="shell-user-setting-note">Browser alerts appear while RentBridge is open.</p>
  </section>;
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUserPreferences();
  const { resolvedTheme } = useTheme();
  const agent = getCurrentAgent();
  const [followedAgents, setFollowedAgents] = useState([]);
  const [savedIds, setSavedIds] = useState(() => getSavedPropertyIds(user?.id));
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [followBusy, setFollowBusy] = useState("");

  const loadFollowedAgents = useCallback(async () => {
    if (!user) return;
    const directory = await getDirectoryAgents();
    setFollowedAgents(directory.filter((item) => item.following));
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    setDisplayName(user.name);
    setSavedIds(getSavedPropertyIds(user.id));
    loadFollowedAgents();
    const refreshSaved = () => setSavedIds(getSavedPropertyIds(user.id));
    const refreshFollowed = () => loadFollowedAgents();
    window.addEventListener("rentbridge-saved-properties-updated", refreshSaved);
    window.addEventListener("rentbridge-status-updated", refreshFollowed);
    return () => {
      window.removeEventListener("rentbridge-saved-properties-updated", refreshSaved);
      window.removeEventListener("rentbridge-status-updated", refreshFollowed);
    };
  }, [user, loadFollowedAgents]);

  const logout = () => {
    if (agent) logoutAgent();
    if (user || getCurrentUser()) {
      logoutUser();
      setUser(null);
    }
    navigate("/", { replace: true });
  };

  const saveProfile = (event) => {
    event.preventDefault();
    const result = updateUserProfile({ name: displayName });
    if (result.error) {
      setProfileMessage(result.error === "invalid_name" ? "Enter a name between 2 and 80 characters." : "Could not save your profile. Please try again.");
      return;
    }
    setUser(result.user);
    setProfileMessage("Profile details saved.");
  };

  const changePassword = (event) => {
    event.preventDefault();
    setPasswordMessage("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("The new passwords do not match.");
      return;
    }
    const result = changeUserPassword(passwordForm);
    const errors = {
      incorrect_current_password: "Your current password is incorrect.",
      password_too_short: "Use at least 8 characters for your new password.",
      password_unchanged: "Choose a new password different from your current one.",
      storage_unavailable: "Could not save the password change. Please try again.",
    };
    if (result.error) {
      setPasswordMessage(errors[result.error] || "Could not change your password.");
      return;
    }
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordMessage("Password changed.");
  };

  const unfollow = async (agentId) => {
    setFollowBusy(agentId);
    await toggleAgentFollow(agentId, true);
    await loadFollowedAgents();
    setFollowBusy("");
  };

  const removeSaved = (propertyId) => {
    setSavedIds(toggleSavedProperty(propertyId, user.id));
  };

  if (!agent && !user) return <main className="shell-page shell-account-page" data-theme={resolvedTheme}><span className="shell-account-icon"><UserRound size={25} /></span><h1>Your account</h1><p>Sign in to manage your RentBridge account.</p><div className="shell-account-actions"><button type="button" className="shell-primary-button" onClick={() => navigate("/user/login")}>Log in <ArrowRight size={17} /></button><button type="button" className="shell-secondary-button" onClick={() => navigate("/user/signup")}>Sign up</button></div><p className="shell-agent-login">Are you an agent? <Link to="/agent/login">Log in</Link></p><AppearanceControl /></main>;

  if (agent) return <main className="shell-page shell-account-page" data-theme={resolvedTheme}><span className="shell-account-icon"><UserRound size={25} /></span><p className="shell-eyebrow">AGENT ACCOUNT</p><h1>{agent.name}</h1><button type="button" className="shell-primary-button" onClick={() => navigate("/agent/dashboard")}>Go to dashboard <ArrowRight size={17} /></button><AppearanceControl /><button type="button" className="shell-logout-button" onClick={logout}><LogOut size={17} /> Log out</button></main>;

  const savedProperties = PROPERTIES.filter((property) => savedIds.includes(property.id));
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return <main className="shell-page shell-account-page" data-theme={resolvedTheme}>
    <header className="shell-account-heading"><span className="shell-account-icon">{initials || <UserRound size={25} />}</span><div><p className="shell-eyebrow">YOUR ACCOUNT</p><h1>Account settings</h1><span>{user.email}</span></div></header>

    <section className="shell-account-card" aria-labelledby="shell-profile-title">
      <h2 id="shell-profile-title">Manage account</h2>
      <p>Update the name shown on your account. Email changes may require verification.</p>
      <form className="shell-account-form" onSubmit={saveProfile}>
        <label htmlFor="shell-account-name">Full name</label><input id="shell-account-name" autoComplete="name" value={displayName} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} />
        <label htmlFor="shell-account-email">Email address</label><input id="shell-account-email" type="email" value={user.email} readOnly aria-describedby="shell-email-note" />
        <small id="shell-email-note">Email address cannot be edited here.</small>
        <button type="submit" className="shell-primary-button">Save profile</button>
        {profileMessage && <p className="shell-account-message" role="status">{profileMessage}</p>}
      </form>
    </section>

    <section className="shell-account-card" aria-labelledby="shell-password-title">
      <h2 id="shell-password-title">Change password</h2>
      <p>Enter your current password and choose a new password with at least 8 characters.</p>
      <form className="shell-account-form" onSubmit={changePassword}>
        <PasswordField className="shell-password-field" id="shell-current-password" label="Current password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} />
        <PasswordField className="shell-password-field" id="shell-new-password" label="New password" autoComplete="new-password" minLength={8} value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} />
        <PasswordField className="shell-password-field" id="shell-confirm-password" label="Confirm new password" autoComplete="new-password" minLength={8} value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} />
        <button type="submit" className="shell-secondary-button">Change password</button>
        {passwordMessage && <p className="shell-account-message" role="status">{passwordMessage}</p>}
      </form>
    </section>

    <section className="shell-account-card" aria-labelledby="shell-saved-title">
      <div className="shell-account-card-heading"><div><h2 id="shell-saved-title">Saved properties</h2><p>{savedProperties.length} saved {savedProperties.length === 1 ? "property" : "properties"}</p></div><Link to="/properties">Browse properties</Link></div>
      {savedProperties.length ? <ul className="shell-account-property-list">{savedProperties.map((property) => <li key={property.id}><img src={property.images[0]} alt="" /><span><strong>{property.title}</strong><small>{property.location} · ₦{property.price.toLocaleString("en-NG")}</small></span><button type="button" onClick={() => removeSaved(property.id)} aria-label={`Remove ${property.title} from saved properties`}>Remove</button></li>)}</ul> : <p className="shell-account-empty">You have not saved any properties yet. Use the Save button on a property to add it here.</p>}
    </section>

    <section className="shell-account-card" aria-labelledby="shell-followed-title">
      <div className="shell-account-card-heading"><div><h2 id="shell-followed-title">Followed agents</h2><p>Manage agents whose updates appear in your Following feed.</p></div><Link to="/agents">Find agents</Link></div>
      {followedAgents.length ? <ul className="shell-followed-list">{followedAgents.map((item) => <li key={item.id}><span className="shell-followed-avatar" aria-hidden="true">{item.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.activePostCount} active {item.activePostCount === 1 ? "update" : "updates"}</small></span><button type="button" disabled={followBusy === item.id} onClick={() => unfollow(item.id)}>{followBusy === item.id ? "Updating…" : "Unfollow"}</button></li>)}</ul> : <p className="shell-account-empty">You are not following any agents yet. <Link to="/agents">Explore agents</Link></p>}
    </section>

    <AppearanceControl />
    <UserNotificationSettings user={user} />
    <section className="shell-account-card shell-account-security" aria-labelledby="shell-security-title"><h2 id="shell-security-title">Security and session</h2><p>You are signed in as {user.email}. Sign out to end your current session.</p><button type="button" className="shell-logout-button" onClick={logout}><LogOut size={17} /> Sign out</button></section>
  </main>;
}
