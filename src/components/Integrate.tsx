import { useState, type ReactNode } from "react";
import { PIECES, KIND_LABEL, piecePayload, tally } from "../model";
import { formatInt, formatWeight } from "../format";
import { useDemo } from "../store";
import { SealWidget } from "./Seal";

export function Integrate({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { state } = useDemo();
  const piece = PIECES.find((item) => item.id === selectedId) ?? PIECES[0];
  const score = tally(state, piece.id);
  const payload = piecePayload(state, piece.id);
  const json = JSON.stringify(payload, null, 2);
  const embed = `<div data-curation-seal data-piece="${piece.id}" data-theme="light"></div>\n<script src="https://seal.curationprotocol.sol/v1.js" async></script>`;
  const [copied, setCopied] = useState<"json" | "embed" | null>(null);

  async function copy(kind: "json" | "embed", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied((current) => (current === kind ? null : current)), 1600);
    } catch {
      setCopied(null);
    }
  }

  const forum =
    score.status === "verificado"
      ? "The weight crossed the threshold. Leaving the community seal on the thread."
      : score.status === "rechazado"
        ? "The dispute won. This claim carries no seal."
        : `CUR is still locked. The seal is not out yet: ${formatWeight(score.net)} of ${piece.threshold}.`;

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Integrate</h1>
          <p className="lede">One state. A reader, a forum, and a marketplace all read it from the same endpoint.</p>
        </div>
      </header>
      <div className="chooser" role="tablist" aria-label="Piece for the API">
        {PIECES.map((item) => {
          const itemScore = tally(state, item.id);
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === piece.id}
              className={item.id === piece.id ? "chip on" : "chip"}
              onClick={() => onSelect(item.id)}
            >
              <i className={`status-dot ${itemScore.status}`} />
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>
      <div className="integrate-top">
        <Device url={`terminalsouth.news/p/${piece.id}`} caption="Reader · Terminal South">
          <article className="reader">
            <p className="kicker">
              {KIND_LABEL[piece.kind]} · {piece.source}
            </p>
            <h2>{piece.title}</h2>
            <SealWidget status={score.status} net={score.net} threshold={piece.threshold} theme="light" />
            <p className="deck">{piece.claim}</p>
            <p>{piece.summary}</p>
            <p className="reader-foot">The newsroom does not grant the seal. It reads it from Curation Protocol.</p>
          </article>
        </Device>
        <aside className="panel code-panel">
          <div className="code-head">
            <div>
              <p className="eyebrow">GET</p>
              <p className="endpoint">/v1/pieces/{piece.id}</p>
            </div>
            <button className="btn" type="button" onClick={() => copy("json", json)}>
              {copied === "json" ? "Copied" : "Copy JSON"}
            </button>
          </div>
          <p className="http">200 OK · local response</p>
          <pre>{json}</pre>
          <div className="code-head embed-head">
            <p className="eyebrow">Embed</p>
            <button className="btn" type="button" onClick={() => copy("embed", embed)}>
              {copied === "embed" ? "Copied" : "Copy embed"}
            </button>
          </div>
          <pre>{embed}</pre>
        </aside>
      </div>
      <div className="integrate-bottom">
        <Device url={`desk.forum/thread/${piece.id}`} caption="Forum · Desk">
          <article className="forum">
            <p className="kicker">thread · {piece.id}</p>
            <h2>{piece.title}</h2>
            <div className="post">
              <strong>desk.sol</strong>
              <p>{forum}</p>
              <SealWidget status={score.status} net={score.net} threshold={piece.threshold} theme="dark" />
            </div>
          </article>
        </Device>
        <Device url={`plaza.sol/p/${piece.id}`} caption="Directory · Plaza">
          <article className="market">
            <div className="market-card">
              <div className="market-top">
                <span className="monogram">{piece.title.slice(0, 2)}</span>
                <div>
                  <p className="kicker">{KIND_LABEL[piece.kind]}</p>
                  <h2>{piece.title}</h2>
                </div>
              </div>
              <p>{piece.claim}</p>
              <SealWidget status={score.status} net={score.net} threshold={piece.threshold} theme="light" />
              <dl>
                <div>
                  <dt>Curators</dt>
                  <dd>{score.curators}</dd>
                </div>
                <div>
                  <dt>CUR</dt>
                <dd>{formatInt(score.amountFor + score.amountAgainst)}</dd>
              </div>
              <div>
                  <dt>Net weight</dt>
                <dd>{formatWeight(score.net)}</dd>
                </div>
              </dl>
            </div>
          </article>
        </Device>
      </div>
    </section>
  );
}

function Device({
  url,
  caption,
  children,
}: {
  url: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="device">
      <figcaption>{caption}</figcaption>
      <div className="chrome">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="url">{url}</span>
      </div>
      {children}
    </figure>
  );
}
