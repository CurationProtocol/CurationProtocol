export type Side = "validate" | "dispute";
export type Kind = "noticia" | "proyecto";
export type PieceStatus = "curacion" | "disputa" | "verificado" | "rechazado";
export type EventKind = "lock" | "seal" | "reject";

export const YOU_ID = "you";
export const PROGRAM_ID = "Cura111111111111111111111111111111111111111";
export const THRESHOLD = 560;
export const REP_GAIN = 75;
export const BASE_SLOT = 312884221;

export interface Curator {
  id: string;
  name: string;
  handle: string;
  address: string;
  reputation: number;
  resolved: number;
  correct: number;
  bio: string;
}

export interface Piece {
  id: string;
  kind: Kind;
  title: string;
  source: string;
  claim: string;
  summary: string;
  checks: string[];
  tags: string[];
  publishedAt: number;
  threshold: number;
  pda: string;
}

export interface Lock {
  id: string;
  pieceId: string;
  curatorId: string;
  side: Side;
  amount: number;
  reputation: number;
  at: number;
  signature: string;
}

export interface ChainEvent {
  id: string;
  at: number;
  kind: EventKind;
  label: string;
  detail: string;
  signature: string;
}

export interface YouState {
  reputation: number;
  resolved: number;
  correct: number;
}

export interface DemoState {
  version: 1;
  connected: boolean;
  balanceCur: number;
  balanceSol: number;
  you: YouState;
  locks: Lock[];
  events: ChainEvent[];
}

export interface Tally {
  validate: number;
  dispute: number;
  net: number;
  amountFor: number;
  amountAgainst: number;
  curators: number;
  status: PieceStatus;
}

export interface Position {
  curatorId: string;
  side: Side;
  amount: number;
  weight: number;
  reputation: number;
  at: number;
}

export const STATUS_LABEL: Record<PieceStatus, string> = {
  curacion: "In curation",
  disputa: "Contested",
  verificado: "Verified",
  rechazado: "Rejected",
};

export const KIND_LABEL: Record<Kind, string> = {
  noticia: "News",
  proyecto: "Project",
};

export const CURATORS: Curator[] = [
  {
    id: YOU_ID,
    name: "Demo",
    handle: "demo.sol",
    address: "7kXm4pQeR8nL2sA9WcVd3uYbT6hJfK1mZp",
    reputation: 120,
    resolved: 11,
    correct: 8,
    bio: "Wallet for this demonstration.",
  },
  {
    id: "mesa",
    name: "Desk",
    handle: "desk.sol",
    address: "Mesa8kR2nQ4wL7pYcVd1uHbT3jF6aK9mXz",
    reputation: 940,
    resolved: 86,
    correct: 79,
    bio: "Newsroom desk. Primary sources first.",
  },
  {
    id: "fuente",
    name: "Source",
    handle: "source.sol",
    address: "Fnt3pQ8wL2sA7kR9cVd4uYbT6hJ1mZpX5e",
    reputation: 810,
    resolved: 64,
    correct: 55,
    bio: "Checks announcements against accounts and programs.",
  },
  {
    id: "ledger",
    name: "Ledger Room",
    handle: "ledger.sol",
    address: "Ldg6nQ2wP8sK4mR7cVa1uYbT9hJ3fZpX5e",
    reputation: 700,
    resolved: 51,
    correct: 44,
    bio: "Follows audits and program upgrades.",
  },
  {
    id: "orilla",
    name: "Edge",
    handle: "edge.sol",
    address: "Orl5kM8nQ2wL7pYcVd4uHbT1jF6aK9mXz",
    reputation: 480,
    resolved: 28,
    correct: 19,
    bio: "Shows up early on new projects.",
  },
  {
    id: "bruma",
    name: "Haze",
    handle: "haze.sol",
    address: "Brm4pQ9wL2sA8kR6cVd3uYbT5hJ7mZpX1e",
    reputation: 190,
    resolved: 17,
    correct: 9,
    bio: "Mostly disputes adoption numbers.",
  },
];

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function makeSignature(seed: number) {
  let x = seed >>> 0 || 1;
  let out = "";
  for (let i = 0; i < 88; i++) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    out += ALPHABET[x % ALPHABET.length];
  }
  return out;
}

