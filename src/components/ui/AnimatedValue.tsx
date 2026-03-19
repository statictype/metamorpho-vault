"use client";

interface AnimatedValueProps {
  value: string;
  className?: string;
}

const DIGITS = "0123456789";

function RollingDigit({ char }: { char: string }) {
  if (!DIGITS.includes(char)) {
    return <>{char}</>;
  }

  const digit = Number(char);

  return (
    <span
      className="inline-block"
      style={{ height: "1lh", overflow: "clip" }}
    >
      <span
        className="flex flex-col transition-transform duration-500 ease-out"
        style={{ transform: `translateY(calc(${digit} * -1lh))` }}
      >
        {DIGITS.split("").map((d) => (
          <span key={d} className="block" style={{ height: "1lh" }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export function AnimatedValue({ value, className }: AnimatedValueProps) {
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }} aria-label={value}>
      {value.split("").map((char, i, arr) => (
        <RollingDigit key={arr.length - i} char={char} />
      ))}
    </span>
  );
}
