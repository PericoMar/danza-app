import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useToggleCompanyFavorite } from "./useToggleCompanyFavorite";
import { companyKeys, type Company } from "@/hooks/useCompanies";

// ─── Mocks ────────────────────────────────────────────────────────────────────
// services/favorites is the data seam: the test controls when the write lands.

jest.mock("@/services/supabase", () => ({ supabase: {} }));

const mockToggleFavorite = jest.fn<Promise<boolean>, [string, boolean]>();
jest.mock("@/services/favorites", () => ({
  toggleFavorite: (companyId: string, current: boolean) =>
    mockToggleFavorite(companyId, current),
}));

// ─── Harness ──────────────────────────────────────────────────────────────────

const COMPANY_ID = "company-1";
const OTHER_ID = "company-2";

const company = (id: string, isFavorite: boolean) =>
  ({ id, name: id, is_favorite: isFavorite } as unknown as Company);

let client: QueryClient;
let toggle: ReturnType<typeof useToggleCompanyFavorite>;
let renderer: ReactTestRenderer;

function Harness() {
  toggle = useToggleCompanyFavorite(COMPANY_ID);
  return null;
}

function render() {
  client = new QueryClient({
    // gcTime 0: the default five minutes leaves a timer behind on unmount and
    // jest then waits it out instead of exiting.
    defaultOptions: { mutations: { retry: false, gcTime: 0 } },
  });
  client.setQueryData<Company[]>(companyKeys.list, [
    company(COMPANY_ID, false),
    company(OTHER_ID, false),
  ]);
  client.setQueryData<Company>(companyKeys.detail(COMPANY_ID), company(COMPANY_ID, false));

  act(() => {
    renderer = create(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    );
  });
}

const cachedList = () => client.getQueryData<Company[]>(companyKeys.list)!;
const cachedFavorite = (id: string) =>
  cachedList().find((c) => c.id === id)!.is_favorite;
const cachedDetailFavorite = () =>
  client.getQueryData<Company>(companyKeys.detail(COMPANY_ID))!.is_favorite;

beforeEach(() => {
  mockToggleFavorite.mockReset();
  render();
});

afterEach(() => {
  act(() => renderer.unmount());
  client.clear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

it("marks the company as favorite in every cached copy", async () => {
  mockToggleFavorite.mockResolvedValue(true);

  await act(async () => {
    await toggle.mutateAsync(false);
  });

  expect(cachedFavorite(COMPANY_ID)).toBe(true);
  expect(cachedDetailFavorite()).toBe(true);
  // Only the company that was pressed changes: the favorites counter counts rows.
  expect(cachedFavorite(OTHER_ID)).toBe(false);
});

it("patches the cache before the write lands, so the counter moves on press", async () => {
  let settle: (value: boolean) => void = () => {};
  mockToggleFavorite.mockReturnValue(new Promise((resolve) => { settle = resolve; }));

  let pending: Promise<boolean>;
  act(() => {
    pending = toggle.mutateAsync(false);
  });

  expect(cachedFavorite(COMPANY_ID)).toBe(true);

  await act(async () => {
    settle(true);
    await pending!;
  });

  expect(cachedFavorite(COMPANY_ID)).toBe(true);
});

it("puts the previous value back when the write fails", async () => {
  mockToggleFavorite.mockRejectedValue(new Error("offline"));

  await act(async () => {
    await expect(toggle.mutateAsync(false)).rejects.toThrow("offline");
  });

  expect(cachedFavorite(COMPANY_ID)).toBe(false);
  expect(cachedDetailFavorite()).toBe(false);
});

it("unfavoriting clears the flag", async () => {
  mockToggleFavorite.mockResolvedValue(false);
  client.setQueryData<Company[]>(companyKeys.list, [company(COMPANY_ID, true)]);

  await act(async () => {
    await toggle.mutateAsync(true);
  });

  expect(cachedFavorite(COMPANY_ID)).toBe(false);
});
