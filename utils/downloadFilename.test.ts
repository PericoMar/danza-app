import { buildDownloadFilename } from "./downloadFilename";

const SUPABASE_URL =
  "https://xyz.supabase.co/storage/v1/object/public/media/companies/42/1700000000-img.webp";

describe("buildDownloadFilename", () => {
  it("slugifies name and label and keeps the URL's extension", () => {
    expect(buildDownloadFilename("Royal Ballet", "logo", SUPABASE_URL)).toBe(
      "royal-ballet-logo.webp"
    );
  });

  it("strips accents and punctuation", () => {
    expect(buildDownloadFilename("Compañía Nacional de Danza!", "logo", SUPABASE_URL)).toBe(
      "compania-nacional-de-danza-logo.webp"
    );
  });

  it("ignores query strings and fragments when reading the extension", () => {
    expect(
      buildDownloadFilename("Ballet", "logo", "https://cdn.example.com/a/b/Logo.PNG?v=3#x")
    ).toBe("ballet-logo.png");
  });

  it("falls back to a default extension when the URL has none", () => {
    expect(buildDownloadFilename("Ballet", "logo", "https://cdn.example.com/logo")).toBe(
      "ballet-logo.png"
    );
  });

  it("drops a blank name", () => {
    expect(buildDownloadFilename("  ", "logo", SUPABASE_URL)).toBe("logo.webp");
  });

  it("uses a generic stem when name and label are both blank", () => {
    expect(buildDownloadFilename("", "", SUPABASE_URL)).toBe("file.webp");
  });
});
