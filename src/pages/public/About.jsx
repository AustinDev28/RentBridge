import "./About.css";
import { Link } from "react-router-dom";

/* ---------- Icons (same style as FeaturedProperties icons) ---------- */
const Icon = ({ children, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
const ShieldCheck = () => (
  <Icon><path d="M12 2.5l7.5 3.5v5c0 5-3.2 8.8-7.5 10.5C7.7 19.8 4.5 16 4.5 11V6L12 2.5z" /><path d="M8.8 12l2.3 2.3 4.1-4.6" /></Icon>
);
const Search = () => (
  <Icon><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Icon>
);
const Users = () => (
  <Icon><path d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></Icon>
);
const Handshake = () => (
  <Icon><path d="M8 13l3 3 7-7" /><path d="M3 12l4-4 4 2 3-3 4 4" /><path d="M2 12l5 5M22 12l-5 5" /></Icon>
);
const Check = () => (
  <Icon size={16}><path d="M20 6L9 17l-5-5" /></Icon>
);
const ArrowRight = () => (
  <Icon size={16}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
);

const VALUES = [
  {
    icon: <ShieldCheck />,
    title: "Verified listings",
    text: "Every property that carries our verified badge has been checked by our team before it goes live, so you browse with confidence.",
  },
  {
    icon: <Search />,
    title: "Simple to search",
    text: "Filter by location, price and whether you want to rent or buy, so you spend less time scrolling and more time finding the right place.",
  },
  {
    icon: <Users />,
    title: "Trusted agents",
    text: "We work with agents who are accountable to real people, not anonymous listings, so you always know who you're dealing with.",
  },
  {
    icon: <Handshake />,
    title: "Fair for everyone",
    text: "Clear pricing, honest descriptions, and no hidden listing games — for renters, buyers, landlords and sellers alike.",
  },
];

const PROMISES = [
  "Every listing is reviewed before it's marked verified",
  "Clear, upfront pricing with no hidden listing fees",
  "Direct contact with the agent, no middleman delays",
];

export default function AboutSection() {
  return (
    <section className="about" id="about">
      <div className="about__inner">
        <header className="about__header">
          <span className="about__eyebrow">About RentBridge</span>
          <h2>A simpler way to rent or buy a home</h2>
          <p>
            RentBridge connects renters, buyers, landlords and agents in one place, so finding
            your next home doesn't mean juggling five different sites and a dozen phone calls.
            We built this platform to make property hunting faster, clearer and safer — from
            the first search to the signed agreement.
          </p>
        </header>

        <div className="about__mission about__mission--centered">
          <span className="about__kicker">Our mission</span>
          <h3>Property hunting, without the guesswork</h3>
          <p>
            Too many people lose time and money to unverified listings and agents who go
            quiet after the first call. RentBridge exists to fix that — pairing a platform
            that's easy to search with a standard of trust we hold every listing to.
          </p>

          <ul className="about__promises about__promises--row">
            {PROMISES.map((p) => (
              <li key={p}>
                <span className="about__check"><Check /></span>
                {p}
              </li>
            ))}
          </ul>

          <Link to="/properties" className="about__cta">
            Browse properties <ArrowRight />
          </Link>
        </div>

        <div className="about__divider">
          <span>Why choose RentBridge</span>
        </div>

        <div className="about__grid">
          {VALUES.map((v, i) => (
            <div className="value-card" key={v.title}>
              <span className="value-card__index">{String(i + 1).padStart(2, "0")}</span>
              <div className="value-card__icon">{v.icon}</div>
              <h4>{v.title}</h4>
              <p>{v.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}