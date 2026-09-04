/**
 * Minimal RFC 4180 style CSV support for the "Front,Back" flashcard format.
 * Quoted fields may contain commas, escaped quotes ("") and line breaks.
 */

export interface CsvCard {
  front: string
  back: string
}

export class CsvParseError extends Error {}

/** Splits CSV text into rows of fields, honouring quoted fields. */
function parseRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let fieldWasQuoted = false

  const pushField = () => {
    row.push(fieldWasQuoted ? field : field.trim())
    field = ""
    fieldWasQuoted = false
  }

  const pushRow = () => {
    pushField()
    // Skip rows that are entirely empty.
    if (row.some((value) => value.length > 0)) rows.push(row)
    row = []
  }

  // Normalise line endings so CRLF files behave the same as LF files.
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n")

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      if (field.trim().length > 0) {
        throw new CsvParseError("A quoted value must start at the beginning of a column.")
      }
      field = ""
      inQuotes = true
      fieldWasQuoted = true
      continue
    }

    if (char === ",") {
      pushField()
      continue
    }

    if (char === "\n") {
      pushRow()
      continue
    }

    field += char
  }

  if (inQuotes) throw new CsvParseError("The file contains an unclosed quoted value.")
  pushRow()

  return rows
}

/**
 * Parses flashcards from CSV text. The first column is the front side and the
 * second is the back side; a header row is not required.
 */
export function parseCardsCsv(text: string): CsvCard[] {
  const rows = parseRows(text)
  if (rows.length === 0) throw new CsvParseError("The file does not contain any cards.")

  const cards: CsvCard[] = []
  const invalidLines: number[] = []

  rows.forEach((row, index) => {
    const front = (row[0] ?? "").trim()
    const back = (row[1] ?? "").trim()

    if (!front || !back) {
      invalidLines.push(index + 1)
      return
    }
    cards.push({ front, back })
  })

  if (cards.length === 0) {
    throw new CsvParseError("No valid rows were found. Each row needs a front and a back value.")
  }

  if (invalidLines.length > 0) {
    const shown = invalidLines.slice(0, 5).join(", ")
    const suffix = invalidLines.length > 5 ? ", ..." : ""
    throw new CsvParseError(
      `Row${invalidLines.length === 1 ? "" : "s"} ${shown}${suffix} ${
        invalidLines.length === 1 ? "does" : "do"
      } not contain both a front and a back value.`,
    )
  }

  return cards
}

function escapeField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Serialises cards to CSV without a header row. */
export function toCardsCsv(cards: CsvCard[]): string {
  return cards.map((card) => `${escapeField(card.front)},${escapeField(card.back)}`).join("\r\n")
}

/** Turns a set name into a safe file name such as "German-Words.csv". */
export function toCsvFileName(setName: string): string {
  const base =
    setName
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}\-_]/gu, "") || "flashcards"
  return `${base}.csv`
}

/** Triggers a browser download of UTF-8 CSV content. */
export function downloadCsv(fileName: string, csv: string): void {
  // The BOM keeps Unicode text readable when the file is opened in Excel.
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
