export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        field = '';
        if (row.some((f) => f.trim() !== '')) rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

export function exportCSV(names: string[]): string {
  const header = 'name';
  const lines = names.map((n) => {
    const clean = n.replace(/"/g, '""');
    return `"${clean}"`;
  });
  return [header, ...lines].join('\n');
}

export function parseParticipantCSV(text: string, maxEntries = 500): { names: string[]; error?: string } {
  if (!text.trim()) return { names: [], error: 'The file is empty.' };
  const rows = parseCSV(text);
  if (rows.length === 0) return { names: [], error: 'The file is empty.' };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  let nameIndex = header.indexOf('name');
  if (nameIndex === -1) {
    const firstNameCol = header.findIndex((h) => h.includes('name') || h.includes('participant'));
    if (firstNameCol !== -1) nameIndex = firstNameCol;
  }

  const names: string[] = [];
  const dataRows = nameIndex >= 0 ? rows.slice(1) : rows;
  const col = nameIndex >= 0 ? nameIndex : 0;
  if (!nameIndex) {
    for (const row of dataRows) {
      if (row.length === 0) continue;
      const name = row[0]?.trim();
      if (name) {
        names.push(name);
        if (names.length >= maxEntries) break;
      }
    }
  } else {
    for (const row of dataRows) {
      const name = row[col]?.trim();
      if (name) {
        names.push(name);
        if (names.length >= maxEntries) break;
      }
    }
  }
  if (names.length === 0) {
    return { names: [], error: 'No valid names found. Ensure the CSV has a "name" column.' };
  }
  return { names };
}