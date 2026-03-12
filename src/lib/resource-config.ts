import { MembershipRole } from "@prisma/client";
import { ADMIN_ROLES, ALL_APP_ROLES, OPERATOR_ROLES } from "./rbac";

type ResourceConfig = {
  model: string;
  tenantScoped: boolean;
  readRoles: MembershipRole[];
  writeRoles: MembershipRole[];
  searchFields?: string[];
  include?: Record<string, unknown>;
  orderBy?: Record<string, "asc" | "desc">;
};

export const RESOURCE_CONFIG: Record<string, ResourceConfig> = {
  customers: {
    model: "customer",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: ADMIN_ROLES,
    searchFields: ["displayName", "email", "phone"],
  },
  properties: {
    model: "property",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: ADMIN_ROLES,
    searchFields: ["addressLine1", "city", "postcode"],
  },
  technicians: {
    model: "technician",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: ADMIN_ROLES,
    searchFields: ["displayName", "email"],
  },
  vans: {
    model: "van",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: ADMIN_ROLES,
    searchFields: ["name", "registration", "identifier"],
  },
  racks: {
    model: "rack",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: ADMIN_ROLES,
    searchFields: ["label"],
  },
  slots: {
    model: "slot",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: ADMIN_ROLES,
    searchFields: ["label", "category"],
  },
  suppliers: {
    model: "supplier",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: ADMIN_ROLES,
    searchFields: ["name", "email"],
  },
  "inventory-items": {
    model: "inventoryItem",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: OPERATOR_ROLES,
    searchFields: ["name", "sku", "barcode"],
  },
  "stock-movements": {
    model: "stockMovement",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: OPERATOR_ROLES,
    orderBy: { createdAt: "desc" },
  },
  jobs: {
    model: "job",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: OPERATOR_ROLES,
    searchFields: ["title", "issueCategory", "description"],
    include: {
      customer: true,
      property: true,
      technician: true,
      van: true,
    },
  },
  "job-materials": {
    model: "jobMaterial",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: OPERATOR_ROLES,
  },
  estimates: {
    model: "estimate",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: OPERATOR_ROLES,
    searchFields: ["number", "notes"],
  },
  invoices: {
    model: "invoice",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: OPERATOR_ROLES,
    searchFields: ["number", "notes"],
  },
  "subscription-plans": {
    model: "subscriptionPlan",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: ADMIN_ROLES,
    searchFields: ["name", "notes"],
  },
  subscriptions: {
    model: "subscription",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: OPERATOR_ROLES,
    searchFields: ["notes"],
  },
  "chat-threads": {
    model: "chatThread",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: ALL_APP_ROLES,
    searchFields: ["subject"],
    orderBy: { updatedAt: "desc" },
  },
  notifications: {
    model: "notification",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: OPERATOR_ROLES,
    orderBy: { createdAt: "desc" },
  },
  expenses: {
    model: "expense",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: OPERATOR_ROLES,
    searchFields: ["category", "description"],
  },
  receipts: {
    model: "receipt",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: OPERATOR_ROLES,
  },
  "ledger-entries": {
    model: "ledgerEntry",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: OPERATOR_ROLES,
    orderBy: { occurredAt: "desc" },
  },
  "vat-periods": {
    model: "vatPeriod",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: OPERATOR_ROLES,
    orderBy: { startDate: "desc" },
  },
  "analytics-snapshots": {
    model: "analyticsSnapshot",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: OPERATOR_ROLES,
  },
  "ai-interactions": {
    model: "aiInteraction",
    tenantScoped: true,
    readRoles: OPERATOR_ROLES,
    writeRoles: ALL_APP_ROLES,
  },
  attachments: {
    model: "attachment",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: ALL_APP_ROLES,
  },
  branding: {
    model: "contractorBranding",
    tenantScoped: true,
    readRoles: ALL_APP_ROLES,
    writeRoles: ADMIN_ROLES,
  },
};

export function getResourceConfig(resource: string) {
  return RESOURCE_CONFIG[resource];
}
