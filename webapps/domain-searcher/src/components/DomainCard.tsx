import type { DomainResult, TldPrice } from "../lib/types";

const statusStyles: Record<string, string> = {
  available: "bg-success/10 border-success text-success",
  taken: "bg-base-200 border-base-300 opacity-50",
  error: "bg-warning/10 border-warning text-warning",
  pending: "bg-base-200 border-base-300",
};

const statusLabels: Record<string, string> = {
  available: "Available",
  taken: "Taken",
  error: "Error",
};

interface Props {
  result: DomainResult;
  price?: TldPrice;
}

export default function DomainCard({ result, price }: Props) {
  const style = statusStyles[result.status];

  function copyDomain() {
    navigator.clipboard.writeText(result.domain);
  }

  return (
    <button
      onClick={copyDomain}
      title={
        result.status === "error"
          ? result.error
          : `Click to copy ${result.domain}`
      }
      className={`border rounded-lg p-2 text-center cursor-pointer transition-transform hover:scale-105 ${style}`}
    >
      <div className="font-mono text-sm font-bold">.{result.tld}</div>
      {result.status === "pending" ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <>
          <div className="text-xs mt-0.5">{statusLabels[result.status]}</div>
          <div className="text-xs mt-0.5 opacity-70">
            {price ? `$${price.registration.toFixed(2)}/yr` : "N/A"}
          </div>
          {price && (
            <div className="text-[10px] opacity-40">{price.source}</div>
          )}
        </>
      )}
    </button>
  );
}
