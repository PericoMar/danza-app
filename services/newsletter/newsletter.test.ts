import {
  checkNewsletterSubscription,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from "./index";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// In jest-expo __DEV__ is true; Platform.OS defaults to 'ios' → base = http://localhost:3000
const BASE = "http://localhost:3000";

function mockOk(body: object): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function mockError(status: number, body: object | string): Response {
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok: false,
    status,
    statusText: "Error",
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(bodyStr),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── checkNewsletterSubscription ─────────────────────────────────────────────

describe("checkNewsletterSubscription", () => {
  it("returns 'subscribed' when server responds with status subscribed", async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ status: "subscribed" }));

    const result = await checkNewsletterSubscription("user@example.com");

    expect(result).toBe("subscribed");
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/api/newsletter/status`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com" }),
      })
    );
  });

  it("returns 'not_subscribed' when server responds with status not_subscribed", async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ status: "not_subscribed" }));

    const result = await checkNewsletterSubscription("user@example.com");

    expect(result).toBe("not_subscribed");
  });

  it("normalizes email to lowercase before sending", async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ status: "subscribed" }));

    await checkNewsletterSubscription("User@EXAMPLE.COM");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ email: "user@example.com" }),
      })
    );
  });

  it("returns 'not_subscribed' on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(mockError(500, { error: "Server error" }));

    const result = await checkNewsletterSubscription("user@example.com");

    expect(result).toBe("not_subscribed");
  });

  it("returns 'not_subscribed' on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    const result = await checkNewsletterSubscription("user@example.com");

    expect(result).toBe("not_subscribed");
  });
});

// ─── subscribeToNewsletter ────────────────────────────────────────────────────

describe("subscribeToNewsletter", () => {
  it("resolves on success", async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ success: true }));

    await expect(
      subscribeToNewsletter("user@example.com", "newsletter_page")
    ).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/api/newsletter`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", source: "newsletter_page" }),
      })
    );
  });

  it("uses 'newsletter_page' as default source", async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ success: true }));

    await subscribeToNewsletter("user@example.com");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ email: "user@example.com", source: "newsletter_page" }),
      })
    );
  });

  it("throws with server error message on non-ok JSON response", async () => {
    mockFetch.mockResolvedValueOnce(
      mockError(400, { error: "Invalid email" })
    );

    await expect(subscribeToNewsletter("bad@email.com")).rejects.toThrow(
      "Invalid email"
    );
  });

  it("throws with server message field if present", async () => {
    mockFetch.mockResolvedValueOnce(
      mockError(409, { message: "Already subscribed" })
    );

    await expect(subscribeToNewsletter("user@example.com")).rejects.toThrow(
      "Already subscribed"
    );
  });

  it("throws 'Network error' on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(subscribeToNewsletter("user@example.com")).rejects.toThrow(
      "Network error. Please check your connection."
    );
  });
});

// ─── unsubscribeFromNewsletter ────────────────────────────────────────────────

describe("unsubscribeFromNewsletter", () => {
  it("resolves on success", async () => {
    mockFetch.mockResolvedValueOnce(mockOk({ success: true }));

    await expect(
      unsubscribeFromNewsletter("user@example.com")
    ).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/api/newsletter/unsubscribe`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com" }),
      })
    );
  });

  it("throws with server error message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(
      mockError(404, { error: "Email not found" })
    );

    await expect(
      unsubscribeFromNewsletter("user@example.com")
    ).rejects.toThrow("Email not found");
  });

  it("throws 'Network error' on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(
      unsubscribeFromNewsletter("user@example.com")
    ).rejects.toThrow("Network error. Please check your connection.");
  });

  it("falls back to status text when response body is not JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: () => Promise.resolve("Service Unavailable"),
    } as unknown as Response);

    await expect(
      unsubscribeFromNewsletter("user@example.com")
    ).rejects.toThrow("Service Unavailable");
  });
});
