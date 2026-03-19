"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";

function ShellSkeleton() {
  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-6 w-28 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-white/10 rounded-lg animate-pulse" />
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            <div>
              <div className="h-7 w-48 bg-white/10 rounded animate-pulse mb-1" />
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-7 w-24 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-4" />
              <div className="h-64 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-4" />
              <div className="h-32 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="h-10 bg-white/10 rounded-lg animate-pulse mb-5" />
              <div className="h-20 bg-white/10 rounded-lg animate-pulse mb-4" />
              <div className="h-12 bg-white/10 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

const Providers = dynamic(
  () => import("./providers").then((mod) => mod.Providers),
  { ssr: false, loading: () => <ShellSkeleton /> }
);

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <Header />
      {children}
    </Providers>
  );
}
