import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/cadastro")({
  beforeLoad: () => {
    throw redirect({ to: "/auth/login" });
  },
});