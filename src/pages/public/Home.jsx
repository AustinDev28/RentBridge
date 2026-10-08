import "./Home.css";
import heroImg from "../../assets/hero-house.jpg";
import { Link, useNavigate } from "react-router-dom";
import FeaturedProperties from "../../components/FeaturedProperties.jsx";
import { useState } from "react";

export default function Home() {
  const [search, setSearch] =useState("")
  const [type, setType] = useState ("All");

  const navigate = useNavigate();
  const handleSearch = () => {
    navigate(
      '/properties?locations=${encodeURLComponent (search)}&types=${types}'
    )
  }
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
              to rent and purchase property.
            </p>

            <div className="hero-buttons">
              <Link to="/properties" className="hero-btn primary">
                 Explore Properties
              </Link>

              <Link to="/safetytips" className="hero-btn secondary">
                Safety Tips
              </Link>
            </div>
          </div>
        </div>
      </section>
      <FeaturedProperties/>
      </>
  );
}