export function weightOf(reputation: number) {
  return 0.6 + reputation / 1000;
}

export function baseReputation(id: string) {
  return CURATORS.find((c) => c.id === id)!.reputation;
}

export function profile(state: DemoState, id: string) {
  const base = CURATORS.find((c) => c.id === id)!;
  if (id !== YOU_ID) return base;
  return { ...base, ...state.you };
}

export function reputationOf(state: DemoState, id: string) {
  return profile(state, id).reputation;
}

function pieceTime(now: number) {
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  return {
    helio: now - 6 * hour,
    cbdc: now - 26 * hour,
    solar: now - 2 * day,
    andes: now - 3 * day,
    marinade: now - 5 * day,
    jupiter: now - 21 * day,
    puente: now - 4 * day,
  };
}

export function buildPieces(now: number): Piece[] {
  const t = pieceTime(now);
  return [
    {
      id: "helio-usdc",
      kind: "noticia",
      title: "Helio settles USDC the same day in three countries",
      source: "Terminal South",
      claim:
        "Helio already settles merchants in Mexico, Colombia, and Argentina in USDC on Solana, with same-day credit.",
      summary:
        "Terminal South published the processor's announcement and opened it for curation. It is still unclear whether real merchants are being paid, or this is a pilot with no volume.",
      checks: [
        "Announcement on the project's domain",
        "Settlement accounts visible on-chain",
        "One merchant confirming the credit",
      ],
      tags: ["payments", "USDC", "LATAM"],
      publishedAt: t.helio,
      threshold: THRESHOLD,
      pda: "H3ioUsdc9kR2nQ4wL7pYcVd1uHbT3jF6aK",
    },
    {
      id: "cbdc-brasil",
      kind: "noticia",
      title: "Brazil tests a wholesale leg off mainnet",
      source: "The Brief",
      claim:
        "Brazil's central bank ran a wholesale CBDC pilot on a Solana-compatible sidechain, not on public mainnet.",
      summary:
        "The Brief separates the sidechain from the public network. Curation is well along and still short of the seal.",
      checks: ["Official document", "Exact network of the pilot", "Institutional participants"],
      tags: ["CBDC", "macro"],
      publishedAt: t.cbdc,
      threshold: THRESHOLD,
      pda: "CbdcBr9kR2nQ4wL7pYcVd1uHbT3jF6aKm",
    },
    {
      id: "solarmail",
      kind: "noticia",
      title: "SolarMail claims 2 million active users",
      source: "SolarMail",
      claim: "SolarMail has 2 million monthly active users on its Solana email client.",
      summary:
        "The blog publishes the figure, but the wallets that touch the program over thirty days tell another story. Validation and dispute landed even.",
      checks: ["Definition of an active user", "Distinct wallets in 30 days", "Retention of those wallets"],
      tags: ["adoption", "metrics"],
      publishedAt: t.solar,
      threshold: THRESHOLD,
      pda: "SolMail8kR2nQ4wL7pYcVd1uHbT3jF6aKz",
    },
    {
      id: "andes-pay",
      kind: "proyecto",
      title: "Andes Pay",
      source: "Andes Pay",
      claim: "Andes Pay is a USDC payroll rail for Andean companies, with custody in a public 3-of-5 multisig.",
      summary: "The listing is three days old. There is a single position and little history to seal the claim.",
      checks: [
        "Identifiable multisig",
        "Companies already paying through the rail",
        "A worker can withdraw without extra permission",
      ],
      tags: ["payroll", "USDC"],
      publishedAt: t.andes,
      threshold: THRESHOLD,
      pda: "AndesPay2nQ4wL7pYcVd1uHbT3jF6aK9mX",
    },
    {
      id: "marinade-v3",
      kind: "noticia",
      title: "The Marinade v3 audit leaves no critical findings open",
      source: "Daily Ledger",
      claim: "The independent audit of Marinade v3 reports no unfixed critical or high findings.",
      summary: "Daily Ledger linked the PDF and the team's response. The cohort already crossed the threshold in favor.",
      checks: ["PDF with a matching hash", "Public response to each finding", "Program updated at the cited slot"],
      tags: ["staking", "audit"],
      publishedAt: t.marinade,
      threshold: THRESHOLD,
      pda: "MarV3Audit4wL7pYcVd1uHbT3jF6aK9mXz",
    },
    {
      id: "jupiter",
      kind: "proyecto",
      title: "Jupiter routes swaps without custody of the funds",
      source: "Plaza",
      claim: "Jupiter routes swaps on Solana with the public program on mainnet and without custody of the user's funds.",
      summary:
        "Reference piece in the directory. The seal covers the no-custody claim and the public program, not a price promise.",
      checks: [
        "Program verifiable on mainnet",
        "The user signs every swap",
        "An exit path that does not need the router's permission",
      ],
      tags: ["DEX", "infrastructure"],
      publishedAt: t.jupiter,
      threshold: THRESHOLD,
      pda: "JupRoute7pYcVd1uHbT3jF6aK9mXzQ2wL",
    },
    {
      id: "puente-40m",
      kind: "noticia",
      title: "A thread claims a bridge lost $40 million today",
      source: "Radar",
      claim: "A Solana bridge was drained today for $40 million and the funds have already left the network.",
      summary:
        "The thread has no signature, program, or named source. The dispute crossed the threshold and the piece was rejected.",
      checks: ["Transaction signature", "Affected program", "A source with a track record"],
      tags: ["security", "rumor"],
      publishedAt: t.puente,
      threshold: THRESHOLD,
      pda: "Brg40mRumorL7pYcVd1uHbT3jF6aK9mXz",
    },
  ];
}

