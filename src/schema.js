// Frontmatter schemas for collections: `collections: { blog: { schema: { title: 'string', … } } }`.
// A field is a type name (`'string'`, `'string?'` for optional) or
// `{ type, required = true, validate(value, data) }`; validate returns true, false or a message.
const TYPES = {
  string: v => typeof v === 'string',
  number: v => typeof v === 'number' && Number.isFinite(v),
  boolean: v => typeof v === 'boolean',
  date: v => (v instanceof Date || typeof v === 'string' || typeof v === 'number') && !Number.isNaN(new Date(v).getTime()),
  'string[]': v => Array.isArray(v) && v.every(x => typeof x === 'string'),
};

function field(name, spec, collection) {
  if (typeof spec === 'string') spec = { type: spec.replace(/\?$/, ''), required: !spec.endsWith('?') };
  if (!spec || typeof spec !== 'object') throw new Error(`collections.${collection}.schema.${name}: expected a type name or { type, required, validate }`);
  const type = spec.type ?? (spec.validate ? null : undefined);
  if (type !== null && !TYPES[type]) {
    throw new Error(`collections.${collection}.schema.${name}: unknown type ${JSON.stringify(spec.type)}. Use ${Object.keys(TYPES).join(', ')}`);
  }
  if (spec.validate != null && typeof spec.validate !== 'function') throw new Error(`collections.${collection}.schema.${name}: validate must be a function`);
  return { type, required: spec.required !== false, validate: spec.validate };
}

/** Returns error strings ("file: field \"x\" …") for one entry's frontmatter. */
export function validateData(data, schema, { file, collection }) {
  const errors = [];
  for (const [name, raw] of Object.entries(schema)) {
    const f = field(name, raw, collection);
    const value = data[name];
    const at = `${file}: field "${name}"`;
    if (value == null || value === '') {
      if (f.required) errors.push(`${at} is required${f.type ? ` (${f.type})` : ''} by collections.${collection}.schema`);
      continue;
    }
    if (f.type && !TYPES[f.type](value)) {
      errors.push(`${at} must be ${f.type === 'date' ? 'a date' : f.type === 'string[]' ? 'a list of strings' : `a ${f.type}`}, got ${JSON.stringify(value)}`);
      continue;
    }
    if (f.validate) {
      let res;
      try { res = f.validate(value, data); } catch (err) { res = err.message; }
      if (res === false) errors.push(`${at} failed validation (${JSON.stringify(value)})`);
      else if (typeof res === 'string') errors.push(`${at}: ${res}`);
    }
  }
  return errors;
}
