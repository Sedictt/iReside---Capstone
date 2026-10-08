import DocsLayout from "@/components/docs/DocsLayout";

/** Long-form documentation site: header, sidebar navigation, and breadcrumbs. */
export default function DocsSiteLayout({ children }: { children: React.ReactNode }) {
  return <DocsLayout>{children}</DocsLayout>;
}
