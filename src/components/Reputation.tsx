import { useEffect, useRef, useState } from "react";
import {
  PROGRAM_ID,
  YOU_ID,
  leaderboard,
  lockedBy,
  pieceById,
  profile,
  rankOf,
  weightOf,
} from "../model";
import { formatInt, formatPct, formatRatio, formatWeight, shortAddress } from "../format";
import { useDemo } from "../store";

const REP_ACCOUNT = "9RepDemo7kXm4pQeR8nL2sA9WcVd3uYbT6";

export function Reputation({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useDemo();
  const you = profile(state, YOU_ID);
  const board = leaderboard(state);
  const max = board[0]?.reputation ?? 1;
  const mine = state.locks.filter((entry) => entry.curatorId === YOU_ID);
  const [flash, setFlash] = useState(false);
  const previous = useRef(you.reputation);

  useEffect(() => {
    if (you.reputation === previous.current) return;
    previous.current = you.reputation;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 1400);
    return () => window.clearTimeout(timer);
  }, [you.reputation]);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Reputation</h1>
          <p className="lede">A lock's weight depends on who signs it. Calling the seal correctly raises the account.</p>
        </div>
      </header>
      <div className="rep-grid">
        <article className="panel account">
          <p className="eyebrow">Reputation account · simulated on-chain</p>
          <h2 className={flash ? "flash" : undefined}>
            {you.name}
            <small>#{rankOf(state)}</small>
          </h2>
          <p className="handle">{you.handle}</p>
          <dl className="kv">
            <div>
              <dt>Program</dt>
              <dd title={PROGRAM_ID}>{shortAddress(PROGRAM_ID, 6, 4)}</dd>
            </div>
            <div>
              <dt>Account</dt>
              <dd title={REP_ACCOUNT}>{shortAddress(REP_ACCOUNT, 4, 4)}</dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd className={flash ? "flash" : undefined}>{formatInt(you.reputation)}</dd>
            </div>
            <div>
              <dt>Resolved</dt>
              <dd>{formatInt(you.resolved)}</dd>
            </div>
            <div>
              <dt>Correct</dt>
              <dd>{formatInt(you.correct)}</dd>
            </div>
            <div>
              <dt>Accuracy</dt>
              <dd>{formatPct(you.resolved ? you.correct / you.resolved : 0)}</dd>
            </div>
            <div>
              <dt>Multiplier</dt>
              <dd>×{formatRatio(weightOf(you.reputation))}</dd>
            </div>
            <div>
              <dt>Locked</dt>
              <dd>{formatInt(lockedBy(state))} CUR</dd>
            </div>
          </dl>
          <pre className="formula">{`weight = amount × (0.60 + reputation / 1000)
seal if validation − dispute ≥ 560
the multiplier is fixed when you lock`}</pre>
        </article>
        <article className="panel">
          <h2>Cohort</h2>
          <ol className="board">
            {board.map((curator, index) => (
              <li key={curator.id} className={curator.id === YOU_ID ? "mine" : undefined}>
                <span className="rank">{index + 1}</span>
                <span className="who">
                  <strong>{curator.name}</strong>
                  <small>{curator.handle}</small>
                </span>
                <span className="bar">
                  <span style={{ width: `${(curator.reputation / max) * 100}%` }} />
                </span>
                <span className="rep-num">{formatInt(curator.reputation)}</span>
                <span className="acc">{formatPct(curator.resolved ? curator.correct / curator.resolved : 0)}</span>
                <span className="mult">×{formatRatio(weightOf(curator.reputation))}</span>
              </li>
            ))}
          </ol>
          <p className="fine">In this simulation only your account is written. The rest of the cohort already has its history.</p>
        </article>
      </div>
      <article className="panel locks-panel">
        <h2>Your locks</h2>
        {mine.length === 0 ? (
          <p className="empty">You have not locked CUR yet. The Helio piece is one lock away from the seal.</p>
        ) : (
          <ul className="your-locks">
            {mine.map((entry) => {
              const piece = pieceById(entry.pieceId);
              return (
                <li key={entry.id}>
                  <button type="button" onClick={() => onOpen(entry.pieceId)}>
                    <strong>{piece?.title ?? entry.pieceId}</strong>
                    <span>
                      {formatInt(entry.amount)} CUR {entry.side === "validate" ? "for" : "against"} · weight{" "}
                      {formatWeight(entry.amount * weightOf(entry.reputation))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </section>
  );
}
