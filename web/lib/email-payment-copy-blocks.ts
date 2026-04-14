/** Shared HTML for payment-related transactional emails (easy tap-to-select + copy in many clients). */

export function escapeEmailHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Short guidance shown once under the copy fields. */
export function emailPaymentCopyHintHtml(): string {
  return `<p style="margin:0 0 14px;color:#64748b;font-size:11px;line-height:1.5">Tip: tap a highlighted box once to select all text, then copy. Your payment code must match <strong>exactly</strong>.</p>`;
}

/**
 * Bordered value row; `-webkit-user-select: all` helps Gmail/mobile select the whole value in one tap.
 */
export function emailSelectableValueBlock(
  label: string,
  value: string,
  opts?: { monospace?: boolean }
): string {
  const labelEsc = escapeEmailHtml(label);
  const valueEsc = escapeEmailHtml(value);
  const mono = opts?.monospace !== false;
  const font = mono
    ? "font-family:Consolas,'Courier New',ui-monospace,monospace;"
    : "font-family:Arial,Helvetica,sans-serif;";
  return `
          <p style="margin:0 0 6px;color:#475569;font-size:12px">${labelEsc}</p>
          <div style="margin:0 0 14px;padding:12px 14px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:12px;font-size:${mono ? "16px" : "14px"};color:#0f274f;font-weight:700;${font}word-break:break-all;-webkit-user-select:all;user-select:all;-ms-user-select:all;">
            ${valueEsc}
          </div>`;
}
