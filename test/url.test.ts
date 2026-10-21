import { describe, expect, it } from "vitest";
import { gmailComposeUrl, normalizeUrl } from "../src/url.js";

describe("normalizeUrl", () => {
  it.each([
    ["http://render.com/", "https://render.com/"],
    ["HTTP://render.com/", "https://render.com/"],
    ["https://render.com/", "https://render.com/"],
    ["HTTPS://render.com/", "https://render.com/"],
    ["render.com", "https://render.com"],
    ["render.com/careers", "https://render.com/careers"],
    ["render.com:8080/x", "https://render.com:8080/x"],
    ["  render.com  ", "https://render.com"],
    ["ren\tder.com", "https://render.com"],
    ["mailto:shifra@render.com", "mailto:shifra@render.com"],
    ["MAILTO:shifra@render.com", "mailto:shifra@render.com"],
    ["mailto:", "mailto:"],
    ["ftp://example.com/f", "ftp://example.com/f"],
    ["javascript:alert(1)", "javascript:alert(1)"],
    ["", ""],
    ["   ", ""],
  ])("normalizes %o to %o", (cell, expected) => {
    expect(normalizeUrl(cell)).toBe(expected);
  });

  it("upgrades http without touching the rest of the URL", () => {
    expect(normalizeUrl("http://user@render.com:8080/a/b?q=1#f")).toBe(
      "https://user@render.com:8080/a/b?q=1#f",
    );
  });

  it("is idempotent", () => {
    for (const cell of ["render.com", "http://render.com", "mailto:a@b.com", "ftp://x.com"]) {
      const once = normalizeUrl(cell);
      expect(normalizeUrl(once)).toBe(once);
    }
  });
});

const GMAIL = "https://mail.google.com/mail/?view=cm&fs=1";

describe("gmailComposeUrl", () => {
  it.each([
    ["mailto:shifra@render.com", `${GMAIL}&to=shifra@render.com`],
    ["MAILTO:shifra@render.com", `${GMAIL}&to=shifra@render.com`],
    ["mailto:a@b.com,c@d.com", `${GMAIL}&to=a@b.com,c@d.com`],
    [
      "mailto:a@b.com?subject=Hi%20there&body=Line%201%0ALine%202",
      `${GMAIL}&to=a@b.com&su=Hi%20there&body=Line%201%0ALine%202`,
    ],
    ["mailto:a@b.com?cc=c@d.com&bcc=e@f.com", `${GMAIL}&to=a@b.com&cc=c@d.com&bcc=e@f.com`],
    ["mailto:a@b.com?Subject=Hi&BODY=Yo", `${GMAIL}&to=a@b.com&su=Hi&body=Yo`],
    ["mailto:a@b.com?in-reply-to=x&subject=Hi", `${GMAIL}&to=a@b.com&su=Hi`],
    ["mailto:a@b.com?constructor=x", `${GMAIL}&to=a@b.com`],
    ["mailto:?subject=Hi", `${GMAIL}&su=Hi`],
    ["mailto:?to=a@b.com&subject=Hi", `${GMAIL}&to=a@b.com&su=Hi`],
    ["mailto:a@b.com?To=c@d.com", `${GMAIL}&to=a@b.com,c@d.com`],
  ])("maps %o to Gmail compose", (mailto, expected) => {
    expect(gmailComposeUrl(mailto)).toBe(expected);
  });

  it("encodes a plus sign so Gmail does not read it as a space", () => {
    expect(gmailComposeUrl("mailto:shifra+links@render.com?subject=C++")).toBe(
      `${GMAIL}&to=shifra%2Blinks@render.com&su=C%2B%2B`,
    );
  });

  it.each([
    ["mailto:a@b.com?subject=Hello world", `${GMAIL}&to=a@b.com&su=Hello%20world`],
    ["mailto:a@b.com?subject=Hi#x&body=Yo", `${GMAIL}&to=a@b.com&su=Hi%23x&body=Yo`],
    ["mailto:a&b@x.com", `${GMAIL}&to=a%26b@x.com`],
    ["mailto:a@b.com?subject=Q%26A", `${GMAIL}&to=a@b.com&su=Q%26A`],
    ["mailto:a@b.com?subject=caf%C3%A9", `${GMAIL}&to=a@b.com&su=caf%C3%A9`],
    ["mailto:a@b.com?subject=Hi!(*)'", `${GMAIL}&to=a@b.com&su=Hi%21%28%2A%29%27`],
    ["mailto:a@b.com?subject=100%", `${GMAIL}&to=a@b.com&su=100%25`],
    ["mailto:a@b.com?subject=%C3", `${GMAIL}&to=a@b.com&su=%EF%BF%BD`],
  ])("re-encodes %o for the query string", (mailto, expected) => {
    expect(gmailComposeUrl(mailto)).toBe(expected);
  });
});
