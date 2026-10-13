import { useEffect, useRef, useState } from "react";
import { DemoProvider, useDemo } from "./store";
import { CURATORS, YOU_ID, lockedBy, pieceById, sideLabel, type StakeResult } from "./model";
import { formatInt, formatSol, shortAddress } from "./format";
import { Pieces } from "./components/Pieces";
import { Detail } from "./components/Detail";
import { Reputation } from "./components/Reputation";
import { Integrate } from "./components/Integrate";
import { Ceremony, Toast, WalletModal } from "./components/Overlays";
import { Seal } from "./components/Seal";

type View = "pieces" | "detail" | "reputation" | "integrate";
type Success = Extract<StakeResult, { ok: true }>;

export function App() {
  return (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  );
}

function Shell() {
  const { state, dispatch } = useDemo();
  const [view, setView] = useState<View>("pieces");
  const [pieceId, setPieceId] = useState<string | null>(null);
  const [integrateId, setIntegrateId] = useState("helio-usdc");
  const [walletOpen, setWalletOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [armReset, setArmReset] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ceremony, setCeremony] = useState<Success | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const youAddress = CURATORS.find((curator) => curator.id === YOU_ID)!.address;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, pieceId]);

  useEffect(() => {
    if (!menuOpen) setArmReset(false);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [menuOpen]);

  function openPiece(id: string) {
    setPieceId(id);
    setView("detail");
  }

  function go(next: View) {
    setMenuOpen(false);
    setView(next);
  }

  function onStaked(result: Success) {
    if (result.sealedNow && result.status === "verificado") {
      setCeremony(result);
      return;
    }
    if (result.sealedNow && result.status === "rechazado") {
      setToast(`Piece rejected · reputation ${formatInt(result.repBefore)} → ${formatInt(result.repAfter)}.`);
      return;
    }
    setToast(`Lock confirmed · ${formatInt(result.amount)} CUR ${sideLabel(result.side)} · ${shortAddress(result.signature, 6, 4)}`);
  }

  const ceremonyPiece = ceremony ? pieceById(ceremony.pieceId) : undefined;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <button
            className="brand"
            type="button"
            onClick={() => {
              setView("pieces");
              setPieceId(null);
            }}
          >
            <Seal status="verificado" size={32} />
            <span>
              <strong>
                Curation <em>Protocol</em>
              </strong>
              <small>Solana</small>
            </span>
          </button>
          <nav className="nav">
            <button type="button" aria-current={view === "pieces" || view === "detail" ? "page" : undefined} onClick={() => go("pieces")}>
              Pieces
            </button>
            <button type="button" aria-current={view === "reputation" ? "page" : undefined} onClick={() => go("reputation")}>
              Reputation
            </button>
            <button type="button" aria-current={view === "integrate" ? "page" : undefined} onClick={() => go("integrate")}>
              Integrate
            </button>
          </nav>
          <span className="header-spacer" />
          {state.connected ? (
            <div className="menu" ref={menuRef}>
              <button className="account-pill" type="button" onClick={() => setMenuOpen((open) => !open)}>
                <i />
                {shortAddress(youAddress)} · {formatInt(state.balanceCur)} CUR
              </button>
              {menuOpen ? (
                <div className="menu-panel">
                  <p>
                    Available <b>{formatInt(state.balanceCur)} CUR</b>
                  </p>
                  <p>
                    Locked <b>{formatInt(lockedBy(state))} CUR</b>
                  </p>
                  <p>
                    Network <b>{formatSol(state.balanceSol)} SOL</b>
                  </p>
                  <p className="menu-address">{youAddress}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!armReset) {
                        setArmReset(true);
                        return;
                      }
                      dispatch({ type: "reset" });
                      setCeremony(null);
                      setToast("Demo reset.");
                      setMenuOpen(false);
                      setView("pieces");
                      setPieceId(null);
                    }}
                  >
                    {armReset ? "Confirm reset" : "Reset demo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: "disconnect" });
                      setMenuOpen(false);
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button className="btn primary" type="button" onClick={() => setWalletOpen(true)}>
              Connect wallet
            </button>
          )}
        </div>
      </header>
      <main>
        {view === "pieces" ? <Pieces state={state} onOpen={openPiece} /> : null}
        {view === "detail" && pieceId ? (
          <Detail
            pieceId={pieceId}
            onBack={() => setView("pieces")}
            onConnect={() => setWalletOpen(true)}
            onStaked={onStaked}
            onIntegrate={() => {
              setIntegrateId(pieceId);
              setView("integrate");
            }}
          />
        ) : null}
        {view === "reputation" ? <Reputation onOpen={openPiece} /> : null}
        {view === "integrate" ? <Integrate selectedId={integrateId} onSelect={setIntegrateId} /> : null}
      </main>
      <footer className="footer">
        <span>Curation Protocol</span>
        <span>Local demo · locks stay in this browser</span>
        <span>Solana</span>
      </footer>
      {walletOpen ? (
        <WalletModal
          balance={state.balanceCur}
          onClose={() => setWalletOpen(false)}
          onConnect={() => {
            dispatch({ type: "connect" });
            setWalletOpen(false);
          }}
        />
      ) : null}
      {ceremony && ceremonyPiece ? (
        <Ceremony
          result={ceremony}
          title={ceremonyPiece.title}
          onPiece={() => {
            setPieceId(ceremony.pieceId);
            setView("detail");
            setCeremony(null);
          }}
          onReader={() => {
            setIntegrateId(ceremony.pieceId);
            setView("integrate");
            setCeremony(null);
          }}
        />
      ) : null}
      {toast ? <Toast onClose={() => setToast(null)}>{toast}</Toast> : null}
    </div>
  );
}
