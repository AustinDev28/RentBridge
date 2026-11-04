import { Navigate } from "react-router-dom";
import { useUserPreferences } from "../../user/UserPreferences.jsx";

// Keep the old profile URL working while using one account settings screen.
export default function UserProfile() {
  const { user } = useUserPreferences();
  return <Navigate to={user ? "/account" : "/user/login"} replace />;
}
