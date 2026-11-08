import { useCallback, useEffect, useState } from "react";
import { getCurrentAgent } from "../authService.js";
import { getPostingAccess, getStatus, getVerificationSnapshot } from "./verificationService.js";

export function useVerification(agentId = getCurrentAgent()?.id) {
  const [status, setStatus] = useState(() => agentId ? getVerificationSnapshot(agentId) : null);
  const [postingAccess, setPostingAccess] = useState(null);

  const refresh = useCallback(async () => {
    if (!agentId) return;
    const [nextStatus, nextAccess] = await Promise.all([getStatus(agentId), getPostingAccess(agentId)]);
    setStatus(nextStatus);
    setPostingAccess(nextAccess);
  }, [agentId]);

  useEffect(() => {
    refresh();
    window.addEventListener("rentbridge-verification-updated", refresh);
    return () => window.removeEventListener("rentbridge-verification-updated", refresh);
  }, [refresh]);

  return {
    level: status?.level || 0,
    status,
    canPublish: postingAccess?.allowed ?? (status?.level >= 2 && !status?.suspended),
    dailyLimit: postingAccess?.dailyLimit ?? status?.dailyLimit ?? 0,
    postsRemaining: postingAccess?.remaining ?? status?.dailyLimit ?? 0,
    refresh,
  };
}
