import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technical Documentation | iReside",
  description: "Deep dive into the architecture, technology stack, and security models of the iReside platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
