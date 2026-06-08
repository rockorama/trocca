/**
 * Trade state machine.
 *
 * Models a peer-to-peer swap between two parties: the `proposer` (who initiated
 * the trade) and the `responder` (who received the proposal). The flow is a
 * deliberately small, auditable state machine with a built-in trust mechanism:
 * each party independently marks when they have *shipped* and when they have
 * *received* their counterpart's parcel.
 *
 *   proposed ──accept──> accepted ──(both ship & both receive)──> completed
 *      │                    │
 *      │ decline            │ cancel / dispute
 *      ▼                    ▼
 *   declined            cancelled / disputed
 *
 * A party may only mark "received" once the *other* party has marked "shipped",
 * preventing premature confirmations. Disputes can be raised once a trade is
 * accepted and resolved (by a moderator) to either `completed` or `cancelled`.
 *
 * Pure reducer: `applyTradeEvent(state, event)` returns the next state or throws
 * an `InvalidTradeTransition` for any disallowed action.
 */

export type Party = 'proposer' | 'responder';

export type TradeStatus =
  | 'proposed'
  | 'accepted'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'disputed';

export interface TradeState {
  status: TradeStatus;
  proposerShipped: boolean;
  responderShipped: boolean;
  proposerReceived: boolean;
  responderReceived: boolean;
}

export type TradeEvent =
  | { type: 'accept'; by: Party }
  | { type: 'decline'; by: Party }
  | { type: 'cancel'; by: Party }
  | { type: 'markShipped'; by: Party }
  | { type: 'markReceived'; by: Party }
  | { type: 'dispute'; by: Party }
  | { type: 'resolve'; outcome: 'completed' | 'cancelled' };

export class InvalidTradeTransition extends Error {
  constructor(
    public readonly status: TradeStatus,
    public readonly event: TradeEvent['type'],
    message?: string,
  ) {
    super(message ?? `Cannot apply "${event}" while trade is "${status}"`);
    this.name = 'InvalidTradeTransition';
  }
}

/** The state of a brand-new proposal awaiting the responder's decision. */
export function initialTradeState(): TradeState {
  return {
    status: 'proposed',
    proposerShipped: false,
    responderShipped: false,
    proposerReceived: false,
    responderReceived: false,
  };
}

const otherParty = (p: Party): Party => (p === 'proposer' ? 'responder' : 'proposer');

function hasShipped(state: TradeState, p: Party): boolean {
  return p === 'proposer' ? state.proposerShipped : state.responderShipped;
}

/** Both parcels delivered → the trade is complete. */
function isFulfilled(state: TradeState): boolean {
  return (
    state.proposerShipped &&
    state.responderShipped &&
    state.proposerReceived &&
    state.responderReceived
  );
}

/**
 * Apply an event to a trade state, returning a new state. Never mutates the
 * input. Throws `InvalidTradeTransition` if the event is not allowed.
 */
export function applyTradeEvent(state: TradeState, event: TradeEvent): TradeState {
  switch (event.type) {
    case 'accept': {
      if (state.status !== 'proposed') throw new InvalidTradeTransition(state.status, event.type);
      if (event.by !== 'responder') {
        throw new InvalidTradeTransition(state.status, event.type, 'Only the responder can accept a proposal');
      }
      return { ...state, status: 'accepted' };
    }

    case 'decline': {
      if (state.status !== 'proposed') throw new InvalidTradeTransition(state.status, event.type);
      if (event.by !== 'responder') {
        throw new InvalidTradeTransition(state.status, event.type, 'Only the responder can decline a proposal');
      }
      return { ...state, status: 'declined' };
    }

    case 'cancel': {
      // Either party may cancel before the swap is in motion or settled.
      if (state.status !== 'proposed' && state.status !== 'accepted') {
        throw new InvalidTradeTransition(state.status, event.type);
      }
      return { ...state, status: 'cancelled' };
    }

    case 'markShipped': {
      if (state.status !== 'accepted') throw new InvalidTradeTransition(state.status, event.type);
      if (hasShipped(state, event.by)) {
        throw new InvalidTradeTransition(state.status, event.type, `${event.by} has already marked shipped`);
      }
      return event.by === 'proposer'
        ? { ...state, proposerShipped: true }
        : { ...state, responderShipped: true };
    }

    case 'markReceived': {
      if (state.status !== 'accepted') throw new InvalidTradeTransition(state.status, event.type);
      // You can only confirm receipt once your counterpart has actually shipped.
      if (!hasShipped(state, otherParty(event.by))) {
        throw new InvalidTradeTransition(
          state.status,
          event.type,
          `Cannot confirm receipt before ${otherParty(event.by)} has shipped`,
        );
      }
      const next: TradeState =
        event.by === 'proposer'
          ? { ...state, proposerReceived: true }
          : { ...state, responderReceived: true };
      return isFulfilled(next) ? { ...next, status: 'completed' } : next;
    }

    case 'dispute': {
      if (state.status !== 'accepted') throw new InvalidTradeTransition(state.status, event.type);
      return { ...state, status: 'disputed' };
    }

    case 'resolve': {
      if (state.status !== 'disputed') throw new InvalidTradeTransition(state.status, event.type);
      return { ...state, status: event.outcome };
    }

    default: {
      // Exhaustiveness guard: if a new event type is added the compiler flags it.
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

/** Terminal states never transition again. */
export function isTerminal(status: TradeStatus): boolean {
  return status === 'completed' || status === 'declined' || status === 'cancelled';
}
