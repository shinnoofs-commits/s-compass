// This file is intentionally simple as AuthLayout handles the visual structure.
// Specific logic for auth pages can be added here if needed (e.g. providers for client-side auth state)

export default function AuthenticationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
