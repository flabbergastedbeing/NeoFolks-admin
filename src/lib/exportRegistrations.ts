import type { Cell, SheetData } from "write-excel-file/browser";
import type { ClubEvent, Registration, RegistrationStatus } from "@/types";

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
};

const DATE_TIME_FORMAT = "dd mmm yyyy hh:mm";
const HEADER = { fontWeight: "bold", backgroundColor: "#E6E6E6" } as const;

// write-excel-file stores dates as UTC. Shift by the viewer's offset so a
// registration made at 3:45 PM shows as 3:45 PM in the sheet, not 10:15.
function localDateCell(iso: string): Cell {
  const d = new Date(iso);
  return {
    value: new Date(d.getTime() - d.getTimezoneOffset() * 60_000),
    type: Date,
    format: DATE_TIME_FORMAT,
  };
}

// Participant-supplied text is always written as a plain-text cell ("@"), never
// a formula, so a value like "=1+1" can't run in Excel, and things like phone
// numbers or "00123" keep their exact digits.
const textCell = (value: string): Cell => ({ value, type: String, format: "@" });
const header = (value: string): Cell => ({ value, ...HEADER });

function emailStatus(r: Registration): string {
  if (r.status !== "approved") return "";
  if (r.emailSentAt) return "Sent";
  return r.emailError ? "Failed" : "Not sent";
}

function safeFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const today = new Date().toISOString().slice(0, 10);
  return `${slug || "event"}-registrations-${today}.xlsx`;
}

// Builds the two sheets. Exported separately from the download so it can be
// inspected without a browser.
export function buildRegistrationSheets(event: ClubEvent, registrations: Registration[]) {
  const counts: Record<RegistrationStatus, number> = {
    pending: 0,
    approved: 0,
    waitlisted: 0,
    rejected: 0,
  };
  for (const r of registrations) counts[r.status] += 1;

  const summary: SheetData = [
    [header("Event"), textCell(event.title)],
    [header("Date"), textCell(event.date)],
    [header("Category"), textCell(event.category)],
    [header("Entry limit"), event.capacity != null ? event.capacity : textCell("No limit")],
    [header("Total registrations"), registrations.length],
    [header("Spots taken (pending + approved)"), counts.pending + counts.approved],
    [header("Pending"), counts.pending],
    [header("Approved"), counts.approved],
    [header("Waitlisted"), counts.waitlisted],
    [header("Rejected"), counts.rejected],
    [header("Exported"), localDateCell(new Date().toISOString())],
  ];

  // One column per registration question. Built from what people actually
  // answered (each entry keeps a snapshot of its questions), so the sheet stays
  // correct even if the admin edited the form after some people had registered.
  const questions = new Map<string, string>();
  for (const r of registrations) for (const a of r.answers) questions.set(a.id, a.label);
  const questionIds = [...questions.keys()];

  const details: SheetData = [
    [
      header("#"),
      header("Name"),
      header("Email"),
      header("Registered as"),
      header("Status"),
      header("Submitted"),
      header("Reviewed"),
      header("Confirmation email"),
      ...questionIds.map((id) => header(questions.get(id) ?? id)),
    ],
    ...registrations.map((r, i): Cell[] => [
      i + 1,
      textCell(r.fullName),
      textCell(r.email),
      textCell(r.registrantType === "outside" ? "Outside university" : "NUV student"),
      textCell(STATUS_LABEL[r.status]),
      localDateCell(r.createdAt),
      r.reviewedAt ? localDateCell(r.reviewedAt) : null,
      textCell(emailStatus(r)),
      ...questionIds.map((id) => {
        const answer = r.answers.find((a) => a.id === id);
        return answer ? textCell(answer.value) : null;
      }),
    ]),
  ];

  const detailColumns = [
    { width: 5 },
    { width: 26 },
    { width: 32 },
    { width: 20 },
    { width: 13 },
    { width: 18 },
    { width: 18 },
    { width: 20 },
    ...questionIds.map(() => ({ width: 24 })),
  ];

  return { summary, details, detailColumns };
}

// Downloads an .xlsx with a Summary sheet (the counts) and a Registrations sheet
// (one row per person, with their answers). Exports every entry for the event,
// regardless of the status filter currently selected on screen.
export async function downloadRegistrationsExcel(event: ClubEvent, registrations: Registration[]) {
  // Loaded on demand so the spreadsheet code isn't part of the normal page load.
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const { summary, details, detailColumns } = buildRegistrationSheets(event, registrations);

  await writeExcelFile([
    { data: summary, sheet: "Summary", columns: [{ width: 34 }, { width: 40 }] },
    { data: details, sheet: "Registrations", columns: detailColumns, stickyRowsCount: 1 },
  ]).toFile(safeFileName(event.title));
}