import "./Home.css";
import heroImg from "../../assets/hero-house.jpg";
import { Link } from "react-router-dom";
import FeaturedProperties from "../../components/FeaturedProperties.jsx";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section
        className="hero"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="hero-overlay">
          <div className="hero-text">
            <h1>Discover Your Perfect Home</h1>

            <p>
              Discover quality properties, trusted agents, and a simpler way
              to rent.
            </p>

            <div className="search-bar">
              <div className="search-field">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="What location do you want?"
                />
              </div>

              <div className="search-field">
                <label>Property Type</label>
                <select>
                  <option>Apartment</option>
                  <option>1 Bedroom</option>
                  <option>2 Bedroom Flat</option>
                  <option>3 Bedroom Flat</option>
                  <option>Self Contain</option>
                  <option>Duplex</option>
                </select>
              </div>

              <div className="search-field">
                <label>Min Price</label>
                <input type="number" placeholder="₦0" />
              </div>

              <div className="search-field">
                <label>Max Price</label>
                <input type="number" placeholder="Any" />
              </div>

              <button className="search-btn">Search</button>
            </div>
          </div>
        </div>
      </section>
      <FeaturedProperties/>
      </>
  );
}