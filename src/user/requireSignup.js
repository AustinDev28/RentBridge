import { getCurrentAgent } from "../agent/authService.js";
import { getCurrentUser } from "./userAuthService.js";

export function requireSignup(navigate, event) {
  if (getCurrentUser() || getCurrentAgent()) return true;
  event?.preventDefault();
  navigate("/user/signup");
  return false;
}
