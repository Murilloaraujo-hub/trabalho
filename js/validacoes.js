/* ===== EPHYRA FINANCE — VALIDATIONS ===== */
const Validate = {
  required: (v) => v !== undefined && v !== null && String(v).trim() !== '',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  minLen: (v, n) => String(v).length >= n,
  positive: (v) => Number(v) > 0,
  number: (v) => !isNaN(v) && isFinite(v),

  form(rules) {
    const errors = [];
    for (const r of rules) {
      if (!r.test) errors.push(r.msg);
    }
    if (errors.length) { Toast.error(errors[0]); return false; }
    return true;
  }
};
