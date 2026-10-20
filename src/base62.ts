const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function encode(n: bigint): string {
  if (n === 0n) return CHARS[0];
  let s = "";
  while (n > 0n) {
    s = CHARS[Number(n % 62n)] + s;
    n /= 62n;
  }
  return s;
}
