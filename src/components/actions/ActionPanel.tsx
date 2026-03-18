"use client";

import { useState } from "react";
import { DepositForm } from "./DepositForm";
import { WithdrawForm } from "./WithdrawForm";

type Tab = "deposit" | "withdraw";

export function ActionPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("deposit");

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex rounded-lg bg-white/5 p-1 mb-5">
        {(["deposit", "withdraw"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              activeTab === tab
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "deposit" ? <DepositForm /> : <WithdrawForm />}
    </div>
  );
}
