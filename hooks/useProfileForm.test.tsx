import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useProfileForm } from "./useProfileForm";
import { EMPTY_PROFILE, type ProfileFields } from "@/services/profile";
import { SAVE_STATUS, type SaveStatus } from "@/types/profile";
import { SAVE_SUCCESS_VISIBLE_MS } from "@/constants/profile";

// ─── Mocks ────────────────────────────────────────────────────────────────────
// useProfile is the data seam: the test controls the stored profile and save().

const STORED: ProfileFields = { ...EMPTY_PROFILE, name: "Ana" };
let mockProfile: ProfileFields | undefined;
const mockSave = jest.fn<Promise<ProfileFields>, [ProfileFields]>();

jest.mock("@/services/supabase", () => ({ supabase: {} }));

jest.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({
    email: "ana@example.com",
    profile: mockProfile,
    isLoading: false,
    loadError: null,
    save: mockSave,
  }),
}));

// ─── Harness ──────────────────────────────────────────────────────────────────

type Form = ReturnType<typeof useProfileForm>;
let form: Form;
let statuses: SaveStatus[];
let renderer: ReactTestRenderer;

function Harness() {
  form = useProfileForm();
  statuses.push(form.saveStatus);
  return null;
}

function mount() {
  act(() => {
    renderer = create(<Harness />);
  });
}

/** Simulates React Query delivering the updated cache a tick after the save resolved. */
function deliverProfile(next: ProfileFields) {
  mockProfile = next;
  act(() => renderer.update(<Harness />));
}

beforeEach(() => {
  jest.useFakeTimers();
  mockProfile = STORED;
  mockSave.mockReset();
  statuses = [];
});

afterEach(() => {
  act(() => renderer.unmount());
  jest.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

it("starts clean and goes dirty on edit", () => {
  mount();
  expect(form.saveStatus).toBe(SAVE_STATUS.CLEAN);

  act(() => form.setField("last_name", "Ruiz"));
  expect(form.saveStatus).toBe(SAVE_STATUS.DIRTY);
});

it("goes saving → saved (never dirty in between) → clean after the confirmation", async () => {
  mount();
  act(() => form.setField("last_name", " Ruiz "));

  let resolveSave!: (saved: ProfileFields) => void;
  mockSave.mockReturnValue(new Promise((resolve) => (resolveSave = resolve)));

  let submitting!: Promise<void>;
  act(() => {
    submitting = form.submit();
  });
  expect(form.saveStatus).toBe(SAVE_STATUS.SAVING);

  statuses = [];
  const saved = { ...STORED, last_name: "Ruiz" };
  await act(async () => {
    resolveSave(saved);
    await submitting;
  });
  deliverProfile(saved);

  expect(statuses).not.toContain(SAVE_STATUS.DIRTY);
  expect(form.saveStatus).toBe(SAVE_STATUS.SAVED);
  expect(form.values.last_name).toBe("Ruiz");

  act(() => jest.advanceTimersByTime(SAVE_SUCCESS_VISIBLE_MS));
  expect(form.saveStatus).toBe(SAVE_STATUS.CLEAN);
});

it("drops the confirmation as soon as the user edits again", async () => {
  mount();
  act(() => form.setField("bio", "Dancer"));
  mockSave.mockResolvedValue({ ...STORED, bio: "Dancer" });

  await act(async () => {
    await form.submit();
  });
  expect(form.saveStatus).toBe(SAVE_STATUS.SAVED);

  act(() => form.setField("bio", "Dancer and choreographer"));
  expect(form.saveStatus).toBe(SAVE_STATUS.DIRTY);
});

it("shows an error that clears on the next edit, keeping the draft", async () => {
  mount();
  act(() => form.setField("bio", "Dancer"));
  mockSave.mockRejectedValue(new Error("network"));

  await act(async () => {
    await form.submit();
  });
  expect(form.saveStatus).toBe(SAVE_STATUS.ERROR);
  expect(form.values.bio).toBe("Dancer");
  expect(form.canSave).toBe(true);

  act(() => form.setField("bio", "Dancer!"));
  expect(form.saveStatus).toBe(SAVE_STATUS.DIRTY);
});

it("discard returns to clean without a confirmation", () => {
  mount();
  act(() => form.setField("name", "Anna"));
  act(() => form.reset());
  expect(form.saveStatus).toBe(SAVE_STATUS.CLEAN);
  expect(form.values).toEqual(STORED);
});
