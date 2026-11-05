export function parseCsv(text, maxRows = 500) {
  if (typeof text !== 'string' || text.length > 2_000_000) throw new Error('CSV file must be under 2 MB');
  const rows = [];
  let row = [], cell = '', quoted = false;
  const endCell = () => { row.push(cell); cell = ''; };
  const endRow = () => { endCell(); if (row.some(value => value.trim())) rows.push(row); row = []; if (rows.length > maxRows + 1) throw new Error(`Import at most ${maxRows} learners`); };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') {
      if (cell) throw new Error('Invalid CSV quote');
      quoted = true;
    } else if (char === ',') endCell();
    else if (char === '\n') endRow();
    else if (char !== '\r') cell += char;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (cell || row.length) endRow();
  if (rows.length < 2) throw new Error('CSV needs a header and at least one learner');
  const headers = rows.shift().map(value => value.replace(/^\uFEFF/, '').toLowerCase().trim());
  if (!headers.includes('email') || !headers.some(value => value.includes('first'))) throw new Error('CSV must include first name and email columns');
  if (rows.some(values => values.length !== headers.length)) throw new Error('CSV rows must match the header columns');
  return { headers, rows };
}