export const PIECES = buildPieces(Date.now());

export function pieceById(id: string) {
  return PIECES.find((piece) => piece.id === id);
}

function lock(
  id: string,
  pieceId: string,
  curatorId: string,
  side: Side,
  amount: number,
  at: number,
  seed: number,
): Lock {
  return {
    id,
    pieceId,
    curatorId,
    side,
    amount,
    reputation: baseReputation(curatorId),
    at,
    signature: makeSignature(seed),
  };
}

export function initialState(now = Date.now()): DemoState {
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  const locks: Lock[] = [
    lock("lock-helio-bruma", "helio-usdc", "bruma", "dispute", 40, now - 40 * 60 * 1000, 101),
    lock("lock-helio-ledger", "helio-usdc", "ledger", "validate", 70, now - 90 * 60 * 1000, 102),
    lock("lock-helio-fuente", "helio-usdc", "fuente", "validate", 100, now - 3 * hour, 103),
    lock("lock-helio-mesa", "helio-usdc", "mesa", "validate", 150, now - 5 * hour, 104),
    lock("lock-cbdc-bruma", "cbdc-brasil", "bruma", "dispute", 30, now - 8 * hour, 111),
    lock("lock-cbdc-ledger", "cbdc-brasil", "ledger", "validate", 90, now - 14 * hour, 112),
    lock("lock-cbdc-orilla", "cbdc-brasil", "orilla", "validate", 100, now - 20 * hour, 113),
    lock("lock-cbdc-mesa", "cbdc-brasil", "mesa", "validate", 120, now - 24 * hour, 114),
    lock("lock-solar-orilla", "solarmail", "orilla", "dispute", 120, now - 20 * hour, 121),
    lock("lock-solar-bruma", "solarmail", "bruma", "dispute", 200, now - 26 * hour, 122),
    lock("lock-solar-mesa", "solarmail", "mesa", "validate", 40, now - 30 * hour, 123),
    lock("lock-solar-fuente", "solarmail", "fuente", "validate", 160, now - 36 * hour, 124),
    lock("lock-andes-orilla", "andes-pay", "orilla", "validate", 80, now - 2 * day, 131),
    lock("lock-mar-ledger", "marinade-v3", "ledger", "validate", 180, now - 4 * day, 141),
    lock("lock-mar-fuente", "marinade-v3", "fuente", "validate", 250, now - 5 * day, 142),
    lock("lock-jup-orilla", "jupiter", "orilla", "validate", 100, now - 16 * day, 151),
    lock("lock-jup-fuente", "jupiter", "fuente", "validate", 200, now - 17 * day, 152),
    lock("lock-jup-mesa", "jupiter", "mesa", "validate", 300, now - 18 * day, 153),
    lock("lock-brg-ledger", "puente-40m", "ledger", "dispute", 100, now - 3 * day, 161),
    lock("lock-brg-fuente", "puente-40m", "fuente", "dispute", 150, now - 3 * day - 2 * hour, 162),
    lock("lock-brg-mesa", "puente-40m", "mesa", "dispute", 200, now - 4 * day, 163),
    lock("lock-brg-orilla", "puente-40m", "orilla", "validate", 60, now - 4 * day + hour, 164),
  ];

  const events: ChainEvent[] = [
    {
      id: "ev-helio",
      at: now - 40 * 60 * 1000,
      kind: "lock",
      label: "Tokens locked",
      detail: "40 CUR against · Helio",
      signature: makeSignature(201),
    },
    {
      id: "ev-puente",
      at: now - 3 * day,
      kind: "reject",
      label: "Piece rejected",
      detail: "A thread claims a bridge lost $40 million today",
      signature: makeSignature(202),
    },
    {
      id: "ev-mar",
      at: now - 4 * day,
      kind: "seal",
      label: "Seal issued",
      detail: "The Marinade v3 audit leaves no critical findings open",
      signature: makeSignature(203),
    },
    {
      id: "ev-jup",
      at: now - 16 * day,
      kind: "seal",
      label: "Seal issued",
      detail: "Jupiter routes swaps without custody of the funds",
      signature: makeSignature(204),
    },
  ];

  return {
    version: 1,
    connected: false,
    balanceCur: 900,
    balanceSol: 4.82,
    you: { reputation: 120, resolved: 11, correct: 8 },
    locks,
    events,
  };
}

