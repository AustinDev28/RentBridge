import { useEffect, useState } from "react";
import { timeLeft } from "../utils/expiry.js";

export default function ExpiryBadge({ post }) {
  const [remaining, setRemaining] = useState(() => timeLeft(post));
  useEffect(() => {
    const update = () => setRemaining(timeLeft(post));
    update();
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, [post]);
  const urgent = remaining.hours < 1;
  return <span className={`rb-expiry ${urgent ? "is-urgent" : ""}`} aria-label={`Expires in ${remaining.hours} hours and ${remaining.minutes} minutes`}>Expires in {remaining.hours}h {remaining.minutes}m</span>;
}
