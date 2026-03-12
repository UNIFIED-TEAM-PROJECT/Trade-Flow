import { prisma } from "./db";

export async function getAccountingOverview(organisationId: string) {
  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { organisationId },
      select: { total: true, vatTotal: true, status: true },
    }),
    prisma.expense.findMany({
      where: { organisationId },
      select: { amount: true, vatAmount: true },
    }),
  ]);

  const income = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const incomeVat = invoices.reduce((sum, invoice) => sum + Number(invoice.vatTotal), 0);
  const costs = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const costsVat = expenses.reduce((sum, expense) => sum + Number(expense.vatAmount), 0);

  return {
    income,
    costs,
    profit: income - costs,
    outputVat: incomeVat,
    inputVat: costsVat,
    vatDue: incomeVat - costsVat,
    outstandingInvoices: invoices.filter((item) => item.status !== "PAID").length,
  };
}

export function toCsv<T extends Record<string, string | number | null>>(rows: T[]) {
  if (rows.length === 0) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) {
        return "";
      }
      const text = String(value).replaceAll('"', '""');
      return `"${text}"`;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
}
