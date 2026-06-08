import { describe, it, expect } from 'vitest';
import {
  applyTradeEvent,
  initialTradeState,
  isTerminal,
  InvalidTradeTransition,
  type TradeState,
  type TradeEvent,
} from './trade';

const start = initialTradeState();

/** Helper: fold a sequence of events over the initial state. */
function run(events: TradeEvent[], from: TradeState = start): TradeState {
  return events.reduce(applyTradeEvent, from);
}

describe('initialTradeState', () => {
  it('starts as a proposed trade with all flags false', () => {
    expect(start).toEqual({
      status: 'proposed',
      proposerShipped: false,
      responderShipped: false,
      proposerReceived: false,
      responderReceived: false,
    });
  });
});

describe('proposal resolution', () => {
  it('responder can accept', () => {
    expect(run([{ type: 'accept', by: 'responder' }]).status).toBe('accepted');
  });

  it('responder can decline', () => {
    expect(run([{ type: 'decline', by: 'responder' }]).status).toBe('declined');
  });

  it('proposer cannot accept their own proposal', () => {
    expect(() => applyTradeEvent(start, { type: 'accept', by: 'proposer' })).toThrow(
      InvalidTradeTransition,
    );
  });

  it('proposer cannot decline their own proposal', () => {
    expect(() => applyTradeEvent(start, { type: 'decline', by: 'proposer' })).toThrow(
      InvalidTradeTransition,
    );
  });

  it('cannot accept a trade that is not proposed', () => {
    const accepted = run([{ type: 'accept', by: 'responder' }]);
    expect(() => applyTradeEvent(accepted, { type: 'accept', by: 'responder' })).toThrow(
      InvalidTradeTransition,
    );
  });
});

describe('cancellation', () => {
  it('either party may cancel a proposed trade', () => {
    expect(applyTradeEvent(start, { type: 'cancel', by: 'proposer' }).status).toBe('cancelled');
    expect(applyTradeEvent(start, { type: 'cancel', by: 'responder' }).status).toBe('cancelled');
  });

  it('either party may cancel an accepted trade while nothing has shipped', () => {
    const accepted = run([{ type: 'accept', by: 'responder' }]);
    expect(applyTradeEvent(accepted, { type: 'cancel', by: 'proposer' }).status).toBe('cancelled');
  });

  it('cannot cancel once a parcel is in motion (use dispute instead)', () => {
    const shipped = run([
      { type: 'accept', by: 'responder' },
      { type: 'markShipped', by: 'proposer' },
    ]);
    expect(() => applyTradeEvent(shipped, { type: 'cancel', by: 'proposer' })).toThrow(
      /parcel is in motion/,
    );
    expect(() => applyTradeEvent(shipped, { type: 'cancel', by: 'responder' })).toThrow(
      InvalidTradeTransition,
    );
    // …but it can still be escalated to a dispute.
    expect(applyTradeEvent(shipped, { type: 'dispute', by: 'responder' }).status).toBe('disputed');
  });

  it('cannot cancel a completed trade', () => {
    const done = run([
      { type: 'accept', by: 'responder' },
      { type: 'markShipped', by: 'proposer' },
      { type: 'markShipped', by: 'responder' },
      { type: 'markReceived', by: 'proposer' },
      { type: 'markReceived', by: 'responder' },
    ]);
    expect(done.status).toBe('completed');
    expect(() => applyTradeEvent(done, { type: 'cancel', by: 'proposer' })).toThrow(
      InvalidTradeTransition,
    );
  });
});

