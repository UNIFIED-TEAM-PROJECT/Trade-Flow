-- CreateEnum
CREATE TYPE "JobRequestStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'MORE_INFO_REQUESTED', 'ESTIMATE_REQUIRED', 'READY_TO_SCHEDULE', 'EMERGENCY_DISPATCHED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "SupplyMethod" AS ENUM ('CONTRACTOR_SUPPLY', 'CUSTOMER_SUPPLY', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "SlaState" AS ENUM ('SAFE', 'AT_RISK', 'CRITICAL', 'BREACHED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'FAULTY', 'REPLACED', 'REMOVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttachmentEntityType" ADD VALUE 'JOB_REQUEST';
ALTER TYPE "AttachmentEntityType" ADD VALUE 'PRODUCT';
ALTER TYPE "AttachmentEntityType" ADD VALUE 'ASSET';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'INCOMING_REQUEST';
ALTER TYPE "JobStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "JobStatus" ADD VALUE 'VAN_ASSIGNED';
ALTER TYPE "JobStatus" ADD VALUE 'REJECTED';
ALTER TYPE "JobStatus" ADD VALUE 'AWAITING_CUSTOMER_RESPONSE';

-- DropIndex
DROP INDEX "public"."InventoryItem_organisationId_sku_key";

-- AlterTable
ALTER TABLE "EstimateLineItem" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "depotId" TEXT;

-- AlterTable
ALTER TABLE "InvoiceLineItem" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "slaState" "SlaState" NOT NULL DEFAULT 'SAFE',
ADD COLUMN     "supplyMethod" "SupplyMethod" NOT NULL DEFAULT 'CONTRACTOR_SUPPLY';

-- AlterTable
ALTER TABLE "JobMaterial" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "fromDepotId" TEXT,
ADD COLUMN     "toDepotId" TEXT;

-- AlterTable
ALTER TABLE "Van" ADD COLUMN     "depotId" TEXT;

