import { Navigate } from "react-router-dom";
import { getCurrentAgent } from "./authService.js";

export default function AgentRouteGuard({ children }) {
  return getCurrentAgent() ? children : <Navigate to="/agent/login" replace />;
}
