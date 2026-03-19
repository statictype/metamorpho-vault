"use client";

import { formatUsdc } from "@/lib/format";
import { AnimatedValue } from "@/components/ui/AnimatedValue";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  maxAmount?: bigint;
  tokenSymbol: string;
  label: string;
  disabled?: boolean;
}

export function AmountInput({
  value,
  onChange,
  maxAmount,
  tokenSymbol,
  label,
  disabled,
}: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty, or valid decimal number
    if (val === "" || /^\d*\.?\d{0,6}$/.test(val)) {
      onChange(val);
    }
  };

  const handleMax = () => {
    if (maxAmount !== undefined) {
      // Convert bigint to decimal string (6 decimals for USDC)
      const whole = maxAmount / BigInt(1e6);
      const frac = maxAmount % BigInt(1e6);
      const fracStr = frac.toString().padStart(6, "0").replace(/0+$/, "");
      onChange(fracStr ? `${whole}.${fracStr}` : `${whole}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm text-gray-400">{label}</label>
        {maxAmount !== undefined && (
          <span className="text-xs text-gray-500">
            Balance: <AnimatedValue value={`${formatUsdc(maxAmount)} ${tokenSymbol}`} />
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-blue-500/50 transition-colors">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-gray-600 disabled:opacity-50"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          {maxAmount !== undefined && maxAmount > BigInt(0) && (
            <button
              type="button"
              onClick={handleMax}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            >
              MAX
            </button>
          )}
          <span className="text-sm text-gray-400 font-medium">{tokenSymbol}</span>
        </div>
      </div>
    </div>
  );
}
