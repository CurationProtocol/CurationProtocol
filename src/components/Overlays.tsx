import { useEffect, useRef, useState } from "react";
import { PROGRAM_ID, sideLabel, type Piece, type Side, type StakeResult } from "../model";
import { delay, formatInt, formatWeight, shortAddress } from "../format";
import { Seal } from "./Seal";

type Success = Extract<StakeResult, { ok: true }>;

function useEsc(onClose: () => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

function useScrollLock() {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
}

export function WalletModal({
  balance,
  onClose,
  onConnect,
}: {
  balance: number;
  onClose: () => void;
  onConnect: () => void;
}) {
  const [phase, setPhase] = useState<"ask" | "wait">("ask");
  const live = useRef(true);
  useScrollLock();
  useEsc(onClose);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  async function connect() {
    setPhase("wait");
    await delay(680);
    if (live.current) onConnect();
  }

  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">Solana · Phantom</p>
        <h2 id="wallet-title">Connect wallet</h2>
        <p className="modal-copy">
          This demo uses a local wallet. The signature never leaves the browser or touches the network.
        </p>
        <div className="wallet-card">
          <span className="wallet-mark">P</span>
          <span>
            <strong>Phantom</strong>
            <small>demo.sol · {formatInt(balance)} CUR</small>
          </span>
        </div>
        <div className="modal-actions">
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" type="button" onClick={connect} disabled={phase === "wait"}>
            {phase === "wait" ? "Waiting for confirmation…" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SignModal({
  piece,
  side,
  amount,
  weight,
  signature,
  onCancel,
  onSigned,
}: {
  piece: Piece;
  side: Side;
  amount: number;
  weight: number;
  signature: string;
  onCancel: () => void;
  onSigned: () => void;
}) {
  const [phase, setPhase] = useState<"review" | "sending" | "done">("review");
  const live = useRef(true);
  useScrollLock();
  useEsc(() => {
    if (phase === "review") onCancel();
  });
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  async function sign() {
    setPhase("sending");
    await delay(760);
    if (!live.current) return;
    setPhase("done");
    await delay(480);
    if (!live.current) return;
    onSigned();
  }

  return (
    <div className="overlay" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="sign-title">
        <p className="eyebrow">Phantom · signature request</p>
        <h2 id="sign-title">{phase === "done" ? "Confirmed" : phase === "sending" ? "Sending to Solana" : "Lock CUR"}</h2>
        <dl className="tx">
          <div>
            <dt>Program</dt>
            <dd title={PROGRAM_ID}>{shortAddress(PROGRAM_ID, 6, 4)}</dd>
          </div>
          <div>
            <dt>Instruction</dt>
            <dd>lock_tokens</dd>
          </div>
          <div>
            <dt>Piece</dt>
            <dd title={piece.pda}>{piece.id}</dd>
          </div>
          <div>
            <dt>Side</dt>
            <dd>{sideLabel(side)}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>{formatInt(amount)} CUR</dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>{formatWeight(weight)}</dd>
          </div>
          <div>
            <dt>Fee</dt>
            <dd>0.000005 SOL</dd>
          </div>
        </dl>
        {phase === "done" ? (
          <p className="sig-line">Signature {shortAddress(signature, 8, 6)}</p>
        ) : (
          <p className="modal-note">Simulated signature. Nothing is sent to the network.</p>
        )}
        <div className="modal-actions">
          <button className="btn" type="button" onClick={onCancel} disabled={phase !== "review"}>
            Reject
          </button>
          <button className="btn primary" type="button" onClick={sign} disabled={phase !== "review"}>
            {phase === "review" ? "Sign and send" : phase === "sending" ? "Propagating…" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Ceremony({
  result,
  title,
  onPiece,
  onReader,
}: {
  result: Success;
  title: string;
  onPiece: () => void;
  onReader: () => void;
}) {
  useScrollLock();
  return (
    <div className="overlay ceremony-overlay" role="dialog" aria-modal="true" aria-labelledby="seal-title">
      <div className="ceremony">
        <div className="ceremony-seal">
          <Seal status="verificado" size={168} animate />
        </div>
        <p className="eyebrow gold">Seal issued</p>
        <h2 id="seal-title">Verified by the community</h2>
        <p className="ceremony-piece">{title}</p>
        <ul className="ceremony-stats">
          <li>
            <span>Net weight</span>
            <strong>{formatWeight(result.net)}</strong>
          </li>
          {result.decisive ? (
            <li>
              <span>Reputation</span>
              <strong>
                {formatInt(result.repBefore)} → {formatInt(result.repAfter)}
              </strong>
            </li>
          ) : null}
          {result.rankAfter < result.rankBefore ? (
            <li>
              <span>Rank</span>
              <strong>
                {result.rankBefore} → {result.rankAfter}
              </strong>
            </li>
          ) : null}
        </ul>
        <p className="sig-line">Tx {shortAddress(result.signature, 8, 6)}</p>
        <div className="modal-actions">
          <button className="btn" type="button" onClick={onPiece}>
            View piece
          </button>
          <button className="btn primary" type="button" onClick={onReader}>
            See it in a reader
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ children, onClose }: { children: string; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3400);
    return () => window.clearTimeout(timer);
  }, [onClose, children]);
  return (
    <div className="toast" role="status">
      <span>{children}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notice">
        ×
      </button>
    </div>
  );
}
