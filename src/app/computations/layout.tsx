import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Computations",
  description: "Confidential MPC computations across all Arcium clusters",
};

export default function ComputationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