describe('shipping and receipt — the trust mechanism', () => {
  const accepted = run([{ type: 'accept', by: 'responder' }]);

  it('records each party shipping independently', () => {
    const s1 = applyTradeEvent(accepted, { type: 'markShipped', by: 'proposer' });
    expect(s1.proposerShipped).toBe(true);
    expect(s1.responderShipped).toBe(false);
    expect(s1.status).toBe('accepted');
  });

  it('cannot ship before acceptance', () => {
    expect(() => applyTradeEvent(start, { type: 'markShipped', by: 'proposer' })).toThrow(
      InvalidTradeTransition,
    );
  });

  it('cannot ship twice', () => {
    const s1 = applyTradeEvent(accepted, { type: 'markShipped', by: 'proposer' });
    expect(() => applyTradeEvent(s1, { type: 'markShipped', by: 'proposer' })).toThrow(
      /already marked shipped/,
    );
  });

  it('cannot confirm receipt before the counterpart has shipped', () => {
    // proposer wants to confirm receipt but responder has not shipped yet
    expect(() => applyTradeEvent(accepted, { type: 'markReceived', by: 'proposer' })).toThrow(
      /before responder has shipped/,
    );
  });

  it('allows receipt once the counterpart has shipped', () => {
    const s = run(
      [
        { type: 'markShipped', by: 'responder' },
        { type: 'markReceived', by: 'proposer' },
      ],
      accepted,
    );
    expect(s.proposerReceived).toBe(true);
    expect(s.status).toBe('accepted'); // not done until both received
  });

  it('completes only when both shipped and both received', () => {
    const done = run(
      [
        { type: 'markShipped', by: 'proposer' },
        { type: 'markShipped', by: 'responder' },
        { type: 'markReceived', by: 'proposer' },
        { type: 'markReceived', by: 'responder' },
      ],
      accepted,
    );
    expect(done.status).toBe('completed');
  });

  it('order of shipping and receiving does not matter as long as constraints hold', () => {
    const done = run(
      [
        { type: 'markShipped', by: 'proposer' },
        { type: 'markReceived', by: 'responder' }, // responder received proposer's parcel
        { type: 'markShipped', by: 'responder' },
        { type: 'markReceived', by: 'proposer' },
      ],
      accepted,
    );
    expect(done.status).toBe('completed');
  });

  it('cannot mark received/shipped after completion', () => {
    const done = run(
      [
        { type: 'markShipped', by: 'proposer' },
        { type: 'markShipped', by: 'responder' },
        { type: 'markReceived', by: 'proposer' },
        { type: 'markReceived', by: 'responder' },
      ],
      accepted,
    );
    expect(() => applyTradeEvent(done, { type: 'markShipped', by: 'proposer' })).toThrow(
      InvalidTradeTransition,
    );
  });
});

describe('disputes', () => {
  const accepted = run([{ type: 'accept', by: 'responder' }]);

  it('can be raised on an accepted trade and resolved to completed', () => {
    const disputed = applyTradeEvent(accepted, { type: 'dispute', by: 'proposer' });
    expect(disputed.status).toBe('disputed');
    expect(applyTradeEvent(disputed, { type: 'resolve', outcome: 'completed' }).status).toBe(
      'completed',
    );
  });

  it('can be resolved to cancelled', () => {
    const disputed = applyTradeEvent(accepted, { type: 'dispute', by: 'responder' });
    expect(applyTradeEvent(disputed, { type: 'resolve', outcome: 'cancelled' }).status).toBe(
      'cancelled',
    );
  });

  it('cannot dispute a proposed trade', () => {
    expect(() => applyTradeEvent(start, { type: 'dispute', by: 'proposer' })).toThrow(
      InvalidTradeTransition,
    );
  });

  it('cannot resolve a trade that is not disputed', () => {
    expect(() => applyTradeEvent(accepted, { type: 'resolve', outcome: 'completed' })).toThrow(
      InvalidTradeTransition,
    );
  });
});

describe('immutability and terminal states', () => {
  it('does not mutate the input state', () => {
    const snapshot = structuredClone(start);
    applyTradeEvent(start, { type: 'accept', by: 'responder' });
    expect(start).toEqual(snapshot);
  });

  it('classifies terminal states', () => {
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('declined')).toBe(true);
    expect(isTerminal('cancelled')).toBe(true);
    expect(isTerminal('proposed')).toBe(false);
    expect(isTerminal('accepted')).toBe(false);
    expect(isTerminal('disputed')).toBe(false);
  });
});
