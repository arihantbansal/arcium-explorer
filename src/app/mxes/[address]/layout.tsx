import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MXE Details",
  description: "Multi-party execution environment account details",
};

export default function MxeDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
