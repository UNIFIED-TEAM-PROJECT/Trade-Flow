import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  InvoiceStatus,
  JobStatus,
  JobUrgency,
  LineItemType,
  MembershipRole,
  PlatformRole,
  PrismaClient,
  StockMovementType,
  SubscriptionStatus,
  VanStatus,
  VatPeriodStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD = "password123";

function money(value: number) {
  return value.toFixed(2);
}

async function clearDatabase() {
  await prisma.passwordResetToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.aiInteraction.deleteMany();
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.vatPeriod.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.mockPayment.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.estimateLineItem.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.jobMaterial.deleteMany();
  await prisma.jobStatusHistory.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.job.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.rack.deleteMany();
  await prisma.vanLocation.deleteMany();
  await prisma.van.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.property.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.contractorBranding.deleteMany();
  await prisma.membershipInvite.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organisation.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clearDatabase();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@tradesflow.co.uk",
      passwordHash,
      firstName: "Platform",
      lastName: "Admin",
      platformRole: PlatformRole.SUPER_ADMIN,
    },
  });

  const org = await prisma.organisation.create({
    data: {
      name: "Carlisle Plumbing & Heating Ltd",
      slug: "carlisle-plumbing",
      timezone: "Europe/London",
      onboardingComplete: true,
    },
  });

  const secondOrg = await prisma.organisation.create({
    data: {
      name: "NorthWest Electrical Services",
      slug: "northwest-electrical",
      timezone: "Europe/London",
      onboardingComplete: true,
    },
  });

  await prisma.contractorBranding.createMany({
    data: [
      {
        organisationId: org.id,
        companyName: "Carlisle Plumbing & Heating Ltd",
        logoPath: "/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-dark.svg",
        primaryColor: "#0A1A33",
        accentColor: "#0EA5E9",
        supportPhone: "+44 1228 900123",
        supportEmail: "help@carlisleplumbing.demo",
        website: "https://carlisleplumbing.demo",
        invoiceHeader: "Thank you for choosing Carlisle Plumbing & Heating",
        invoiceFooter: "Payment terms: 14 days",
        customerAppName: "Carlisle HomeCare",
      },
      {
        organisationId: secondOrg.id,
        companyName: "NorthWest Electrical Services",
        logoPath: "/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-dark.svg",
        primaryColor: "#11284F",
        accentColor: "#F97316",
        supportPhone: "+44 151 800 1234",
        supportEmail: "ops@northwestelectrical.demo",
        website: "https://northwestelectrical.demo",
        invoiceHeader: "Professional electrical maintenance and installs",
        invoiceFooter: "Thank you for your business",
      },
    ],
  });

  const owner = await prisma.user.create({
    data: {
      email: "owner@demo.tradesflow",
      passwordHash,
      firstName: "Alicia",
      lastName: "Owner",
    },
  });
  const manager = await prisma.user.create({
    data: {
      email: "manager@demo.tradesflow",
      passwordHash,
      firstName: "Mark",
      lastName: "Dispatcher",
    },
  });
  const techUsers = await Promise.all(
    [
      ["tech1@demo.tradesflow", "Mason", "Reid"],
      ["tech2@demo.tradesflow", "Nina", "Hall"],
      ["tech3@demo.tradesflow", "Jordan", "Price"],
    ].map(([email, firstName, lastName]) =>
      prisma.user.create({
        data: { email, passwordHash, firstName, lastName },
      }),
    ),
  );
  const customerAppUser = await prisma.user.create({
    data: {
      email: "customer1@demo.tradesflow",
      passwordHash,
      firstName: "Laura",
      lastName: "Bennett",
    },
  });
  const secondOrgOwner = await prisma.user.create({
    data: {
      email: "owner@northwest.demo",
      passwordHash,
      firstName: "Elliot",
      lastName: "Grant",
    },
  });

  await prisma.membership.createMany({
    data: [
      { organisationId: org.id, userId: owner.id, role: MembershipRole.OWNER, isPrimary: true },
      { organisationId: org.id, userId: manager.id, role: MembershipRole.MANAGER, isPrimary: true },
      { organisationId: org.id, userId: techUsers[0].id, role: MembershipRole.TECHNICIAN, isPrimary: true },
      { organisationId: org.id, userId: techUsers[1].id, role: MembershipRole.TECHNICIAN, isPrimary: true },
      { organisationId: org.id, userId: techUsers[2].id, role: MembershipRole.TECHNICIAN, isPrimary: true },
      { organisationId: org.id, userId: customerAppUser.id, role: MembershipRole.CUSTOMER, isPrimary: true },
      { organisationId: secondOrg.id, userId: secondOrgOwner.id, role: MembershipRole.OWNER, isPrimary: true },
    ],
  });

  const technicians = await Promise.all(
    techUsers.map((user, idx) =>
      prisma.technician.create({
        data: {
          organisationId: org.id,
          userId: user.id,
          displayName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: `+44 7700 9000${idx + 1}`,
          baseLocation: "Carlisle Depot",
          skills: {
            categories: idx === 0 ? ["Boiler"] : idx === 1 ? ["Leak repair"] : ["Heating"],
          },
        },
      }),
    ),
  );

  const vans = await Promise.all(
    [
      ["TF-01", "YK23 PLM", technicians[0].id],
      ["TF-02", "YK23 HEA", technicians[1].id],
      ["TF-03", "YK23 GAS", technicians[2].id],
    ].map(([identifier, registration, assignedTechnicianId], idx) =>
      prisma.van.create({
        data: {
          organisationId: org.id,
          name: `Service Van ${idx + 1}`,
          identifier,
          registration,
          status: VanStatus.ACTIVE,
          depotLocation: "Carlisle Depot",
          currentLocationLabel: idx === 0 ? "Carlisle City Centre" : "North Carlisle",
          latitude: 54.8925 + idx * 0.01,
          longitude: -2.9329 + idx * 0.01,
          assignedTechnicianId,
        },
      }),
    ),
  );

  await prisma.vanLocation.createMany({
    data: vans.flatMap((van, idx) => [
      {
        organisationId: org.id,
        vanId: van.id,
        latitude: 54.8925 + idx * 0.008,
        longitude: -2.9329 + idx * 0.008,
        label: "Morning dispatch",
      },
      {
        organisationId: org.id,
        vanId: van.id,
        latitude: 54.89 + idx * 0.01,
        longitude: -2.92 + idx * 0.01,
        label: "Midday callout",
      },
    ]),
  });

  const racks = await Promise.all(
    vans.flatMap((van) =>
      ["Rack A", "Rack B", "Rack C"].map((label) =>
        prisma.rack.create({
          data: {
            organisationId: org.id,
            vanId: van.id,
            label,
          },
        }),
      ),
    ),
  );

  const slots = await Promise.all(
    racks.flatMap((rack) =>
      ["1", "2", "3", "4"].map((slotNum) =>
        prisma.slot.create({
          data: {
            organisationId: org.id,
            rackId: rack.id,
            label: `${rack.label.replace("Rack ", "")}${slotNum}`,
            category: rack.label === "Rack A" ? "Fittings" : rack.label === "Rack B" ? "Tools" : "Safety",
          },
        }),
      ),
    ),
  );

  const suppliers = await Promise.all(
    ["BES Trade Supplies", "PipeFit Wholesale", "Northern Heating Depot"].map((name, idx) =>
      prisma.supplier.create({
        data: {
          organisationId: org.id,
          name,
          email: `sales${idx + 1}@supplier.demo`,
          phone: `+44 1228 6000${idx + 1}`,
        },
      }),
    ),
  );

  const inventorySeed = [
    "Copper Elbow 15mm",
    "Copper Elbow 22mm",
    "Push-Fit Tee 15mm",
    "Push-Fit Coupler 22mm",
    "PTFE Tape",
    "Boiler Pressure Valve",
    "Radiator Valve Pair",
    "TRV Head",
    "Compression Nut Set",
    "Shower Cartridge",
    "Flexible Hose 300mm",
    "Flexible Hose 500mm",
    "Drain Unblock Gel",
    "Pipe Insulation 1m",
    "Silicone Sealant",
    "Thread Seal Compound",
    "Gas Detector Battery",
    "CO Alarm Unit",
    "Smoke Alarm Unit",
    "Circuit Breaker 16A",
    "Circuit Breaker 32A",
    "PVC Waste Bend",
    "PVC Waste Tee",
    "Toilet Fill Valve",
    "Ballcock Arm",
    "Tap Cartridge Standard",
    "Tap Cartridge Ceramic",
    "Radiator Bleed Key",
    "Isolation Valve 15mm",
    "Isolation Valve 22mm",
    "Pipe Clips Pack",
    "Copper Tube 2m",
    "Flux Paste",
    "Solder Wire",
  ];

  const inventoryItems = await Promise.all(
    inventorySeed.map((name, idx) => {
      const slot = slots[idx % slots.length];
      const rack = racks.find((r) => r.id === slot.rackId)!;
      const van = vans.find((v) => v.id === rack.vanId)!;
      const supplier = suppliers[idx % suppliers.length];
      const sku = `TF-${String(idx + 1).padStart(4, "0")}`;
      return prisma.inventoryItem.create({
        data: {
          organisationId: org.id,
          vanId: van.id,
          rackId: rack.id,
          slotId: slot.id,
          supplierId: supplier.id,
          name,
          category: slot.category ?? "General",
          sku,
          quantity: 4 + (idx % 8),
          unit: "pcs",
          costPrice: money(2.5 + (idx % 5) * 1.2),
          reorderLevel: 3,
          barcode: `BAR-${sku}`,
          qrCode: `QR-${sku}`,
        },
      });
    }),
  );

  const customers = await Promise.all(
    Array.from({ length: 22 }).map((_, idx) =>
      prisma.customer.create({
        data: {
          organisationId: org.id,
          userId: idx === 0 ? customerAppUser.id : undefined,
          displayName: idx === 0 ? "Laura Bennett" : `Customer ${idx + 1}`,
          email: idx === 0 ? "customer1@demo.tradesflow" : `customer${idx + 1}@demo.tradesflow`,
          phone: `+44 7400 123${String(idx).padStart(2, "0")}`,
          isSubscriber: idx < 7,
          notes: idx % 2 === 0 ? "Preferred morning appointments." : "Has pets at property.",
        },
      }),
    ),
  );

  const properties = await Promise.all(
    customers.flatMap((customer, idx) => [
      prisma.property.create({
        data: {
          organisationId: org.id,
          customerId: customer.id,
          label: "Primary Property",
          addressLine1: `${idx + 10} Victoria Street`,
          city: "Carlisle",
          postcode: `CA1 ${100 + idx}`,
          notes: idx % 3 === 0 ? "Combi boiler installed 2020." : null,
          installedEquipment: { boiler: idx % 2 === 0 ? "Vaillant EcoTec" : "Worcester Greenstar" },
          warrantyNotes: idx % 4 === 0 ? "Boiler warranty active until 2028" : null,
          complianceDocs: { gasSafe: idx % 5 === 0 ? "Pending upload" : "Verified" },
        },
      }),
    ]),
  );

  const statusOrder: JobStatus[] = [
    JobStatus.LEAD,
    JobStatus.ESTIMATE_DRAFTED,
    JobStatus.ESTIMATE_SENT,
    JobStatus.ESTIMATE_APPROVED,
    JobStatus.SCHEDULED,
    JobStatus.TECHNICIAN_ASSIGNED,
    JobStatus.IN_PROGRESS,
    JobStatus.AWAITING_MATERIALS,
    JobStatus.COMPLETED,
    JobStatus.INVOICE_SENT,
    JobStatus.PAYMENT_PENDING,
    JobStatus.PAID,
    JobStatus.WARRANTY_FOLLOW_UP,
    JobStatus.CANCELLED,
  ];

  const jobs = await Promise.all(
    Array.from({ length: 24 }).map((_, idx) => {
      const customer = customers[idx % customers.length];
      const property = properties[idx % properties.length];
      const technician = technicians[idx % technicians.length];
      const van = vans[idx % vans.length];
      const status = statusOrder[idx % statusOrder.length];
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() - 5 + idx);
      const urgency =
        idx % 9 === 0 ? JobUrgency.EMERGENCY : idx % 4 === 0 ? JobUrgency.HIGH : JobUrgency.MEDIUM;
      const slaTargetAt = customer.isSubscriber ? new Date(scheduledAt.getTime() + 4 * 3600 * 1000) : null;

      return prisma.job.create({
        data: {
          organisationId: org.id,
          customerId: customer.id,
          propertyId: property.id,
          technicianId: idx % 5 === 0 ? null : technician.id,
          vanId: idx % 5 === 0 ? null : van.id,
          title: `Job ${idx + 1} - ${idx % 2 === 0 ? "Boiler service" : "Leak repair"}`,
          issueCategory: idx % 2 === 0 ? "Heating" : "Plumbing",
          description:
            idx % 2 === 0
              ? "Customer reports pressure drop and intermittent heating."
              : "Kitchen sink leak with suspected worn valve.",
          urgency,
          status,
          isEmergency: urgency === JobUrgency.EMERGENCY,
          source: idx % 3 === 0 ? "CUSTOMER_APP" : "OFFICE",
          scheduledAt,
          startedAt:
            status === JobStatus.IN_PROGRESS || status === JobStatus.COMPLETED || status === JobStatus.PAID
              ? new Date(scheduledAt.getTime() + 30 * 60000)
              : null,
          completedAt:
            status === JobStatus.COMPLETED || status === JobStatus.INVOICE_SENT || status === JobStatus.PAID
              ? new Date(scheduledAt.getTime() + 150 * 60000)
              : null,
          slaTargetAt,
          estimatedDurationMinutes: 120,
          labourMinutes: status === JobStatus.COMPLETED || status === JobStatus.PAID ? 135 : 0,
          notes: idx % 2 === 0 ? "Customer requests same technician if possible." : null,
          aiSummary: "Issue triaged as medium complexity. Suggested parts: valve set, PTFE, couplers.",
        },
      });
    }),
  );

  await prisma.jobStatusHistory.createMany({
    data: jobs.flatMap((job) => [
      {
        jobId: job.id,
        fromStatus: null,
        toStatus: JobStatus.LEAD,
        changedById: manager.id,
        note: "Lead created from customer request.",
      },
      {
        jobId: job.id,
        fromStatus: JobStatus.LEAD,
        toStatus: job.status,
        changedById: manager.id,
        note: "Workflow updated by dispatcher.",
      },
    ]),
  });

  await prisma.jobMaterial.createMany({
    data: jobs.slice(0, 18).map((job, idx) => {
      const item = inventoryItems[idx % inventoryItems.length];
      const quantity = 1 + (idx % 3);
      const unitPrice = Number(item.costPrice) * 1.7;
      return {
        organisationId: org.id,
        jobId: job.id,
        inventoryItemId: item.id,
        description: item.name,
        quantity: money(quantity),
        unit: item.unit,
        unitPrice: money(unitPrice),
        vatRate: "20.00",
        total: money(quantity * unitPrice),
      };
    }),
  });

  await prisma.stockMovement.createMany({
    data: jobs.slice(0, 20).map((job, idx) => {
      const item = inventoryItems[idx % inventoryItems.length];
      return {
        organisationId: org.id,
        inventoryItemId: item.id,
        jobId: job.id,
        fromSlotId: item.slotId,
        performedById: techUsers[idx % techUsers.length].id,
        type: StockMovementType.OUT,
        quantity: 1,
        codeUsed: item.barcode,
        note: "Used on active job",
      };
    }),
  });

  const estimates = await Promise.all(
    jobs.slice(0, 12).map(async (job, idx) => {
      const subtotal = 120 + idx * 35;
      const vat = subtotal * 0.2;
      return prisma.estimate.create({
        data: {
          organisationId: org.id,
          jobId: job.id,
          customerId: job.customerId,
          propertyId: job.propertyId,
          number: `EST-2026-${String(idx + 1).padStart(4, "0")}`,
          status: idx % 4 === 0 ? "APPROVED" : idx % 3 === 0 ? "SENT" : "DRAFT",
          validUntil: new Date(Date.now() + 14 * 24 * 3600 * 1000),
          subtotal: money(subtotal),
          vatTotal: money(vat),
          total: money(subtotal + vat),
          notes: "Estimate includes labour and parts based on site history.",
          createdById: manager.id,
          sentAt: idx % 2 === 0 ? new Date() : null,
        },
      });
    }),
  );

  await prisma.estimateLineItem.createMany({
    data: estimates.flatMap((estimate, idx) => [
      {
        estimateId: estimate.id,
        type: LineItemType.LABOUR,
        description: "Technician labour",
        quantity: "2.00",
        unitPrice: money(65 + idx),
        vatRate: "20.00",
        total: money((65 + idx) * 2),
      },
      {
        estimateId: estimate.id,
        type: LineItemType.MATERIAL,
        description: "Parts and consumables",
        quantity: "1.00",
        unitPrice: money(40 + idx * 5),
        vatRate: "20.00",
        total: money(40 + idx * 5),
      },
    ]),
  });

  const invoices = await Promise.all(
    jobs.slice(8, 20).map(async (job, idx) => {
      const subtotal = 180 + idx * 42;
      const vat = subtotal * 0.2;
      const status =
        idx % 5 === 0 ? InvoiceStatus.PAID : idx % 4 === 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.SENT;
      return prisma.invoice.create({
        data: {
          organisationId: org.id,
          jobId: job.id,
          customerId: job.customerId,
          propertyId: job.propertyId,
          number: `INV-2026-${String(idx + 1).padStart(4, "0")}`,
          status,
          issuedAt: new Date(Date.now() - idx * 3 * 24 * 3600 * 1000),
          dueAt: new Date(Date.now() + (14 - idx) * 24 * 3600 * 1000),
          paidAt: status === InvoiceStatus.PAID ? new Date() : null,
          subtotal: money(subtotal),
          vatTotal: money(vat),
          total: money(subtotal + vat),
          notes: "Payment methods: bank transfer, card on file (mock).",
          createdById: manager.id,
        },
      });
    }),
  );

  await prisma.invoiceLineItem.createMany({
    data: invoices.flatMap((invoice, idx) => [
      {
        invoiceId: invoice.id,
        type: LineItemType.LABOUR,
        description: "On-site labour",
        quantity: "2.00",
        unitPrice: money(75 + idx),
        vatRate: "20.00",
        total: money((75 + idx) * 2),
      },
      {
        invoiceId: invoice.id,
        type: LineItemType.MATERIAL,
        description: "Materials used",
        quantity: "1.00",
        unitPrice: money(55 + idx * 4),
        vatRate: "20.00",
        total: money(55 + idx * 4),
      },
    ]),
  });

  await prisma.mockPayment.createMany({
    data: invoices
      .filter((invoice) => invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.PARTIAL)
      .map((invoice, idx) => ({
        invoiceId: invoice.id,
        amount: invoice.status === InvoiceStatus.PARTIAL ? money(Number(invoice.total) / 2) : invoice.total,
        method: idx % 2 === 0 ? "BANK_TRANSFER" : "CARD",
        reference: `PMT-${idx + 1001}`,
      })),
  });

  await prisma.ledgerEntry.createMany({
    data: invoices.map((invoice) => ({
      organisationId: org.id,
      invoiceId: invoice.id,
      entryType: "INCOME",
      amount: invoice.total,
      vatAmount: invoice.vatTotal,
      occurredAt: invoice.issuedAt,
      accountCode: "4000",
      description: `Invoice ${invoice.number}`,
    })),
  });

  const plans = await Promise.all(
    [
      {
        organisationId: org.id,
        name: "HomeGuard Annual",
        yearlyPrice: "249.00",
        monthlyPrice: null,
        responseSlaHours: 8,
        annualGasCheckIncluded: true,
        discountedLabourPct: "15.00",
        noCalloutFee: true,
        priorityBooking: true,
      },
      {
        organisationId: org.id,
        name: "HomeGuard Monthly",
        monthlyPrice: "24.99",
        yearlyPrice: null,
        responseSlaHours: 12,
        annualGasCheckIncluded: false,
        discountedLabourPct: "10.00",
        noCalloutFee: true,
        priorityBooking: true,
      },
      {
        organisationId: org.id,
        name: "Premium Response Plan",
        monthlyPrice: "39.00",
        yearlyPrice: "399.00",
        responseSlaHours: 4,
        annualGasCheckIncluded: true,
        discountedLabourPct: "20.00",
        noCalloutFee: true,
        priorityBooking: true,
      },
    ].map((data) => prisma.subscriptionPlan.create({ data })),
  );

  await prisma.subscription.createMany({
    data: customers.slice(0, 7).map((customer, idx) => ({
      organisationId: org.id,
      customerId: customer.id,
      planId: plans[idx % plans.length].id,
      status: idx < 5 ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL,
      startDate: new Date(Date.now() - idx * 24 * 3600 * 1000),
      renewalDate: new Date(Date.now() + (30 - idx) * 24 * 3600 * 1000),
      notes: idx % 2 === 0 ? "Priority homeowner support." : "Monitoring first month usage.",
    })),
  });

  const threads = await Promise.all(
    jobs.slice(0, 12).map((job, idx) =>
      prisma.chatThread.create({
        data: {
          organisationId: org.id,
          customerId: job.customerId,
          jobId: job.id,
          subject: `Job ${idx + 1} communications`,
          createdById: manager.id,
        },
      }),
    ),
  );

  for (let idx = 0; idx < threads.length; idx += 1) {
    const thread = threads[idx];
    const job = jobs[idx];
    const customer = customers.find((c) => c.id === job.customerId)!;
    const techUser = techUsers[idx % techUsers.length];

    await prisma.chatParticipant.createMany({
      data: [
        { threadId: thread.id, userId: manager.id, role: MembershipRole.MANAGER },
        { threadId: thread.id, userId: techUser.id, role: MembershipRole.TECHNICIAN },
        ...(customer.userId ? [{ threadId: thread.id, userId: customer.userId, role: MembershipRole.CUSTOMER }] : []),
      ],
    });

    await prisma.chatMessage.createMany({
      data: [
        {
          organisationId: org.id,
          threadId: thread.id,
          senderId: manager.id,
          body: "Your appointment is confirmed. Technician ETA 09:00 - 11:00.",
        },
        {
          organisationId: org.id,
          threadId: thread.id,
          senderId: techUser.id,
          body: "On my way now, traffic light. Bringing replacement valve.",
        },
        {
          organisationId: org.id,
          threadId: thread.id,
          senderId: null,
          body: "System: SLA timer started for subscriber priority job.",
          type: "SYSTEM",
        },
      ],
    });
  }

  const expenses = await Promise.all(
    Array.from({ length: 12 }).map((_, idx) =>
      prisma.expense.create({
        data: {
          organisationId: org.id,
          supplierId: suppliers[idx % suppliers.length].id,
          createdById: manager.id,
          category: idx % 3 === 0 ? "Fuel" : idx % 3 === 1 ? "Parts Procurement" : "Tools",
          description: idx % 2 === 0 ? "Van fuel and tolls" : "Bulk parts purchase",
          amount: money(40 + idx * 12),
          vatAmount: money((40 + idx * 12) * 0.2),
          occurredAt: new Date(Date.now() - idx * 2 * 24 * 3600 * 1000),
        },
      }),
    ),
  );

  await prisma.receipt.createMany({
    data: expenses.map((expense, idx) => ({
      organisationId: org.id,
      expenseId: expense.id,
      fileName: `receipt-${idx + 1}.jpg`,
      filePath: `/uploads/receipts/receipt-${idx + 1}.jpg`,
      mimeType: "image/jpeg",
      sizeBytes: 123_456,
      uploadedById: manager.id,
    })),
  });

  await prisma.ledgerEntry.createMany({
    data: expenses.map((expense) => ({
      organisationId: org.id,
      expenseId: expense.id,
      entryType: "EXPENSE",
      amount: expense.amount,
      vatAmount: expense.vatAmount,
      occurredAt: expense.occurredAt,
      accountCode: "5000",
      description: `Expense ${expense.category}`,
    })),
  });

  await prisma.vatPeriod.createMany({
    data: [
      {
        organisationId: org.id,
        quarterLabel: "Q1 2026",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-03-31"),
        salesVat: "1820.40",
        purchaseVat: "640.20",
        netVat: "1180.20",
        status: VatPeriodStatus.EXPORTED,
      },
      {
        organisationId: org.id,
        quarterLabel: "Q2 2026",
        startDate: new Date("2026-04-01"),
        endDate: new Date("2026-06-30"),
        salesVat: "0.00",
        purchaseVat: "0.00",
        netVat: "0.00",
        status: VatPeriodStatus.OPEN,
      },
    ],
  });

  const analyticsMetrics = [
    "revenue_daily",
    "jobs_by_status",
    "inventory_usage",
    "subscriptions_active",
    "sla_compliance",
    "outstanding_invoices",
    "estimate_conversion_rate",
  ];

  await prisma.analyticsSnapshot.createMany({
    data: Array.from({ length: 35 }).map((_, idx) => ({
      organisationId: org.id,
      metric: analyticsMetrics[idx % analyticsMetrics.length],
      dimension: idx % 2 === 0 ? "overall" : `bucket_${idx % 5}`,
      value: money(50 + idx * 15),
      capturedAt: new Date(Date.now() - idx * 12 * 3600 * 1000),
    })),
  });

  await prisma.aiInteraction.createMany({
    data: jobs.slice(0, 14).map((job, idx) => ({
      organisationId: org.id,
      userId: manager.id,
      jobId: job.id,
      workflow: idx % 2 === 0 ? "triage" : "summary",
      inputText: "Customer says boiler pressure drops overnight and radiators are cold upstairs.",
      outputText:
        "Classified as Heating / Medium urgency. Recommend checking expansion vessel and bleeding radiators.",
    })),
  });

  await prisma.notification.createMany({
    data: [
      {
        organisationId: org.id,
        userId: manager.id,
        type: "ALERT",
        title: "Low stock warning",
        message: "4 inventory items are below reorder level.",
        link: "/app/inventory",
      },
      {
        organisationId: org.id,
        userId: owner.id,
        type: "JOB",
        title: "Emergency callout received",
        message: "Subscriber emergency job requires scheduling in under 4h.",
        link: "/app/jobs",
      },
      {
        organisationId: org.id,
        userId: techUsers[0].id,
        type: "CHAT",
        title: "New message from customer",
        message: "Thread update on Job 3.",
        link: "/technician?tab=chat",
      },
    ],
  });

  await prisma.attachment.createMany({
    data: [
      {
        organisationId: org.id,
        uploadedById: manager.id,
        entityType: "BRANDING",
        entityId: org.id,
        fileName: "company-logo.svg",
        filePath: "/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-dark.svg",
      },
      {
        organisationId: org.id,
        uploadedById: techUsers[0].id,
        entityType: "JOB",
        entityId: jobs[0].id,
        fileName: "before-photo.jpg",
        filePath: "/uploads/jobs/before-photo.jpg",
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        organisationId: org.id,
        userId: owner.id,
        action: "CREATE_SUBSCRIPTION_PLAN",
        entityType: "SubscriptionPlan",
        details: { plan: "Premium Response Plan" },
      },
      {
        organisationId: org.id,
        userId: manager.id,
        action: "ASSIGN_JOB",
        entityType: "Job",
        entityId: jobs[0].id,
        details: { technician: technicians[0].displayName, van: vans[0].identifier },
      },
      {
        organisationId: org.id,
        userId: superAdmin.id,
        action: "VIEW_ORGANISATION",
        entityType: "Organisation",
        entityId: org.id,
      },
    ],
  });

  const secondOrgCustomerUser = await prisma.user.create({
    data: {
      email: "customer@northwest.demo",
      passwordHash,
      firstName: "Nora",
      lastName: "Tenant",
    },
  });

  await prisma.membership.create({
    data: {
      organisationId: secondOrg.id,
      userId: secondOrgCustomerUser.id,
      role: MembershipRole.CUSTOMER,
      isPrimary: true,
    },
  });

  const secondOrgCustomer = await prisma.customer.create({
    data: {
      organisationId: secondOrg.id,
      userId: secondOrgCustomerUser.id,
      displayName: "Nora Tenant",
      email: "customer@northwest.demo",
      phone: "+44 7700 111222",
    },
  });

  const secondOrgProperty = await prisma.property.create({
    data: {
      organisationId: secondOrg.id,
      customerId: secondOrgCustomer.id,
      addressLine1: "10 Lime Court",
      city: "Liverpool",
      postcode: "L1 4AB",
      notes: "Electrical safety inspection due annually.",
    },
  });

  await prisma.job.create({
    data: {
      organisationId: secondOrg.id,
      customerId: secondOrgCustomer.id,
      propertyId: secondOrgProperty.id,
      title: "Consumer unit check",
      issueCategory: "Electrical",
      description: "Intermittent trip in kitchen circuit.",
      urgency: JobUrgency.MEDIUM,
      status: JobStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    },
  });

  console.log("Seed complete.");
  console.log(`Demo password for all users: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
