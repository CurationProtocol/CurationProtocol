import { useRef, useState } from "react";
import {
  KIND_LABEL,
  YOU_ID,
  applyStake,
  makeSignature,
  pieceById,
  positions,
  profile,
  reputationOf,
  sideLabel,
  tally,
  tokensToReach,
  weightOf,
  type Side,
  type StakeResult,
} from "../model";
import { formatAgo, formatInt, formatRatio, formatWeight } from "../format";
import { useDemo } from "../store";
import { Meter, Seal, StatusPill } from "./Seal";
import { SignModal } from "./Overlays";

type Success = Extract<StakeResult, { ok: true }>;

function parseAmount(text: string) {
  if (!/^\d+$/.test(text)) return null;
  const amount = Number(text);
  if (!Number.isInteger(amount) || amount <= 0) return null;
  return amount;
}

export function Detail({
  pieceId,
  onBack,
  onConnect,
  onStaked,
  onIntegrate,
}: {
  pieceId: string;
  onBack: () => void;
  onConnect: () => void;
  onStaked: (result: Success) => void;
  onIntegrate: () => void;
}) {
  const { state, dispatch } = useDemo();
  const piece = pieceById(pieceId);
  const [side, setSide] = useState<Side>("validate");
  const [amountText, setAmountText] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState<{
    amount: number;
    side: Side;
    weight: number;
    signature: string;
    id: string;
    now: number;
  } | null>(null);
  const amountKey = useRef("");

  if (!piece) {
    return (
      <section className="page">
        <button className="back" type="button" onClick={onBack}>
          ← Pieces
        </button>
        <p className="empty">That piece is not in this cohort.</p>
      </section>
    );
  }

  const score = tally(state, piece.id);
  const closed = score.status === "verificado" || score.status === "rechazado";
  const multiplier = weightOf(reputationOf(state, YOU_ID));
  const suggestion = tokensToReach(score.net, piece.threshold, side, multiplier, state.balanceCur);
  const key = `${piece.id}:${side}:${suggestion ?? "x"}`;
  if (amountKey.current !== key) {
    amountKey.current = key;
    setAmountText(String(suggestion && suggestion > 0 ? suggestion : 50));
  }

  const parsed = parseAmount(amountText);
  const delta = (parsed ?? 0) * multiplier;
  const nextNet = side === "validate" ? score.net + delta : score.net - delta;
  const willVerify = parsed !== null && nextNet >= piece.threshold;
  const willReject = parsed !== null && -nextNet >= piece.threshold;
  const over = parsed !== null && parsed > state.balanceCur;
  const rows = positions(state, piece.id);
  const mine = rows.filter((row) => row.curatorId === YOU_ID);

  function submit() {
    if (!state.connected) {
      onConnect();
      return;
    }
    if (parsed === null) {
      setError("Enter a whole amount.");
      return;
    }
    if (over) {
      setError("That exceeds your available balance.");
      return;
    }
    const now = Date.now();
    setError(null);
    setSigning({
      amount: parsed,
      side,
      weight: parsed * multiplier,
      signature: makeSignature(now),
      id: `lock-${now}`,
      now,
    });
  }

  function confirm() {
    if (!signing) return;
    const result = applyStake(state, {
      pieceId: piece!.id,
      side: signing.side,
      amount: signing.amount,
      now: signing.now,
      id: signing.id,
      signature: signing.signature,
    });
    setSigning(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    dispatch({
      type: "stake",
      pieceId: piece!.id,
      side: signing.side,
      amount: signing.amount,
      now: signing.now,
      id: signing.id,
      signature: signing.signature,
    });
    onStaked(result);
  }

  const buttonLabel = !state.connected
    ? "Connect wallet to lock"
    : parsed === null
      ? "Set an amount"
      : willVerify
        ? `Lock ${formatInt(parsed)} CUR and issue the seal`
        : willReject
          ? `Lock ${formatInt(parsed)} CUR and reject`
          : `Lock ${formatInt(parsed)} CUR ${sideLabel(side)}`;

  const chips = [50, 100, ...(suggestion && suggestion > 0 && suggestion !== 50 && suggestion !== 100 ? [suggestion] : [])];

  return (
    <section className="page">
      <button className="back" type="button" onClick={onBack}>
        ← Pieces
      </button>
      <div className="detail">
        <article>
          <div className="meta">
            <StatusPill status={score.status} />
            <span>
              {KIND_LABEL[piece.kind]} · {piece.source} · {formatAgo(piece.publishedAt)}
            </span>
          </div>
          <h1>{piece.title}</h1>
          <p className="piece-id">{piece.id}</p>
          <blockquote className="enunciado">
            <span>Claim</span>
            {piece.claim}
          </blockquote>
          <p className="summary">{piece.summary}</p>
          <div className="tags">
            {piece.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <h2>Evidence that counts</h2>
          <ul className="checks">
            {piece.checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
          <h2>Locks</h2>
          <ul className="positions">
            {rows.map((row) => {
              const curator = profile(state, row.curatorId);
              return (
                <li key={`${row.curatorId}-${row.side}`} className={row.curatorId === YOU_ID ? "mine" : undefined}>
                  <div>
                    <strong>{curator.name}</strong>
                    <span>
                      {curator.handle} · ×{formatRatio(weightOf(row.reputation))} at lock
                    </span>
                  </div>
                  <div className={row.side === "validate" ? "side validate" : "side dispute"}>
                    <b>{row.side === "validate" ? "For" : "Against"}</b>
                    <span>
                      {formatInt(row.amount)} CUR · weight {formatWeight(row.weight)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
        <aside className="stake-card">
          <Meter validate={score.validate} dispute={score.dispute} threshold={piece.threshold} thick />
          {closed ? (
            <div className="closed">
              <Seal status={score.status as "verificado" | "rechazado"} size={120} />
              <h3>{score.status === "verificado" ? "Verified by the community" : "Rejected by the community"}</h3>
              <p>
                {score.status === "verificado"
                  ? "Curation is closed. The seal can already be read through the API."
                  : "Curation is closed. The dispute crossed the threshold."}
              </p>
              {mine.map((row) => (
                <p key={row.side} className="mine-note">
                  You locked {formatInt(row.amount)} CUR {row.side === "validate" ? "for" : "against"}.
                </p>
              ))}
              <button className="btn primary" type="button" onClick={onIntegrate}>
                {score.status === "verificado" ? "See it in a reader" : "See the status in the API"}
              </button>
            </div>
          ) : (
            <div className="stake-form">
              <div className="side-toggle" role="group" aria-label="Side of the lock">
                <button
                  type="button"
                  className={side === "validate" ? "on" : undefined}
                  aria-pressed={side === "validate"}
                  onClick={() => setSide("validate")}
                >
                  Validate
                </button>
                <button
                  type="button"
                  className={side === "dispute" ? "on dispute" : undefined}
                  aria-pressed={side === "dispute"}
                  onClick={() => setSide("dispute")}
                >
                  Dispute
                </button>
              </div>
              <div className="chips">
                {chips.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={parsed === amount ? "chip on" : "chip"}
                    onClick={() => setAmountText(String(amount))}
                  >
                    {formatInt(amount)}
                    {suggestion === amount ? (side === "validate" ? " · issues the seal" : " · rejects") : ""}
                  </button>
                ))}
              </div>
              <label className="amount-field">
                <span>Amount</span>
                <input
                  inputMode="numeric"
                  value={amountText}
                  onChange={(event) => {
                    setAmountText(event.target.value.replace(/[^\d]/g, ""));
                    setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submit();
                  }}
                />
                <em>CUR</em>
              </label>
              <p className="balance-line">
                Available {formatInt(state.balanceCur)} CUR · multiplier ×{formatRatio(multiplier)}
              </p>
              {parsed !== null ? (
                <p className={willVerify || willReject ? "preview seal-line" : "preview"}>
                  Net weight moves from {formatWeight(score.net)} to {formatWeight(nextNet)}
                  {willVerify ? " and the seal is issued." : willReject ? " and the piece is rejected." : "."}
                </p>
              ) : null}
              {error || over ? <p className="form-error">{error ?? "That exceeds your available balance."}</p> : null}
              <button className={`btn primary ${side === "dispute" ? "dispute" : ""}`} type="button" onClick={submit} disabled={state.connected && (parsed === null || over)}>
                {buttonLabel}
              </button>
              <p className="fine">
                The amount leaves your balance and sits in the piece vault. The multiplier is fixed when you lock. After 7
                days the protocol releases the vault if the seal has already closed. If your side lost, the lock runs one more cycle.
              </p>
            </div>
          )}
        </aside>
      </div>
      {signing ? (
        <SignModal
          piece={piece}
          side={signing.side}
          amount={signing.amount}
          weight={signing.weight}
          signature={signing.signature}
          onCancel={() => setSigning(null)}
          onSigned={confirm}
        />
      ) : null}
    </section>
  );
}
