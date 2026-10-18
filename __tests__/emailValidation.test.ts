import { isValidEmail, suggestEmailFix } from "@/utils/validation";

describe("isValidEmail", () => {
  it.each([
    "dancer@gmail.com",
    "a.b+tag@sub.domain.co.uk",
    "name@danza-app.com",
  ])("acepta %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    ["sin arroba", "dancer.gmail.com"],
    ["sin dominio", "dancer@"],
    ["sin extensión", "dancer@gmail"],
    ["extensión de una letra", "dancer@gmail.c"],
    ["extensión numérica", "dancer@gmail.c0m"],
    ["puntos seguidos", "dancer@gmail..com"],
    ["punto final", "dancer@gmail.com."],
    ["guion suelto al final del dominio", "dancer@gmail-.com"],
    ["espacio", "dan cer@gmail.com"],
  ])("rechaza %s", (_caso, email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe("suggestEmailFix", () => {
  it.each([
    // El caso que llegó a Brevo.
    ["dancer@gmail.con", "dancer@gmail.com"],
    ["dancer@miempresa.con", "dancer@miempresa.com"],
    ["dancer@gmial.com", "dancer@gmail.com"],
    ["dancer@gmail.co", "dancer@gmail.com"],
    ["dancer@hotmai.com", "dancer@hotmail.com"],
    ["dancer@yaho.com", "dancer@yahoo.com"],
    ["DANCER@Gmail.Con", "DANCER@gmail.com"],
  ])("corrige %s → %s", (typo, fixed) => {
    expect(suggestEmailFix(typo)).toBe(fixed);
  });

  it.each([
    "dancer@gmail.com",
    "dancer@hotmail.es",
    // Dominio propio: lejos de todos los conocidos, no se toca.
    "info@danza-app.com",
    "bailarin@teatroreal.es",
    // .co es Colombia, no un desliz.
    "hola@empresa.co",
  ])("deja %s como está", (email) => {
    expect(suggestEmailFix(email)).toBeNull();
  });

  it("no opina sobre una dirección que ni siquiera es válida", () => {
    expect(suggestEmailFix("dancer@gmail")).toBeNull();
  });
});
