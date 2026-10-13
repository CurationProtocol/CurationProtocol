import { useId } from "react";
import type { PieceStatus } from "../model";
import { formatWeight } from "../format";

export function Seal({
  status,
  size = 96,
  animate = false,
}: {
  status: "verificado" | "rechazado";
  size?: number;
  animate?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const verified = status === "verificado";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={animate ? "seal stamp" : "seal"}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={uid} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={verified ? "#e06a52" : "#7a7368"} />
          <stop offset="55%" stopColor={verified ? "#c44832" : "#5e584f"} />
          <stop offset="100%" stopColor={verified ? "#862a1b" : "#3a3631"} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill={`url(#${uid})`} />
      <circle cx="50" cy="50" r="39.5" fill="none" stroke="#f6e7d2" strokeOpacity="0.88" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="#f6e7d2" strokeOpacity="0.4" strokeWidth="0.7" />
      {verified ? (
        <path
          d="M33 51.5 45.2 63.2 68.5 37.5"
          fill="none"
          stroke="#f6e7d2"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M37 37 63 63 M63 37 37 63"
          fill="none"
          stroke="#f6e7d2"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function StatusPill({ status }: { status: PieceStatus }) {
  const label = {
    curacion: "In curation",
    disputa: "Contested",
    verificado: "Verified",
    rechazado: "Rejected",
  }[status];
  return <span className={`pill ${status}`}>{label}</span>;
}

export function Meter({
  validate,
  dispute,
  threshold,
  thick = false,
}: {
  validate: number;
  dispute: number;
  threshold: number;
  thick?: boolean;
}) {
  const v = Math.max(0, Math.min(100, (validate / threshold) * 100));
  const d = Math.max(0, Math.min(100, (dispute / threshold) * 100));
  return (
    <div className={thick ? "meters thick" : "meters"}>
      <div>
        <div className="meter-label">
          <span>Validation</span>
          <span>
            {formatWeight(validate)} / {threshold}
          </span>
        </div>
        <div className="track">
          <div className="fill gold" style={{ width: `${v}%` }} />
        </div>
      </div>
      <div>
        <div className="meter-label">
          <span>Dispute</span>
          <span>
            {formatWeight(dispute)} / {threshold}
          </span>
        </div>
        <div className="track">
          <div className="fill clay" style={{ width: `${d}%` }} />
        </div>
      </div>
    </div>
  );
}

export function SealWidget({
  status,
  net,
  threshold,
  theme,
}: {
  status: PieceStatus;
  net: number;
  threshold: number;
  theme: "light" | "dark";
}) {
  if (status === "verificado" || status === "rechazado") {
    return (
      <div className={`widget ${theme}`}>
        <Seal status={status} size={46} />
        <div>
          <strong>{status === "verificado" ? "Verified by the community" : "Rejected by the community"}</strong>
          <span>Curation Protocol · weight {formatWeight(net)}</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`widget ${theme} pending`}>
      <span className="pending-mark" aria-hidden="true" />
      <div>
        <strong>{status === "disputa" ? "Contested" : "In curation"}</strong>
        <span>
          {formatWeight(net)} / {threshold} weight
        </span>
      </div>
    </div>
  );
}

export function ProgressMark({ net, threshold }: { net: number; threshold: number }) {
  const pct = Math.max(0, Math.min(99, Math.round((net / threshold) * 100)));
  return (
    <div className="ring" style={{ ["--p" as string]: `${Math.max(0, (net / threshold) * 100)}%` }}>
      <span>{pct}</span>
    </div>
  );
}
