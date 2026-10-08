import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | iReside",
  description: "User manuals and guides for the iReside property management platform.",
};

/**
 * /docs itself is the full-screen interactive manual. The long-form guides live in
 * the (site) route group, which adds the documentation site header and sidebar.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
