"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";

const Providers = dynamic(
  () => import("./providers").then((mod) => mod.Providers),
  { ssr: false }
);

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <Header />
      {children}
    </Providers>
  );
}
