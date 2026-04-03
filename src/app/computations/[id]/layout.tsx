import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Computation Details",
  description: "Arcium MPC computation execution details and lifecycle",
};

export default function ComputationDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
