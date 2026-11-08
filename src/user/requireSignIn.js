import { getCurrentAgent } from "../agent/authService.js";
import { getCurrentUser } from "./userAuthService.js";

export function requireSignIn(navigate, event) {
  if (getCurrentUser() || getCurrentAgent()) return true;
  event?.preventDefault();
  navigate("/user/login");
  return false;
}
