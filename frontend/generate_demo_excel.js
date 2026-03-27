import * as XLSX from 'xlsx';

const data = [
  { firstname: 'Alice', lastname: 'Demo', email: 'alice.demo@example.com', rollnumber: 'D001', phone: '1112223333', cohortid: 'FALL-2026' },
  { firstname: 'Bob', lastname: 'Test', email: 'bob.test@example.com', rollnumber: 'D002', phone: '4445556666', cohortid: 'FALL-2026' },
  { firstname: 'Charlie', lastname: 'Student', email: 'charlie.student@example.com', rollnumber: 'D003', phone: '7778889999', cohortid: 'FALL-2026' },
  { firstname: 'David', lastname: 'Sample', email: 'david.sample@example.com', rollnumber: 'D004', phone: '0001112222', cohortid: 'FALL-2026' }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Students');

XLSX.writeFile(wb, 'demo_students.xlsx');
console.log('Created demo_students.xlsx successfully!');
