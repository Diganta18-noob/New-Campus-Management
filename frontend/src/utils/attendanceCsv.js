export const csvCell = value => {
  let text = String(value ?? '');
  if (/^[\s\uFEFF]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

export const attendanceCsv = (rows, range) => [
  ['Attendance report', `${range.startDate} to ${range.endDate} UTC`],
  ['Date (UTC)', 'Batch', 'Learner', 'Status', 'Remarks', 'Marked by'],
  ...rows.map(row => [
    String(row.date).slice(0, 10), row.batch?.name || '',
    [row.learner?.firstName, row.learner?.lastName].filter(Boolean).join(' '),
    row.status, row.remarks || '',
    [row.markedBy?.firstName, row.markedBy?.lastName].filter(Boolean).join(' '),
  ]),
].map(row => row.map(csvCell).join(',')).join('\r\n');

export const fetchAttendanceExport = async (getReport, filters, expectedTotal) => {
  if (expectedTotal > 5000) throw new Error('More than 5,000 rows. Narrow the date range or batch before exporting.');
  const rows = [];
  for (let page = 1; page <= Math.ceil(expectedTotal / 100); page++) {
    const response = await getReport({ ...filters, page, limit: 100 });
    rows.push(...response.data.rows);
  }
  if (rows.length !== expectedTotal) throw new Error('Records changed during export. Refresh and try again.');
  return rows;
};
