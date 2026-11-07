import writeExcelFile from 'write-excel-file/universal';
import { researchTable, type ResearchRow } from './researchCsv';

// Same table as the CSV, but as a real Excel file so columns have a readable width
// (a CSV cannot carry widths: dates show as ### and school names get cut off).

const MIN_WIDTH = 8;
const MAX_WIDTH = 42;
const TIER_FILL: Record<string, string> = { reach: '#F8D7DA', target: '#FFF1C9', safety: '#D5EFD9' };
const HEADER_FILL = '#E4E7F5';

const fillFor = (column: string) => TIER_FILL[column.split('_')[0]] ?? HEADER_FILL;
const asCellValue = (text: string) => (/^-?\d+(\.\d+)?$/.test(text) ? Number(text) : text);

export async function researchRowsToXlsx(rows: ResearchRow[]): Promise<Blob> {
  const { header, records } = researchTable(rows);
  const widths = header.map((name, i) =>
    Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, name.length, ...records.map((r) => r[i].length)) + 2));
  // student_id and date columns are text so Excel never reformats them.
  const data = [
    header.map((name) => ({ value: name, fontWeight: 'bold' as const, backgroundColor: fillFor(name) })),
    ...records.map((record) => record.map((text, i) => (text === '' ? null : { value: i < 2 ? text : asCellValue(text) }))),
  ];
  return writeExcelFile(data as any, {
    sheet: 'Research',
    columns: widths.map((width) => ({ width })),
    stickyRowsCount: 1,
    stickyColumnsCount: 1,
  }).toBlob();
}
