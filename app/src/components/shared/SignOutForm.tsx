type SignOutFormProps = {
  /** Safe path-only redirect after logout (must start with `/`). */
  nextPath?: string;
  /** Tighter spacing / full-width button for nested UI (e.g. header dropdown). */
  compact?: boolean;
};

export function SignOutForm({ nextPath = "/", compact = false }: SignOutFormProps) {
  return (
    <form
      action="/auth/logout"
      method="post"
      style={{
        display: compact ? "block" : "inline-block",
        marginTop: compact ? 0 : 24,
        width: compact ? "100%" : undefined,
      }}
    >
      <input type="hidden" name="next" value={nextPath} />
      <button
        type="submit"
        className="btn sm ghost"
        style={compact ? { width: "100%", justifyContent: "center", marginTop: 0 } : undefined}
      >
        Sign out
      </button>
    </form>
  );
}
