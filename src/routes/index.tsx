import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getCurrentUser, ROLE_HOMES } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    const u = getCurrentUser();
    navigate({ to: u ? ROLE_HOMES[u.role] : "/login" });
  }, [navigate]);
  return null;
}