-- CreateTable
CREATE TABLE "Depot" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRequest" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "linkedJobId" TEXT,
    "title" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" "JobUrgency" NOT NULL DEFAULT 'MEDIUM',
    "status" "JobRequestStatus" NOT NULL DEFAULT 'NEW',
    "supplyMethod" "SupplyMethod" NOT NULL DEFAULT 'CONTRACTOR_SUPPLY',
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "subscriberPriority" BOOLEAN NOT NULL DEFAULT false,
    "aiSummary" TEXT,
    "aiConfidence" DECIMAL(5,2),
    "suggestedUrgency" "JobUrgency",
    "suggestedServiceType" TEXT,
    "suggestedMaterials" JSONB,
    "slaTargetAt" TIMESTAMP(3),
    "slaState" "SlaState" NOT NULL DEFAULT 'SAFE',
    "reviewNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRequestProduct" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRequestProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "finishColor" TEXT,
    "dimensions" TEXT,
    "specsJson" JSONB,
    "imagePath" TEXT,
    "sourceCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "contractorSellPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSource" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplierName" TEXT NOT NULL,
    "supplierSku" TEXT,
    "supplierUrl" TEXT,
    "supplierCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "availability" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "sourceType" TEXT NOT NULL DEFAULT 'SEED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMarkupRule" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "categoryId" TEXT,
    "productId" TEXT,
    "ruleName" TEXT NOT NULL,
    "markupPct" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "minimumMarginPct" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "roundingRule" TEXT NOT NULL DEFAULT 'NEAREST_POUND',
    "labourBundlePct" DECIMAL(6,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMarkupRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyAsset" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT,
    "installedJobId" TEXT,
    "estimateId" TEXT,
    "invoiceId" TEXT,
    "installedByTechnicianId" TEXT,
    "assetType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "supplierName" TEXT,
    "supplierSku" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "finishColor" TEXT,
    "sourceCost" DECIMAL(12,2),
    "sellPrice" DECIMAL(12,2),
    "installationDate" TIMESTAMP(3),
    "floor" TEXT,
    "room" TEXT,
    "zone" TEXT,
    "serialNumber" TEXT,
    "warrantyStart" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "expectedReplacementMonths" INTEGER,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDocument" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetPhoto" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetStatusHistory" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "fromStatus" "AssetStatus",
    "toStatus" "AssetStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Depot_organisationId_code_key" ON "Depot"("organisationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "JobRequest_linkedJobId_key" ON "JobRequest"("linkedJobId");

-- CreateIndex
CREATE INDEX "JobRequest_organisationId_status_requestedAt_idx" ON "JobRequest"("organisationId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "JobRequestProduct_organisationId_requestId_idx" ON "JobRequestProduct"("organisationId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_organisationId_slug_key" ON "ProductCategory"("organisationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organisationId_slug_key" ON "Product"("organisationId", "slug");

-- CreateIndex
CREATE INDEX "CompanyMarkupRule_organisationId_isActive_idx" ON "CompanyMarkupRule"("organisationId", "isActive");

-- CreateIndex
CREATE INDEX "PropertyAsset_organisationId_propertyId_idx" ON "PropertyAsset"("organisationId", "propertyId");

-- CreateIndex
CREATE INDEX "AssetStatusHistory_organisationId_createdAt_idx" ON "AssetStatusHistory"("organisationId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryItem_organisationId_sku_idx" ON "InventoryItem"("organisationId", "sku");

-- CreateIndex
CREATE INDEX "StockMovement_organisationId_createdAt_idx" ON "StockMovement"("organisationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Van" ADD CONSTRAINT "Van_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depot" ADD CONSTRAINT "Depot_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_fromDepotId_fkey" FOREIGN KEY ("fromDepotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_toDepotId_fkey" FOREIGN KEY ("toDepotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_linkedJobId_fkey" FOREIGN KEY ("linkedJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequestProduct" ADD CONSTRAINT "JobRequestProduct_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequestProduct" ADD CONSTRAINT "JobRequestProduct_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "JobRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequestProduct" ADD CONSTRAINT "JobRequestProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMaterial" ADD CONSTRAINT "JobMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateLineItem" ADD CONSTRAINT "EstimateLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSource" ADD CONSTRAINT "ProductSource_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSource" ADD CONSTRAINT "ProductSource_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSource" ADD CONSTRAINT "ProductSource_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMarkupRule" ADD CONSTRAINT "CompanyMarkupRule_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMarkupRule" ADD CONSTRAINT "CompanyMarkupRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMarkupRule" ADD CONSTRAINT "CompanyMarkupRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAsset" ADD CONSTRAINT "PropertyAsset_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAsset" ADD CONSTRAINT "PropertyAsset_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAsset" ADD CONSTRAINT "PropertyAsset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAsset" ADD CONSTRAINT "PropertyAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAsset" ADD CONSTRAINT "PropertyAsset_installedJobId_fkey" FOREIGN KEY ("installedJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAsset" ADD CONSTRAINT "PropertyAsset_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAsset" ADD CONSTRAINT "PropertyAsset_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAsset" ADD CONSTRAINT "PropertyAsset_installedByTechnicianId_fkey" FOREIGN KEY ("installedByTechnicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDocument" ADD CONSTRAINT "AssetDocument_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDocument" ADD CONSTRAINT "AssetDocument_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PropertyAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDocument" ADD CONSTRAINT "AssetDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPhoto" ADD CONSTRAINT "AssetPhoto_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPhoto" ADD CONSTRAINT "AssetPhoto_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PropertyAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPhoto" ADD CONSTRAINT "AssetPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetStatusHistory" ADD CONSTRAINT "AssetStatusHistory_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetStatusHistory" ADD CONSTRAINT "AssetStatusHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PropertyAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetStatusHistory" ADD CONSTRAINT "AssetStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
