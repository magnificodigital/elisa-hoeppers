// Luhn algorithm — valida número de cartão
export function isValidCardNumber(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function formatCardNumber(num: string): string {
  const digits = num.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatExpiry(exp: string): string {
  const digits = exp.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function parseExpiry(exp: string): { month: string; year: string } | null {
  const match = exp.match(/^(\d{2})\/?(\d{2,4})$/);
  if (!match) return null;
  const month = match[1];
  const year = match[2];
  if (parseInt(month) < 1 || parseInt(month) > 12) return null;
  return { month, year };
}

export function isExpiryValid(exp: string): boolean {
  const parsed = parseExpiry(exp);
  if (!parsed) return false;
  const year = parsed.year.length === 2 ? 2000 + parseInt(parsed.year) : parseInt(parsed.year);
  const month = parseInt(parsed.month);
  const now = new Date();
  const cardDate = new Date(year, month - 1, 1);
  cardDate.setMonth(cardDate.getMonth() + 1);
  return cardDate > now;
}

export function detectBrand(num: string): string | null {
  const digits = num.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|5)/.test(digits)) return "discover";
  if (/^(?:5067|4576|4011|509)/.test(digits)) return "elo";
  if (/^6(?:36368|38935)/.test(digits)) return "hipercard";
  return null;
}