export function statusOf(net: number, validate: number, dispute: number, threshold: number): PieceStatus {
  if (net >= threshold) return "verificado";
  if (-net >= threshold) return "rechazado";
  if (validate >= 80 && dispute >= 80) return "disputa";
  return "curacion";
}

export function tally(state: DemoState, pieceId: string): Tally {
  const piece = pieceById(pieceId);
  const threshold = piece?.threshold ?? THRESHOLD;
  let validate = 0;
  let dispute = 0;
  let amountFor = 0;
  let amountAgainst = 0;
  const curators = new Set<string>();
  for (const entry of state.locks) {
    if (entry.pieceId !== pieceId) continue;
    const weight = entry.amount * weightOf(entry.reputation);
    curators.add(entry.curatorId);
    if (entry.side === "validate") {
      validate += weight;
      amountFor += entry.amount;
    } else {
      dispute += weight;
      amountAgainst += entry.amount;
    }
  }
  const net = validate - dispute;
  return {
    validate,
    dispute,
    net,
    amountFor,
    amountAgainst,
    curators: curators.size,
    status: statusOf(net, validate, dispute, threshold),
  };
}

export function positions(state: DemoState, pieceId: string): Position[] {
  const map = new Map<string, Position>();
  for (const entry of state.locks) {
    if (entry.pieceId !== pieceId) continue;
    const key = `${entry.curatorId}:${entry.side}`;
    const weight = entry.amount * weightOf(entry.reputation);
    const prev = map.get(key);
    if (prev) {
      prev.amount += entry.amount;
      prev.weight += weight;
      prev.at = Math.max(prev.at, entry.at);
    } else {
      map.set(key, {
        curatorId: entry.curatorId,
        side: entry.side,
        amount: entry.amount,
        weight,
        reputation: entry.reputation,
        at: entry.at,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.weight - a.weight);
}

export function tokensToReach(
  net: number,
  threshold: number,
  side: Side,
  multiplier: number,
  balance: number,
) {
  const gap = side === "validate" ? threshold - net : threshold + net;
  if (gap <= 0) return 0;
  const need = Math.ceil((gap - 1e-9) / multiplier);
  if (!Number.isFinite(need) || need <= 0 || need > balance) return null;
  return need;
}

export function lockedBy(state: DemoState, id = YOU_ID) {
  return state.locks.filter((entry) => entry.curatorId === id).reduce((sum, entry) => sum + entry.amount, 0);
}

export function networkStats(state: DemoState) {
  const locked = state.locks.reduce((sum, entry) => sum + entry.amount, 0);
  let seals = 0;
  for (const piece of PIECES) {
    if (tally(state, piece.id).status === "verificado") seals += 1;
  }
  return { locked, seals, curators: CURATORS.length, threshold: THRESHOLD };
}

export function leaderboard(state: DemoState) {
  return CURATORS.map((curator) => profile(state, curator.id)).sort((a, b) => {
    if (b.reputation !== a.reputation) return b.reputation - a.reputation;
    return a.name.localeCompare(b.name, "en");
  });
}

export function rankOf(state: DemoState, id = YOU_ID) {
  return leaderboard(state).findIndex((curator) => curator.id === id) + 1;
}

export function closestToSeal(state: DemoState) {
  const open = PIECES.map((piece) => ({ piece, score: tally(state, piece.id) }))
    .filter((entry) => entry.score.status === "curacion" || entry.score.status === "disputa")
    .sort((a, b) => b.score.net / b.piece.threshold - a.score.net / a.piece.threshold);
  return open[0]?.piece ?? null;
}

export function slotOf(state: DemoState) {
  const extra = state.locks.filter((entry) => entry.curatorId === YOU_ID).length;
  return BASE_SLOT + extra;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function piecePayload(state: DemoState, pieceId: string) {
  const piece = pieceById(pieceId)!;
  const score = tally(state, pieceId);
  const latest = state.locks
    .filter((entry) => entry.pieceId === pieceId)
    .reduce((max, entry) => Math.max(max, entry.at), piece.publishedAt);
  return {
    id: piece.id,
    kind: piece.kind,
    chain: "solana",
    cluster: "mainnet-beta",
    status: score.status,
    seal: score.status === "verificado" ? "community" : null,
    claim: piece.claim,
    threshold: piece.threshold,
    weight_for: round1(score.validate),
    weight_against: round1(score.dispute),
    net_weight: round1(score.net),
    tokens_locked: score.amountFor + score.amountAgainst,
    curators: score.curators,
    reputation_weighted: true,
    lock_seconds: 604800,
    program_id: PROGRAM_ID,
    piece_pda: piece.pda,
    slot: slotOf(state),
    updated_at: new Date(latest).toISOString(),
  };
}

export interface StakeAction {
  pieceId: string;
  side: Side;
  amount: number;
  now: number;
  id: string;
  signature: string;
}

export type StakeResult =
  | { ok: false; error: string }
  | {
      ok: true;
      state: DemoState;
      pieceId: string;
      status: PieceStatus;
      previousStatus: PieceStatus;
      sealedNow: boolean;
      decisive: boolean;
      repBefore: number;
      repAfter: number;
      rankBefore: number;
      rankAfter: number;
      signature: string;
      amount: number;
      side: Side;
      net: number;
    };

export function sideLabel(side: Side) {
  return side === "validate" ? "for" : "against";
}

export function applyStake(state: DemoState, action: StakeAction): StakeResult {
  if (!state.connected) return { ok: false, error: "Connect a wallet to lock tokens." };
  const piece = pieceById(action.pieceId);
  if (!piece) return { ok: false, error: "That piece could not be found." };
  if (!Number.isInteger(action.amount) || action.amount <= 0) {
    return { ok: false, error: "The amount has to be a whole number greater than zero." };
  }
  if (action.amount > state.balanceCur) return { ok: false, error: "Insufficient balance." };
  const before = tally(state, piece.id);
  if (before.status === "verificado" || before.status === "rechazado") {
    return { ok: false, error: "Curation on this piece is already closed." };
  }

  const entry: Lock = {
    id: action.id,
    pieceId: piece.id,
    curatorId: YOU_ID,
    side: action.side,
    amount: action.amount,
    reputation: state.you.reputation,
    at: action.now,
    signature: action.signature,
  };
  const locks = [entry, ...state.locks];
  const drafted: DemoState = { ...state, locks };
  const after = tally(drafted, piece.id);
  const sealedNow =
    before.status !== after.status && (after.status === "verificado" || after.status === "rechazado");
  const winning: Side | null = after.status === "verificado" ? "validate" : after.status === "rechazado" ? "dispute" : null;
  const decisive =
    sealedNow &&
    winning !== null &&
    locks.some((item) => item.pieceId === piece.id && item.curatorId === YOU_ID && item.side === winning);

  const you = decisive
    ? {
        reputation: state.you.reputation + REP_GAIN,
        resolved: state.you.resolved + 1,
        correct: state.you.correct + 1,
      }
    : state.you;

  const events: ChainEvent[] = [];
  if (sealedNow && after.status === "verificado") {
    events.push({
      id: `ev-seal-${action.id}`,
      at: action.now,
      kind: "seal",
      label: "Seal issued",
      detail: piece.title,
      signature: makeSignature(action.now + 1),
    });
  } else if (sealedNow && after.status === "rechazado") {
    events.push({
      id: `ev-rej-${action.id}`,
      at: action.now,
      kind: "reject",
      label: "Piece rejected",
      detail: piece.title,
      signature: makeSignature(action.now + 1),
    });
  }
  events.push({
    id: `ev-${action.id}`,
    at: action.now,
    kind: "lock",
    label: "Tokens locked",
    detail: `${action.amount} CUR ${sideLabel(action.side)} · ${piece.title}`,
    signature: action.signature,
  });

  const rankBefore = rankOf(state);
  const next: DemoState = {
    ...state,
    balanceCur: state.balanceCur - action.amount,
    you,
    locks,
    events: [...events, ...state.events].slice(0, 14),
  };

  return {
    ok: true,
    state: next,
    pieceId: piece.id,
    status: after.status,
    previousStatus: before.status,
    sealedNow,
    decisive,
    repBefore: state.you.reputation,
    repAfter: you.reputation,
    rankBefore,
    rankAfter: rankOf(next),
    signature: action.signature,
    amount: action.amount,
    side: action.side,
    net: after.net,
  };
}

if (import.meta.env.DEV) {
  const sample = initialState();
  const expected: Record<string, PieceStatus> = {
    "helio-usdc": "curacion",
    "cbdc-brasil": "curacion",
    solarmail: "disputa",
    "andes-pay": "curacion",
    "marinade-v3": "verificado",
    jupiter: "verificado",
    "puente-40m": "rechazado",
  };
  for (const [id, status] of Object.entries(expected)) {
    const score = tally(sample, id);
    if (score.status !== status) console.warn("Unexpected status", id, score);
  }
  const helio = tally(sample, "helio-usdc");
  const need = tokensToReach(helio.net, THRESHOLD, "validate", weightOf(sample.you.reputation), sample.balanceCur);
  if (need !== 179) console.warn("Helio should close with 179 CUR", need, helio);
}
