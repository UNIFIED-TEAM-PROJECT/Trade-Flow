import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  AssetStatus,
  EstimateStatus,
  InvoiceStatus,
  JobRequestStatus,
  JobStatus,
  JobUrgency,
  LineItemType,
  MembershipRole,
  PlatformRole,
  PrismaClient,
  SlaState,
  StockMovementType,
  SubscriptionStatus,
  SupplyMethod,
  VanStatus,
  VatPeriodStatus,
} from "@prisma/client";

const prisma = new PrismaClient();
const PASSWORD = "password123";

const TOWNS = [
  { town: "Whitehaven", postcode: "CA28", latitude: 54.548, longitude: -3.586 },
  { town: "Workington", postcode: "CA14", latitude: 54.643, longitude: -3.544 },
  { town: "Cockermouth", postcode: "CA13", latitude: 54.662, longitude: -3.361 },
  { town: "Egremont", postcode: "CA22", latitude: 54.48, longitude: -3.527 },
  { town: "Cleator Moor", postcode: "CA25", latitude: 54.519, longitude: -3.504 },
  { town: "Maryport", postcode: "CA15", latitude: 54.713, longitude: -3.494 },
  { town: "Keswick", postcode: "CA12", latitude: 54.599, longitude: -3.132 },
  { town: "Carlisle", postcode: "CA1", latitude: 54.892, longitude: -2.933 },
  { town: "Penrith", postcode: "CA11", latitude: 54.664, longitude: -2.752 },
];

const PRODUCT_CATEGORIES = [
  "Radiators",
  "Sockets & Switches",
  "Front Doors",
  "Internal Doors",
  "Taps",
  "Showers",
  "Boilers",
  "Thermostats",
  "Towel Rails",
  "Extractor Fans",
  "Bathroom Furniture",
  "Pipework Accessories",
  "Lighting Accessories",
];

const INVENTORY_ITEMS = [
  "Copper elbows",
  "Compression fittings",
  "Isolation valves",
  "PTFE tape",
  "Solder wire",
  "Flux",
  "15mm copper pipe",
  "Waste pipe fittings",
  "Flexible tap connectors",
  "Radiator valves",
  "Pipe clips",
  "Boiler filling loop",
  "Stop ends",
  "Washers",
  "Jointing compound",
  "Toilet fill valve",
  "Ball valve",
  "Shower cartridge",
  "TRV head",
  "Drain unblock gel",
  "Socket faceplate",
  "Light switch 2 gang",
  "Extractor fan 100mm",
  "Tap cartridge ceramic",
  "Towel rail valve set",
  "Boiler pressure valve",
  "Push-fit tee",
  "Push-fit coupler",
  "CO alarm",
  "Smoke alarm",
  "Circuit breaker 16A",
  "Circuit breaker 32A",
  "Flexible hose 300mm",
  "Flexible hose 500mm",
  "Drain rod set",
  "Immersion heater element",
];

const JOB_TEMPLATES = [
  "Emergency burst pipe",
  "Leaking radiator valve",
  "Toilet replacement",
  "Kitchen sink blockage",
  "Boiler pressure issue",
  "Annual GasCheck",
  "Immersion heater fault",
  "Outside tap installation",
  "Shower pump replacement",
  "Annual service visit",
  "Landlord inspection",
  "Leak repair",
  "Blocked waste pipe",
  "Socket replacement",
  "Front door install",
  "Radiator replacement",
];

function money(value: number) {
  return value.toFixed(2);
}

