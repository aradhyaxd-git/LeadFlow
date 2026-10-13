import { LeadSummary } from "@/types";

export function exportLeadsToCsv(leads: LeadSummary[]) {
  const headers = [
    "ID",
    "Name",
    "Company",
    "Phone",
    "Status",
    "Next Follow Up",
    "Created At",
    "Last Note",
    "Last Discussion At",
  ];

  const escapeCsv = (val: string | null | undefined) => {
    if (val === null || val === undefined) return '""';
    const clean = String(val).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = leads.map((l) => [
    l.id,
    escapeCsv(l.name),
    escapeCsv(l.company),
    escapeCsv(l.phone),
    escapeCsv(l.status),
    escapeCsv(l.follow_up_at),
    escapeCsv(l.created_at),
    escapeCsv(l.last_note),
    escapeCsv(l.last_discussion_at),
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `leadflow_leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
