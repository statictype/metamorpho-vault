"use client";

interface AnimatedValueProps {
  value: string;
  className?: string;
}

const DIGITS = "0123456789";
const ROW_HEIGHT = "1.5em";

function RollingDigit({ char }: { char: string }) {
  if (!DIGITS.includes(char)) {
    return (
      <span className="inline-block align-top" style={{ height: ROW_HEIGHT, lineHeight: ROW_HEIGHT }}>
        {char}
      </span>
    );
  }

  const digit = Number(char);

  return (
    <span
      className="inline-block align-top"
      style={{ height: ROW_HEIGHT, lineHeight: ROW_HEIGHT, overflow: "hidden" }}
    >
      <span
        className="flex flex-col transition-transform duration-500 ease-out"
        style={{ transform: `translateY(calc(${digit} * -${ROW_HEIGHT}))` }}
      >
        {DIGITS.split("").map((d) => (
          <span key={d} className="block" style={{ height: ROW_HEIGHT, lineHeight: ROW_HEIGHT }}>
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