function slug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function clearDatabase() {
  await prisma.passwordResetToken.deleteMany();
  await prisma.assetStatusHistory.deleteMany();
  await prisma.assetPhoto.deleteMany();
  await prisma.assetDocument.deleteMany();
  await prisma.propertyAsset.deleteMany();
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
  await prisma.jobRequestProduct.deleteMany();
  await prisma.jobRequest.deleteMany();
  await prisma.job.deleteMany();
  await prisma.companyMarkupRule.deleteMany();
  await prisma.productSource.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.rack.deleteMany();
  await prisma.vanLocation.deleteMany();
  await prisma.van.deleteMany();
  await prisma.depot.deleteMany();
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

async function seedPrimary(passwordHash: string) {
  const org = await prisma.organisation.create({
    data: {
      name: "Carlisle Plumbing & Heating Ltd",
      slug: "carlisle-plumbing-heating",
      timezone: "Europe/London",
      onboardingComplete: true,
    },
  });

  await prisma.contractorBranding.create({
    data: {
      organisationId: org.id,
      companyName: org.name,
      logoPath: "/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-light.svg",
      primaryColor: "#0B1F33",
      accentColor: "#2D7FF9",
      supportPhone: "+44 1228 901245",
      supportEmail: "support@carlisle-plumbing.demo",
      website: "https://tradesflow.co.uk",
      invoiceHeader: "Thank you for choosing Carlisle Plumbing & Heating Ltd",
      invoiceFooter: "Payment due in 14 days.",
      customerAppName: "Carlisle HomeCare",
    },
  });

  const owner = await prisma.user.create({
    data: { email: "owner@demo.tradesflow", passwordHash, firstName: "Alicia", lastName: "Turner" },
  });
  const manager = await prisma.user.create({
    data: { email: "manager@demo.tradesflow", passwordHash, firstName: "Mark", lastName: "Dawson" },
  });
  const techUsers = await Promise.all(
    [
      ["tech1@demo.tradesflow", "Liam", "Irving"],
      ["tech2@demo.tradesflow", "Nina", "Pearson"],
      ["tech3@demo.tradesflow", "Jordan", "Clarke"],
    ].map(([email, firstName, lastName]) =>
      prisma.user.create({ data: { email, passwordHash, firstName, lastName } }),
    ),
  );
  const customerUser = await prisma.user.create({
    data: { email: "customer1@demo.tradesflow", passwordHash, firstName: "Laura", lastName: "Bennett" },
  });

  await prisma.membership.createMany({
    data: [
      { organisationId: org.id, userId: owner.id, role: MembershipRole.OWNER, isPrimary: true },
      { organisationId: org.id, userId: manager.id, role: MembershipRole.MANAGER, isPrimary: true },
      ...techUsers.map((user) => ({
        organisationId: org.id,
        userId: user.id,
        role: MembershipRole.TECHNICIAN,
        isPrimary: true,
      })),
      { organisationId: org.id, userId: customerUser.id, role: MembershipRole.CUSTOMER, isPrimary: true },
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
          status: "ACTIVE",
          baseLocation: idx === 0 ? "Whitehaven" : idx === 1 ? "Workington" : "Egremont",
          skills: {
            categories: idx === 0 ? ["Leak repair", "Boiler service"] : idx === 1 ? ["Heating", "GasCheck"] : ["Install", "Plumbing"],
            emergency: idx < 2,
          },
        },
      }),
    ),
  );

  const depots = await Promise.all([
    prisma.depot.create({
      data: {
        organisationId: org.id,
        name: "Carlisle Central Depot",
        code: "CAR-DEPOT",
        addressLine1: "Unit 3 Currock Industrial Estate",
        city: "Carlisle",
        postcode: "CA2 4AS",
        latitude: 54.887,
        longitude: -2.947,
        isPrimary: true,
      },
    }),
    prisma.depot.create({
      data: {
        organisationId: org.id,
        name: "West Cumbria Hub",
        code: "WC-HUB",
        addressLine1: "4 Bransty Row",
        city: "Whitehaven",
        postcode: "CA28 7XE",
        latitude: 54.552,
        longitude: -3.586,
      },
    }),
  ]);

  const vans = await Promise.all(
    [
      ["Van 1 Whitehaven Response", "TF-01", "YK23 PLM", 54.5482, -3.5871, "Whitehaven Town Centre", depots[1].id, technicians[0].id],
      ["Van 2 Workington Route", "TF-02", "YK23 HEA", 54.6478, -3.4492, "Between Workington and Cockermouth", depots[0].id, technicians[1].id],
      ["Van 3 Egremont Unit", "TF-03", "YK23 GAS", 54.4796, -3.5338, "Near Egremont", depots[1].id, technicians[2].id],
    ].map(([name, identifier, registration, latitude, longitude, label, depotId, techId]) =>
      prisma.van.create({
        data: {
          organisationId: org.id,
          name: String(name),
          identifier: String(identifier),
          registration: String(registration),
          status: VanStatus.ACTIVE,
          depotId: String(depotId),
          depotLocation: depots.find((entry) => entry.id === depotId)?.name,
          latitude: Number(latitude),
          longitude: Number(longitude),
          currentLocationLabel: String(label),
          assignedTechnicianId: String(techId),
        },
      }),
    ),
  );

  for (const van of vans) {
    await prisma.vanLocation.createMany({
      data: Array.from({ length: 4 }).map((_, idx) => ({
        organisationId: org.id,
        vanId: van.id,
        latitude: (van.latitude ?? 54.6) + idx * 0.009,
        longitude: (van.longitude ?? -3.4) + (idx % 2 === 0 ? 0.01 : -0.004),
        label: idx === 0 ? "Start point" : idx === 3 ? "Current route" : "Route update",
        recordedAt: new Date(Date.now() - (4 - idx) * 40 * 60000),
      })),
    });
  }

  const racks = (
    await Promise.all(
      vans.flatMap((van) =>
        ["Zone A", "Zone B", "Zone C"].map((label) =>
          prisma.rack.create({
            data: { organisationId: org.id, vanId: van.id, label, description: `${label} stock zone` },
          }),
        ),
      ),
    )
  ).flat();

  const slots = (
    await Promise.all(
      racks.flatMap((rack) =>
        ["1", "2", "3", "4"].map((num) =>
          prisma.slot.create({
            data: {
              organisationId: org.id,
              rackId: rack.id,
              label: `${rack.label.replace("Zone ", "")}${num}`,
              category: rack.label === "Zone A" ? "Fittings" : rack.label === "Zone B" ? "Valves" : "Electrical",
            },
          }),
        ),
      ),
    )
  ).flat();

  const suppliers = await Promise.all(
    ["Screwfix", "Toolstation", "City Plumbing", "Wolseley", "CEF", "Lakes Trade Supplies"].map((name, idx) =>
      prisma.supplier.create({
        data: {
          organisationId: org.id,
          name,
          email: `orders-${slug(name)}@supplier.demo`,
          phone: `+44 1228 600${100 + idx}`,
          address: `${idx + 1} Trade Park, Carlisle`,
        },
      }),
    ),
  );

  const categoryRecords = await Promise.all(
    PRODUCT_CATEGORIES.map((name) =>
      prisma.productCategory.create({
        data: { organisationId: org.id, name, slug: slug(name), description: `${name} planned works catalogue` },
      }),
    ),
  );

  const products = (
    await Promise.all(
      categoryRecords.map((category, cIdx) =>
        Promise.all(
          Array.from({ length: 3 }).map((_, pIdx) => {
            const sourceCost = 35 + (cIdx * 3 + pIdx) * 8;
            const sell = sourceCost * (1.2 + (cIdx % 4) * 0.02);
            return prisma.product.create({
              data: {
                organisationId: org.id,
                categoryId: category.id,
                name: `${category.name} ${pIdx + 1}`,
                slug: `${slug(category.name)}-${pIdx + 1}`,
                description: `Contractor-supplied ${category.name.toLowerCase()} option.`,
                brand: pIdx % 2 === 0 ? "TradePro" : "HomeHeat",
                model: `TF-${cIdx + 1}${pIdx + 1}`,
                finishColor: pIdx % 2 === 0 ? "Chrome" : "Matt White",
                dimensions: pIdx % 2 === 0 ? "600x1200" : "500x1000",
                sourceCost: money(sourceCost),
                contractorSellPrice: money(sell),
                vatRate: "20.00",
                availabilityStatus: "IN_STOCK",
              },
            });
          }),
        ),
      ),
    )
  ).flat();

  await Promise.all(
    products.map((product, idx) =>
      prisma.productSource.create({
        data: {
          organisationId: org.id,
          productId: product.id,
          supplierId: suppliers[idx % suppliers.length].id,
          supplierName: suppliers[idx % suppliers.length].name,
          supplierSku: `SRC-${idx + 1000}`,
          supplierUrl: `https://supplier.demo/${slug(product.name)}`,
          supplierCost: product.sourceCost,
          availability: idx % 9 === 0 ? "LIMITED" : "IN_STOCK",
          sourceType: "SEEDED",
        },
      }),
    ),
  );

  await prisma.companyMarkupRule.create({
    data: {
      organisationId: org.id,
      ruleName: "Default Markup",
      markupPct: "18.00",
      minimumMarginPct: "10.00",
      roundingRule: "NEAREST_POUND",
    },
  });

  await Promise.all(
    categoryRecords.slice(0, 5).map((category, idx) =>
      prisma.companyMarkupRule.create({
        data: {
          organisationId: org.id,
          categoryId: category.id,
          ruleName: `${category.name} markup`,
          markupPct: money([18, 25, 15, 12, 20][idx]),
          minimumMarginPct: "10.00",
          roundingRule: idx === 2 ? "NEAREST_0_99" : "NEAREST_POUND",
        },
      }),
    ),
  );

  const customerNames = [
    "Laura Bennett", "Tom Atkinson", "Sophie McCann", "Daniel Hudson", "Emily Webster", "Jack Murray",
    "Rebecca Shaw", "Owen Gibson", "Isla Carter", "Ben Waller", "Grace Holden", "Aaron Whitfield",
    "Holly Armstrong", "Nathan Kirby", "Megan Sharpe", "Luke Simmonds", "Georgia Lambert", "Caleb Denton",
    "Freya Norris", "Ethan Wilkes", "Martha Rigg", "Rhys Pemberton",
  ];

  const customers = await Promise.all(
    customerNames.map((name, idx) =>
      prisma.customer.create({
        data: {
          organisationId: org.id,
          userId: idx === 0 ? customerUser.id : null,
          displayName: name,
          email: idx === 0 ? "customer1@demo.tradesflow" : `${slug(name)}@mail.demo`,
          phone: `+44 7400 22${String(idx).padStart(2, "0")}11`,
          isSubscriber: idx < 7,
          notes: idx % 2 === 0 ? "Prefers SMS updates." : "Key-safe access available.",
        },
      }),
    ),
  );

  const properties = (
    await Promise.all(
      customers.map((customer, idx) => {
        const town = TOWNS[idx % TOWNS.length];
        const primary = prisma.property.create({
          data: {
            organisationId: org.id,
            customerId: customer.id,
            label: "Home",
            addressLine1: `${idx + 12} ${town.town} Road`,
            city: town.town,
            postcode: `${town.postcode} ${100 + idx}`,
            latitude: town.latitude + (idx % 3) * 0.01,
            longitude: town.longitude - (idx % 3) * 0.008,
            installedEquipment: { boiler: idx % 2 === 0 ? "Worcester 30i" : "Vaillant EcoTec" },
          },
        });
        if (idx < 3) {
          const rental = prisma.property.create({
            data: {
              organisationId: org.id,
              customerId: customer.id,
              label: "Rental Property",
              addressLine1: `${idx + 3} King Street`,
              city: "Carlisle",
              postcode: `CA1 ${320 + idx}`,
              latitude: 54.893 + idx * 0.003,
              longitude: -2.932 + idx * 0.002,
            },
          });
          return Promise.all([primary, rental]);
        }
        return Promise.all([primary]);
      }),
    )
  ).flat();

  const plans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        organisationId: org.id,
        name: "HomeGuard Annual",
        yearlyPrice: "249.00",
        responseSlaHours: 8,
        annualGasCheckIncluded: true,
        discountedLabourPct: "15.00",
        noCalloutFee: true,
        priorityBooking: true,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        organisationId: org.id,
        name: "HomeGuard Monthly",
        monthlyPrice: "24.99",
        responseSlaHours: 12,
        discountedLabourPct: "10.00",
        noCalloutFee: true,
        priorityBooking: true,
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        organisationId: org.id,
        name: "Premium Response Plan",
        yearlyPrice: "399.00",
        monthlyPrice: "39.00",
        responseSlaHours: 4,
        annualGasCheckIncluded: true,
        discountedLabourPct: "20.00",
        noCalloutFee: true,
        priorityBooking: true,
      },
    }),
  ]);

  await prisma.subscription.createMany({
    data: [
      ...customers.slice(0, 5).map((customer, idx) => ({
        organisationId: org.id,
        customerId: customer.id,
        planId: plans[idx % plans.length].id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(Date.now() - (idx + 1) * 18 * 24 * 3600 * 1000),
        renewalDate: new Date(Date.now() + (30 - idx) * 24 * 3600 * 1000),
      })),
      {
        organisationId: org.id,
        customerId: customers[5].id,
        planId: plans[1].id,
        status: SubscriptionStatus.CANCELLED,
        startDate: new Date(Date.now() - 120 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
      },
      {
        organisationId: org.id,
        customerId: customers[6].id,
        planId: plans[2].id,
        status: SubscriptionStatus.LAPSED,
        startDate: new Date(Date.now() - 90 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
    ],
  });

  const inventoryRecords = [];
  const rackById = new Map(racks.map((rack) => [rack.id, rack]));
  for (let idx = 0; idx < INVENTORY_ITEMS.length; idx += 1) {
    const supplier = suppliers[idx % suppliers.length];
    const baseSku = `TF-INV-${String(idx + 1).padStart(4, "0")}`;

    inventoryRecords.push(
      await prisma.inventoryItem.create({
        data: {
          organisationId: org.id,
          depotId: depots[0].id,
          supplierId: supplier.id,
          name: INVENTORY_ITEMS[idx],
          category: idx % 2 === 0 ? "Plumbing" : "Heating",
          sku: `${baseSku}-DEPOT`,
          quantity: 20 + (idx % 6) * 3,
          unit: "pcs",
          costPrice: money(1.8 + (idx % 9) * 1.3),
          reorderLevel: 6,
          barcode: `BC-${baseSku}`,
          qrCode: `QR-${baseSku}`,
        },
      }),
    );

    const van = vans[idx % vans.length];
    const vanSlots = slots.filter((entry) => rackById.get(entry.rackId)?.vanId === van.id);
    const slot = vanSlots[idx % vanSlots.length];
    inventoryRecords.push(
      await prisma.inventoryItem.create({
        data: {
          organisationId: org.id,
          vanId: van.id,
          rackId: slot.rackId,
          slotId: slot.id,
          supplierId: supplier.id,
          name: INVENTORY_ITEMS[idx],
          category: slot.category ?? "General",
          sku: `${baseSku}-${van.identifier}`,
          quantity: van.identifier === "TF-02" && idx % 5 === 0 ? 0 : 3 + (idx % 5),
          unit: "pcs",
          costPrice: money(1.8 + (idx % 9) * 1.3),
          reorderLevel: 3,
          barcode: `BC-${baseSku}-${van.identifier}`,
          qrCode: `QR-${baseSku}-${van.identifier}`,
        },
      }),
    );
  }

  const jobStatuses: JobStatus[] = [
    JobStatus.INCOMING_REQUEST,
    JobStatus.UNDER_REVIEW,
    JobStatus.ESTIMATE_DRAFTED,
    JobStatus.ESTIMATE_SENT,
    JobStatus.ESTIMATE_APPROVED,
    JobStatus.SCHEDULED,
    JobStatus.TECHNICIAN_ASSIGNED,
    JobStatus.VAN_ASSIGNED,
    JobStatus.IN_PROGRESS,
    JobStatus.AWAITING_MATERIALS,
    JobStatus.COMPLETED,
    JobStatus.INVOICE_SENT,
    JobStatus.PAYMENT_PENDING,
    JobStatus.PAID,
    JobStatus.WARRANTY_FOLLOW_UP,
    JobStatus.CANCELLED,
    JobStatus.REJECTED,
    JobStatus.AWAITING_CUSTOMER_RESPONSE,
    JobStatus.LEAD,
  ];

  const jobs = [];
  const requests = [];
  const technicianAssignedStatuses: JobStatus[] = [
    JobStatus.TECHNICIAN_ASSIGNED,
    JobStatus.VAN_ASSIGNED,
    JobStatus.IN_PROGRESS,
    JobStatus.AWAITING_MATERIALS,
    JobStatus.COMPLETED,
    JobStatus.INVOICE_SENT,
    JobStatus.PAYMENT_PENDING,
    JobStatus.PAID,
  ];
  const vanAssignedStatuses: JobStatus[] = [
    JobStatus.VAN_ASSIGNED,
    JobStatus.IN_PROGRESS,
    JobStatus.AWAITING_MATERIALS,
    JobStatus.COMPLETED,
    JobStatus.INVOICE_SENT,
    JobStatus.PAYMENT_PENDING,
    JobStatus.PAID,
  ];
  for (let idx = 0; idx < 25; idx += 1) {
    const customer = customers[idx % customers.length];
    const property = properties[idx % properties.length];
    const technician = technicians[idx % technicians.length];
    const van = vans[idx % vans.length];
    const status = jobStatuses[idx % jobStatuses.length];
    const title = JOB_TEMPLATES[idx % JOB_TEMPLATES.length];
    const urgency = idx % 8 === 0 ? JobUrgency.EMERGENCY : idx % 3 === 0 ? JobUrgency.HIGH : JobUrgency.MEDIUM;
    const supplyMethod =
      idx % 6 === 0 ? SupplyMethod.MARKETPLACE : idx % 5 === 0 ? SupplyMethod.CUSTOMER_SUPPLY : SupplyMethod.CONTRACTOR_SUPPLY;
    const createdAt = new Date(Date.now() - (idx + 1) * 7 * 3600 * 1000);
    const completedAt =
      status === JobStatus.COMPLETED || status === JobStatus.INVOICE_SENT || status === JobStatus.PAYMENT_PENDING || status === JobStatus.PAID
        ? new Date(createdAt.getTime() + 5 * 3600 * 1000)
        : null;

    const job = await prisma.job.create({
      data: {
        organisationId: org.id,
        customerId: customer.id,
        propertyId: property.id,
        technicianId: technicianAssignedStatuses.includes(status) ? technician.id : null,
        vanId: vanAssignedStatuses.includes(status) ? van.id : null,
        title,
        issueCategory: title.toLowerCase().includes("boiler") ? "Heating" : title.toLowerCase().includes("socket") || title.toLowerCase().includes("door") ? "Electrical/Install" : "Plumbing",
        description: `Customer reported ${title.toLowerCase()} at ${property.addressLine1}.`,
        urgency,
        status,
        isEmergency: urgency === JobUrgency.EMERGENCY,
        supplyMethod,
        source: idx < 14 ? "CUSTOMER_APP" : "OFFICE",
        scheduledAt: new Date(Date.now() + (idx % 6) * 2 * 3600 * 1000),
        startedAt: status === JobStatus.IN_PROGRESS || status === JobStatus.AWAITING_MATERIALS || completedAt ? new Date(createdAt.getTime() + 2 * 3600 * 1000) : null,
        completedAt,
        estimatedDurationMinutes: 120 + (idx % 4) * 30,
        labourMinutes: completedAt ? 110 + (idx % 3) * 30 : 0,
        slaTargetAt: customer.isSubscriber ? new Date(createdAt.getTime() + 6 * 3600 * 1000) : null,
        slaState: customer.isSubscriber ? (urgency === JobUrgency.EMERGENCY ? SlaState.CRITICAL : SlaState.AT_RISK) : SlaState.SAFE,
        aiSummary: "Rule-engine triage complete with likely materials suggested.",
        createdAt,
      },
    });
    jobs.push(job);

    await prisma.jobStatusHistory.createMany({
      data: [
        { jobId: job.id, fromStatus: null, toStatus: JobStatus.INCOMING_REQUEST, changedById: manager.id, note: "Intake logged.", createdAt },
        { jobId: job.id, fromStatus: JobStatus.INCOMING_REQUEST, toStatus: status, changedById: manager.id, note: "Dispatch updated lifecycle.", createdAt: new Date(createdAt.getTime() + 40 * 60000) },
      ],
    });

    if (idx < 12) {
      const requestStatus = [JobRequestStatus.NEW, JobRequestStatus.UNDER_REVIEW, JobRequestStatus.ESTIMATE_REQUIRED, JobRequestStatus.READY_TO_SCHEDULE, JobRequestStatus.EMERGENCY_DISPATCHED, JobRequestStatus.MORE_INFO_REQUESTED, JobRequestStatus.ACCEPTED][idx % 7];
      const request = await prisma.jobRequest.create({
        data: {
          organisationId: org.id,
          customerId: customer.id,
          propertyId: property.id,
          linkedJobId: job.id,
          title: job.title,
          serviceType: job.issueCategory,
          description: job.description,
          urgency: job.urgency,
          status: requestStatus,
          supplyMethod: job.supplyMethod,
          isEmergency: job.isEmergency,
          subscriberPriority: customer.isSubscriber,
          aiSummary: job.aiSummary,
          aiConfidence: "0.84",
          suggestedUrgency: job.urgency,
          suggestedServiceType: job.issueCategory,
          suggestedMaterials: { likely: ["Copper elbows", "PTFE tape", "Isolation valves"] },
          slaTargetAt: job.slaTargetAt,
          slaState: job.slaState,
          reviewedById: requestStatus === JobRequestStatus.NEW ? null : manager.id,
          reviewedAt: requestStatus === JobRequestStatus.NEW ? null : new Date(createdAt.getTime() + 30 * 60000),
          requestedAt: createdAt,
        },
      });
      requests.push(request);
      if (job.supplyMethod === SupplyMethod.MARKETPLACE) {
        await prisma.jobRequestProduct.createMany({
          data: [
            { organisationId: org.id, requestId: request.id, productId: products[(idx * 2) % products.length].id, quantity: 1 + (idx % 2), note: "Customer selected option" },
            { organisationId: org.id, requestId: request.id, productId: products[(idx * 2 + 1) % products.length].id, quantity: 1, note: "Backup option" },
          ],
        });
      }
    }
  }

  return { org, owner, manager, techUsers, technicians, depots, vans, suppliers, products, customers, properties, plans, jobs, requests, inventoryRecords };
}

async function seedPrimaryOperations(state: Awaited<ReturnType<typeof seedPrimary>>) {
  const { org, manager, techUsers, technicians, depots, suppliers, products, jobs, requests, inventoryRecords } = state;
  const vanItems = inventoryRecords.filter((item) => item.vanId);
  const depotItems = inventoryRecords.filter((item) => item.depotId === depots[0].id);

  for (let idx = 0; idx < 18; idx += 1) {
    const job = jobs[idx];
    const item = vanItems[idx % vanItems.length];
    const quantity = 1 + (idx % 3);
    await prisma.jobMaterial.create({
      data: {
        organisationId: org.id,
        jobId: job.id,
        inventoryItemId: item.id,
        description: item.name,
        quantity: money(quantity),
        unit: item.unit,
        unitPrice: money(Number(item.costPrice) * 1.7),
        vatRate: "20.00",
        total: money(Number(item.costPrice) * 1.7 * quantity),
      },
    });
    await prisma.stockMovement.create({
      data: {
        organisationId: org.id,
        inventoryItemId: item.id,
        jobId: job.id,
        fromSlotId: item.slotId,
        performedById: techUsers[idx % techUsers.length].id,
        type: StockMovementType.OUT,
        quantity,
        codeUsed: item.barcode ?? item.sku,
        note: "Issued to job",
      },
    });
  }

  for (let idx = 0; idx < 8; idx += 1) {
    const source = depotItems[idx % depotItems.length];
    const target = vanItems.find((item) => item.name === source.name);
    if (!target) continue;
    await prisma.stockMovement.create({
      data: {
        organisationId: org.id,
        inventoryItemId: source.id,
        fromDepotId: depots[0].id,
        toSlotId: target.slotId,
        performedById: manager.id,
        type: StockMovementType.TRANSFER,
        quantity: 3,
        note: "Restock from depot",
      },
    });
  }

  await prisma.stockMovement.createMany({
    data: [
      {
        organisationId: org.id,
        inventoryItemId: vanItems[0].id,
        fromSlotId: vanItems[0].slotId,
        performedById: manager.id,
        type: StockMovementType.ADJUSTMENT,
        quantity: -1,
        note: "Lost item logged",
      },
      {
        organisationId: org.id,
        inventoryItemId: vanItems[1].id,
        fromSlotId: vanItems[1].slotId,
        performedById: manager.id,
        type: StockMovementType.ADJUSTMENT,
        quantity: -2,
        note: "Damaged item logged",
      },
    ],
  });

  const estimates = [];
  for (let idx = 0; idx < 10; idx += 1) {
    const job = jobs[idx];
    const subtotal = 180 + idx * 30;
    const vat = subtotal * 0.2;
    const estimate = await prisma.estimate.create({
      data: {
        organisationId: org.id,
        jobId: job.id,
        customerId: job.customerId,
        propertyId: job.propertyId,
        number: `EST-2026-${String(idx + 1).padStart(4, "0")}`,
        status: idx % 3 === 0 ? EstimateStatus.SENT : idx % 4 === 0 ? EstimateStatus.APPROVED : EstimateStatus.DRAFT,
        validUntil: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        subtotal: money(subtotal),
        vatTotal: money(vat),
        total: money(subtotal + vat),
        notes: "Estimate generated from dispatch review.",
        createdById: manager.id,
      },
    });
    estimates.push(estimate);
    await prisma.estimateLineItem.createMany({
      data: [
        { estimateId: estimate.id, type: LineItemType.LABOUR, description: "Labour", quantity: "2.00", unitPrice: money(68 + idx), vatRate: "20.00", total: money((68 + idx) * 2) },
        { estimateId: estimate.id, type: LineItemType.MATERIAL, description: "Materials", quantity: "1.00", unitPrice: money(44 + idx * 3), vatRate: "20.00", total: money(44 + idx * 3) },
      ],
    });
  }

  const invoiceReadyStatuses: JobStatus[] = [
    JobStatus.COMPLETED,
    JobStatus.INVOICE_SENT,
    JobStatus.PAYMENT_PENDING,
    JobStatus.PAID,
  ];
  const invoicePriorityJobs = jobs.filter((job) => invoiceReadyStatuses.includes(job.status));
  const invoiceJobs = [
    ...invoicePriorityJobs,
    ...jobs.filter((job) => !invoicePriorityJobs.some((priorityJob) => priorityJob.id === job.id)),
  ].slice(0, 10);
  const invoices = [];
  for (let idx = 0; idx < invoiceJobs.length; idx += 1) {
    const job = invoiceJobs[idx];
    const subtotal = 240 + idx * 34;
    const vat = subtotal * 0.2;
    const status =
      idx % 4 === 0 ? InvoiceStatus.PAID : idx % 3 === 0 ? InvoiceStatus.PARTIAL : idx % 5 === 0 ? InvoiceStatus.OVERDUE : InvoiceStatus.SENT;
    const invoice = await prisma.invoice.create({
      data: {
        organisationId: org.id,
        jobId: job.id,
        customerId: job.customerId,
        propertyId: job.propertyId,
        number: `INV-2026-${String(idx + 1).padStart(4, "0")}`,
        status,
        issuedAt: new Date(Date.now() - idx * 2 * 24 * 3600 * 1000),
        dueAt: new Date(Date.now() + (12 - idx) * 24 * 3600 * 1000),
        paidAt: status === InvoiceStatus.PAID ? new Date() : null,
        subtotal: money(subtotal),
        vatTotal: money(vat),
        total: money(subtotal + vat),
        createdById: manager.id,
      },
    });
    invoices.push(invoice);
    await prisma.invoiceLineItem.createMany({
      data: [
        { invoiceId: invoice.id, type: LineItemType.LABOUR, description: "Labour", quantity: "2.00", unitPrice: money(72 + idx), vatRate: "20.00", total: money((72 + idx) * 2) },
        { invoiceId: invoice.id, type: LineItemType.MATERIAL, description: "Materials", quantity: "1.00", unitPrice: money(66 + idx * 2), vatRate: "20.00", total: money(66 + idx * 2) },
      ],
    });
  }

  await prisma.mockPayment.createMany({
    data: invoices
      .filter((invoice) => invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.PARTIAL)
      .map((invoice, idx) => ({
        invoiceId: invoice.id,
        amount: invoice.status === InvoiceStatus.PARTIAL ? money(Number(invoice.total) / 2) : money(Number(invoice.total)),
        method: idx % 2 === 0 ? "BANK_TRANSFER" : "CARD",
        reference: `PAY-${idx + 1000}`,
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

  const expenses = await Promise.all(
    Array.from({ length: 12 }).map((_, idx) =>
      prisma.expense.create({
        data: {
          organisationId: org.id,
          supplierId: suppliers[idx % suppliers.length].id,
          createdById: manager.id,
          category: idx % 4 === 0 ? "Fuel" : idx % 4 === 1 ? "Parts Procurement" : idx % 4 === 2 ? "Tools" : "Emergency Purchase",
          description: idx % 2 === 0 ? "Fuel and parking" : "Supplier purchase",
          amount: money(45 + idx * 10),
          vatAmount: money((45 + idx * 10) * 0.2),
          occurredAt: new Date(Date.now() - idx * 3 * 24 * 3600 * 1000),
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
      sizeBytes: 120000 + idx * 1300,
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
      { organisationId: org.id, quarterLabel: "Q1 2026", startDate: new Date("2026-01-01"), endDate: new Date("2026-03-31"), salesVat: "2680.80", purchaseVat: "742.15", netVat: "1938.65", status: VatPeriodStatus.EXPORTED },
      { organisationId: org.id, quarterLabel: "Q2 2026", startDate: new Date("2026-04-01"), endDate: new Date("2026-06-30"), salesVat: "0.00", purchaseVat: "0.00", netVat: "0.00", status: VatPeriodStatus.OPEN },
    ],
  });

  const threads = await Promise.all(
    jobs.slice(0, 12).map((job, idx) =>
      prisma.chatThread.create({
        data: { organisationId: org.id, customerId: job.customerId, jobId: job.id, subject: `${job.title} support`, createdById: manager.id, createdAt: new Date(Date.now() - idx * 6 * 3600 * 1000) },
      }),
    ),
  );

  for (let idx = 0; idx < threads.length; idx += 1) {
    const thread = threads[idx];
    const job = jobs[idx];
    const customer = state.customers.find((entry) => entry.id === job.customerId)!;
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
        { organisationId: org.id, threadId: thread.id, senderId: customer.userId ?? null, body: "Customer reported leak and uploaded photos.", type: "USER" },
        { organisationId: org.id, threadId: thread.id, senderId: techUser.id, body: "ETA 35 minutes. Carrying likely parts.", type: "USER" },
        { organisationId: org.id, threadId: thread.id, senderId: manager.id, body: "Dispatch update logged and SLA monitoring active.", type: "SYSTEM" },
      ],
    });
  }

  const completedJobs = jobs.filter((job) => job.completedAt).slice(0, 20);
  for (let idx = 0; idx < completedJobs.length; idx += 1) {
    const job = completedJobs[idx];
    const product = products[idx % products.length];
    const property = state.properties.find((entry) => entry.id === job.propertyId)!;
    const customer = state.customers.find((entry) => entry.id === job.customerId)!;
    const status = idx % 9 === 0 ? AssetStatus.FAULTY : idx % 7 === 0 ? AssetStatus.REPLACED : AssetStatus.ACTIVE;
    const installationDate = new Date(job.completedAt as Date);
    const warrantyExpiry = new Date(installationDate);
    warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 2);

    const asset = await prisma.propertyAsset.create({
      data: {
        organisationId: org.id,
        propertyId: property.id,
        customerId: customer.id,
        productId: product.id,
        installedJobId: job.id,
        estimateId: requests[idx % requests.length]?.linkedJobId ? null : null,
        invoiceId: null,
        installedByTechnicianId: technicians[idx % technicians.length].id,
        assetType: "Plumbing Asset",
        name: product.name,
        category: product.categoryId,
        supplierName: suppliers[idx % suppliers.length].name,
        supplierSku: `SRC-${idx + 200}`,
        brand: product.brand,
        model: product.model,
        finishColor: product.finishColor,
        sourceCost: product.sourceCost,
        sellPrice: product.contractorSellPrice,
        installationDate,
        floor: idx % 2 === 0 ? "Ground" : "First",
        room: ["Kitchen", "Bathroom", "Lounge", "Hallway", "Bedroom 1", "Utility Room"][idx % 6],
        zone: idx % 3 === 0 ? "North wall" : "Service area",
        serialNumber: `ASSET-${idx + 1000}`,
        warrantyStart: installationDate,
        warrantyExpiry,
        expectedReplacementMonths: 84,
        status,
        notes: "Created from completed install workflow.",
      },
    });
    await prisma.assetStatusHistory.create({
      data: {
        organisationId: org.id,
        assetId: asset.id,
        fromStatus: null,
        toStatus: status,
        changedById: manager.id,
        note: "Seeded lifecycle history",
      },
    });
  }

  await prisma.analyticsSnapshot.createMany({
    data: Array.from({ length: 80 }).map((_, idx) => ({
      organisationId: org.id,
      metric: ["revenue_daily", "jobs_by_status", "inventory_usage", "subscriptions_active", "sla_compliance", "outstanding_invoices", "estimate_conversion_rate", "marketplace_margin", "asset_install_count"][idx % 9],
      dimension: idx % 2 === 0 ? "overall" : `bucket_${idx % 6}`,
      value: money(35 + idx * 11.4),
      capturedAt: new Date(Date.now() - idx * 8 * 3600 * 1000),
    })),
  });
}

async function seedSecondary(passwordHash: string) {
  const org = await prisma.organisation.create({
    data: {
      name: "West Coast Trade Services Ltd",
      slug: "west-coast-trade-services",
      onboardingComplete: true,
      timezone: "Europe/London",
    },
  });

  await prisma.contractorBranding.create({
    data: {
      organisationId: org.id,
      companyName: org.name,
      logoPath: "/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-light.svg",
      primaryColor: "#0B1F33",
      accentColor: "#FF7A00",
      supportPhone: "+44 1900 800450",
      supportEmail: "ops@westcoasttrades.demo",
    },
  });

  const owner = await prisma.user.create({
    data: { email: "owner@westcoast.demo", passwordHash, firstName: "Elliot", lastName: "Grant" },
  });
  const manager = await prisma.user.create({
    data: { email: "manager@westcoast.demo", passwordHash, firstName: "Kara", lastName: "Bell" },
  });
  const techUser = await prisma.user.create({
    data: { email: "tech@westcoast.demo", passwordHash, firstName: "Miles", lastName: "Farrell" },
  });
  const customerUser = await prisma.user.create({
    data: { email: "customer@westcoast.demo", passwordHash, firstName: "Nora", lastName: "Lonsdale" },
  });

  await prisma.membership.createMany({
    data: [
      { organisationId: org.id, userId: owner.id, role: MembershipRole.OWNER, isPrimary: true },
      { organisationId: org.id, userId: manager.id, role: MembershipRole.MANAGER, isPrimary: true },
      { organisationId: org.id, userId: techUser.id, role: MembershipRole.TECHNICIAN, isPrimary: true },
      { organisationId: org.id, userId: customerUser.id, role: MembershipRole.CUSTOMER, isPrimary: true },
    ],
  });

  const technician = await prisma.technician.create({
    data: {
      organisationId: org.id,
      userId: techUser.id,
      displayName: `${techUser.firstName} ${techUser.lastName}`,
      email: techUser.email,
      status: "ACTIVE",
      skills: { categories: ["Electrical", "Reactive maintenance"], emergency: true },
      baseLocation: "Workington",
    },
  });

  const depot = await prisma.depot.create({
    data: {
      organisationId: org.id,
      name: "Workington Depot",
      code: "WTS-WORK",
      addressLine1: "Northside Trade Units",
      city: "Workington",
      postcode: "CA14 3DE",
      latitude: 54.645,
      longitude: -3.557,
      isPrimary: true,
    },
  });

  const van = await prisma.van.create({
    data: {
      organisationId: org.id,
      depotId: depot.id,
      name: "WTS Van 1",
      identifier: "WTS-01",
      registration: "YK23 WTS",
      status: VanStatus.ACTIVE,
      depotLocation: depot.name,
      currentLocationLabel: "Workington Centre",
      latitude: 54.643,
      longitude: -3.548,
      assignedTechnicianId: technician.id,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      organisationId: org.id,
      userId: customerUser.id,
      displayName: "Nora Lonsdale",
      email: "customer@westcoast.demo",
      phone: "+44 7700 881111",
    },
  });
  const property = await prisma.property.create({
    data: {
      organisationId: org.id,
      customerId: customer.id,
      addressLine1: "10 Lime Court",
      city: "Workington",
      postcode: "CA14 4GH",
      latitude: 54.646,
      longitude: -3.552,
      notes: "Tenant-isolation validation record.",
    },
  });

  const job = await prisma.job.create({
    data: {
      organisationId: org.id,
      customerId: customer.id,
      propertyId: property.id,
      technicianId: technician.id,
      vanId: van.id,
      title: "Consumer unit check",
      issueCategory: "Electrical",
      description: "Intermittent trip in kitchen circuit.",
      urgency: JobUrgency.MEDIUM,
      status: JobStatus.SCHEDULED,
      supplyMethod: SupplyMethod.CONTRACTOR_SUPPLY,
      source: "OFFICE",
      scheduledAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    },
  });

  await prisma.jobRequest.create({
    data: {
      organisationId: org.id,
      customerId: customer.id,
      propertyId: property.id,
      linkedJobId: job.id,
      title: job.title,
      serviceType: job.issueCategory,
      description: job.description,
      urgency: job.urgency,
      status: JobRequestStatus.READY_TO_SCHEDULE,
      supplyMethod: SupplyMethod.CONTRACTOR_SUPPLY,
      suggestedUrgency: JobUrgency.MEDIUM,
      suggestedServiceType: "Electrical",
    },
  });
}

async function main() {
  await clearDatabase();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.user.create({
    data: {
      email: "admin@tradesflow.co.uk",
      passwordHash,
      firstName: "Platform",
      lastName: "Admin",
      platformRole: PlatformRole.SUPER_ADMIN,
    },
  });

  const primaryState = await seedPrimary(passwordHash);
  await seedPrimaryOperations(primaryState);
  await seedSecondary(passwordHash);

  console.log("Seed complete.");
  console.log(`Demo password for seeded accounts: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
