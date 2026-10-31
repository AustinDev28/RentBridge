import "./Home.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, Compass, Home as HomeIcon, Bookmark, Plus, UserRound, Search,
} from "lucide-react";
import logo from "../../assets/logo.jpg";
import FeaturedProperties from "../../components/FeaturedProperties.jsx";
import { useUserPreferences } from "../../user/UserPreferences.jsx";

const NAV_ITEMS = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "discover", label: "Discover", Icon: Compass },
  { id: "saved", label: "Saved", Icon: Bookmark },
  { id: "list", label: "List Property", Icon: Plus, href: "/agent/login" },
  { id: "profile", label: "Profile", Icon: UserRound },
];

export default function Home() {
  const { user, theme } = useUserPreferences();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("home");
  const [savedIds, setSavedIds] = useState(() => new Set());

  const toggleSaved = (id) => setSavedIds((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const feedTitle = active === "saved" ? "Saved properties" : active === "discover" ? "Discover properties" : "Your property feed";

  return (
    <div className="home-feed" data-theme={theme}>
      <header className="feed-header">
        <Link className="feed-brand" to="/" aria-label="RentBridge home">
          <img src={logo} alt="" />
          <span>RentBridge</span>
        </Link>
        <label className="feed-search">
          <Search size={18} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search locations or properties"
            aria-label="Search locations or properties"
          />
        </label>
        <div className="feed-header-actions">
          <button className="feed-icon-button" type="button" aria-label="Notifications">
            <Bell size={19} />
            <span className="notification-dot" />
          </button>
          <Link className="feed-avatar" to={user ? "/user/profile" : "/user/login"} aria-label={user ? "Open your profile and settings" : "Sign in to your profile"}>
            <UserRound size={19} />
          </Link>
        </div>
      </header>

      <main className="feed-main">
        <section className="feed-welcome">
          <div>
            <p className="feed-eyebrow">A better way to find your place</p>
            <h1>Find a place that feels like yours.</h1>
            <p className="feed-intro">Explore homes shared by trusted agents across Lagos.</p>
          </div>
          <Link to="/properties" className="feed-explore-link">Advanced search <span aria-hidden="true">→</span></Link>
        </section>

        <section className="feed-content" aria-label="Property discovery feed">
          <div className="feed-section-heading">
            <div>
              <h2>{feedTitle}</h2>
              <p>{active === "saved" ? "The places you’ve bookmarked" : "Fresh listings, selected for you"}</p>
            </div>
            <span className="feed-live"><i /> Verified homes</span>
          </div>
          {active === "discover" && (
            <div className="discover-chips" aria-label="Popular areas">
              {["Lekki", "Ikoyi", "Victoria Island", "Yaba"].map((place) => (
                <button key={place} type="button" onClick={() => setSearch(place)}>{place}</button>
              ))}
            </div>
          )}
          <FeaturedProperties
            searchFilters={{ location: search }}
            likedIds={savedIds}
            onToggleLike={toggleSaved}
            savedOnly={active === "saved"}
            feedMode
          />
        </section>
      </main>

      <nav className="feed-bottom-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ id, label, Icon, href }) => (href || id === "profile") ? (
          <Link key={id} to={id === "profile" ? (user ? "/user/profile" : "/user/login") : href} className="feed-nav-item" aria-label={label}>
            <Icon size={20} strokeWidth={1.9} />
            <span>{label}</span>
          </Link>
        ) : (
          <button
            key={id}
            type="button"
            className={`feed-nav-item ${active === id ? "is-active" : ""}`}
            aria-current={active === id ? "page" : undefined}
            onClick={() => setActive(id)}
          >
            <Icon size={20} strokeWidth={1.9} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
