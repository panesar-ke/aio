/**
 * `jsmith@panesar.co.ke` → `j••••@panesar.co.ke`.
 *
 * The dot count is fixed so the mask does not leak the local part's length.
 */
export function maskEmail(email: string) {
  const at = email.indexOf('@');
  if (at < 1) {
    return email;
  }

  return `${email[0]}••••${email.slice(at)}`;
}
