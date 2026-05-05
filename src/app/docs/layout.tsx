import DocsLayout from "@/components/docs/DocsLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | iReside",
  description: "Comprehensive guides and documentation for iReside property management platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsLayout>{children}</DocsLayout>;
}
