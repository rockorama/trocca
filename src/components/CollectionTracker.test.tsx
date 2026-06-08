// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";
import { CollectionTracker } from "./CollectionTracker";
import type { CatalogItem } from "@/lib/sections";

const items: CatalogItem[] = [
  { code: "BRA-01", name: "Brazil — Player 1", rarity: "base", sortOrder: 0 },
  { code: "BRA-02", name: "Brazil — Player 2", rarity: "base", sortOrder: 1 },
  { code: "ARG-01", name: "Argentina — Player 1", rarity: "base", sortOrder: 2 },
];

function renderTracker(slug = "test") {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CollectionTracker slug={slug} items={items} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

describe("CollectionTracker", () => {
  it("starts with everything missing", () => {
    renderTracker();
    expect(screen.getByText(en.collection.missing).previousSibling).toHaveTextContent("3");
  });

  it("increments a sticker and reflects it in the stats", async () => {
    renderTracker();
    fireEvent.click(screen.getByLabelText(`${en.tracker.increase} BRA-01`));
    expect(screen.getByLabelText(`BRA-01 ${en.collection.owned}`)).toHaveTextContent("1");
    // Owned stat becomes 1.
    expect(screen.getByText(en.collection.owned).previousSibling).toHaveTextContent("1");
  });

  it("shows a spare badge once a sticker count reaches 2", () => {
    renderTracker();
    const inc = screen.getByLabelText(`${en.tracker.increase} BRA-01`);
    fireEvent.click(inc);
    fireEvent.click(inc);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("persists holdings to localStorage", async () => {
    renderTracker("persist-me");
    fireEvent.click(screen.getByLabelText(`${en.tracker.increase} ARG-01`));
    await waitFor(() => {
      const raw = window.localStorage.getItem("trocca:holdings:persist-me");
      expect(raw && JSON.parse(raw)).toMatchObject({ "ARG-01": 1 });
    });
  });

  it("loads pre-existing holdings from localStorage on first render", () => {
    window.localStorage.setItem(
      "trocca:holdings:preloaded",
      JSON.stringify({ "BRA-01": 2 }),
    );
    renderTracker("preloaded");
    expect(screen.getByLabelText(`BRA-01 ${en.collection.owned}`)).toHaveTextContent("2");
    expect(screen.getByText("+1")).toBeInTheDocument(); // one spare
    expect(screen.getByText(en.collection.owned).previousSibling).toHaveTextContent("1");
  });

  it("hides owned stickers when the missing-only filter is on", () => {
    renderTracker();
    fireEvent.click(screen.getByLabelText(`${en.tracker.increase} BRA-01`));
    fireEvent.click(screen.getByLabelText(en.tracker.filterMissing));
    expect(screen.queryByLabelText(`${en.tracker.increase} BRA-01`)).not.toBeInTheDocument();
    expect(screen.getByLabelText(`${en.tracker.increase} BRA-02`)).toBeInTheDocument();
  });
});

describe("CollectionTracker — signed in (server persistence)", () => {
  function renderSignedIn(props: {
    onSetCount: (code: string, count: number) => Promise<void>;
    serverHoldings?: Record<string, number>;
  }) {
    return render(
      <NextIntlClientProvider locale="en" messages={en}>
        <CollectionTracker
          slug="srv"
          items={items}
          signedIn
          serverHoldings={props.serverHoldings ?? {}}
          onSetCount={props.onSetCount}
          onMerge={async () => ({})}
        />
      </NextIntlClientProvider>,
    );
  }

  it("seeds the tracker from serverHoldings", () => {
    renderSignedIn({ onSetCount: vi.fn(async () => {}), serverHoldings: { "BRA-02": 1 } });
    expect(screen.getByLabelText(`BRA-02 ${en.collection.owned}`)).toHaveTextContent("1");
  });

  it("serializes saves per item and persists the latest count (no race)", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const persisted: number[] = [];
    const onSetCount = vi.fn(async (_code: string, count: number) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve(); // let other clicks queue while this write is "in flight"
      persisted.push(count);
      inFlight -= 1;
    });

    renderSignedIn({ onSetCount });
    const inc = screen.getByLabelText(`${en.tracker.increase} BRA-01`);
    fireEvent.click(inc);
    fireEvent.click(inc);
    fireEvent.click(inc);

    await waitFor(() => expect(inFlight).toBe(0));
    expect(maxInFlight).toBe(1); // never two concurrent writes for the same item
    expect(persisted.at(-1)).toBe(3); // the latest value is the one that sticks
    expect(screen.getByLabelText(`BRA-01 ${en.collection.owned}`)).toHaveTextContent("3");
  });
});
