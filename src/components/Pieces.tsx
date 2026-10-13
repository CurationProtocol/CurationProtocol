import { useState } from "react";
import {
  KIND_LABEL,
  PIECES,
  closestToSeal,
  networkStats,
  tally,
  type DemoState,
  type Piece,
  type PieceStatus,
} from "../model";
import { formatAgo, formatInt, formatWeight } from "../format";
import { Meter, ProgressMark, Seal, StatusPill } from "./Seal";

type Filter = "todas" | "noticias" | "proyectos" | "abiertas" | "sello";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todas", label: "All" },
  { id: "noticias", label: "News" },
  { id: "proyectos", label: "Projects" },
  { id: "abiertas", label: "Open" },
  { id: "sello", label: "Sealed" },
];

function matches(piece: Piece, status: PieceStatus, filter: Filter) {
  if (filter === "noticias") return piece.kind === "noticia";
  if (filter === "proyectos") return piece.kind === "proyecto";
  if (filter === "abiertas") return status === "curacion" || status === "disputa";
  if (filter === "sello") return status === "verificado";
  return true;
}

function visiblePieces(state: DemoState, filter: Filter, skipId?: string) {
  const order: Record<PieceStatus, number> = { curacion: 0, disputa: 1, verificado: 2, rechazado: 3 };
  return PIECES.filter((piece) => piece.id !== skipId && matches(piece, tally(state, piece.id).status, filter)).sort(
    (a, b) => {
      const left = tally(state, a.id);
      const right = tally(state, b.id);
      if (order[left.status] !== order[right.status]) return order[left.status] - order[right.status];
      return right.net - left.net;
    },
  );
}

export function Pieces({ state, onOpen }: { state: DemoState; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>("todas");
  const stats = networkStats(state);
  const hero = closestToSeal(state);
  const heroScore = hero ? tally(state, hero.id) : null;
  const showHero = Boolean(hero && heroScore && matches(hero, heroScore.status, filter));
  const pieces = visiblePieces(state, filter, showHero ? hero?.id : undefined);

  return (
    <section className="page">
      <div className="stats">
        <span>
          <b>{formatInt(stats.locked)}</b> CUR locked
        </span>
        <span>
          <b>{stats.seals}</b> seals
        </span>
        <span>
          <b>{stats.curators}</b> curators
        </span>
        <span>
          threshold <b>{stats.threshold}</b>
        </span>
      </div>
      <header className="page-head">
        <div>
          <h1>Pieces</h1>
          <p className="lede">
            The community locks CUR on a claim. When the weight crosses the threshold, the piece receives the seal.
          </p>
        </div>
      </header>
      <div className="filters" role="tablist" aria-label="Filter pieces">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={filter === item.id ? "chip on" : "chip"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {showHero && hero ? <Hero piece={hero} state={state} onOpen={onOpen} /> : null}
      <div className="layout">
        <div className="stack">
          {pieces.length === 0 ? <p className="empty">No pieces in this filter.</p> : null}
          {pieces.map((piece) => (
            <PieceRow key={piece.id} piece={piece} state={state} onOpen={onOpen} />
          ))}
        </div>
        <aside className="rail">
          <section className="panel">
            <h2>How a seal is issued</h2>
            <ol className="steps">
              <li>A piece opens with a specific claim.</li>
              <li>Curators lock CUR for or against it.</li>
              <li>Weight is the amount times the reputation of whoever locks it.</li>
              <li>If the net reaches 560, the seal is born and any app can read it through the API.</li>
            </ol>
          </section>
          <section className="panel">
            <h2>Activity</h2>
            <ol className="log">
              {state.events.map((event) => (
                <li key={event.id}>
                  <span className={`dot ${event.kind}`} />
                  <div>
                    <strong>{event.label}</strong>
                    <p>{event.detail}</p>
                  </div>
                  <time>{formatAgo(event.at)}</time>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </section>
  );
}

function Hero({ piece, state, onOpen }: { piece: Piece; state: DemoState; onOpen: (id: string) => void }) {
  const score = tally(state, piece.id);
  const gap = Math.max(0, piece.threshold - score.net);
  return (
    <button className="hero" type="button" onClick={() => onOpen(piece.id)}>
      <span className="hero-copy">
        <span className="meta">
          <StatusPill status={score.status} />
          <span>
            {KIND_LABEL[piece.kind]} · {piece.source}
          </span>
        </span>
        <span className="hero-gap">
          <strong>{formatWeight(gap)}</strong>
          <span>of weight to the seal</span>
        </span>
        <span className="hero-title">{piece.title}</span>
        <span className="claim">{piece.claim}</span>
        <Meter validate={score.validate} dispute={score.dispute} threshold={piece.threshold} thick />
        <span className="hero-foot">
          <span>
            {score.curators === 1 ? "1 curator" : `${score.curators} curators`} · {formatInt(score.amountFor + score.amountAgainst)} CUR locked
          </span>
          <span className="hero-cta">Curate piece</span>
        </span>
      </span>
    </button>
  );
}

function PieceRow({ piece, state, onOpen }: { piece: Piece; state: DemoState; onOpen: (id: string) => void }) {
  const score = tally(state, piece.id);
  const sealed = score.status === "verificado" || score.status === "rechazado";
  return (
    <button className="piece" type="button" onClick={() => onOpen(piece.id)}>
      {sealed ? (
        <Seal status={score.status as "verificado" | "rechazado"} size={52} />
      ) : (
        <ProgressMark net={score.net} threshold={piece.threshold} />
      )}
      <span className="piece-body">
        <span className="meta">
          <StatusPill status={score.status} />
          <span>
            {KIND_LABEL[piece.kind]} · {piece.source} · {formatAgo(piece.publishedAt)}
          </span>
        </span>
        <strong>{piece.title}</strong>
        <em>{piece.claim}</em>
        <span className="piece-foot">
          <span>
            {formatWeight(score.net)} / {piece.threshold}
          </span>
          <span className="mini-track">
            <span
              className={score.net >= 0 ? "gold" : "clay"}
              style={{ width: `${Math.max(6, Math.min(100, (Math.abs(score.net) / piece.threshold) * 100))}%` }}
            />
          </span>
          <span>
            {score.curators === 1 ? "1 curator" : `${score.curators} curators`} · {formatInt(score.amountFor + score.amountAgainst)} CUR
          </span>
        </span>
      </span>
    </button>
  );
}
