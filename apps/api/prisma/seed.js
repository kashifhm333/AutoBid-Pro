import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ROLES, PERMISSIONS, FEE_SCHEDULE, ANTI_SNIPING_DEFAULTS } from '@autobid/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 AutoBid Pro — Commencing Enterprise Database Seed...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed System Settings
  console.log('⚙️  Seeding System Configuration Settings...');
  const settings = [
    { key: 'platform.buyer_premium_pct', value: String(FEE_SCHEDULE.BUYER_PREMIUM_PERCENTAGE), dataType: 'DECIMAL', description: 'Buyer premium fee percentage' },
    { key: 'platform.buyer_premium_min', value: String(FEE_SCHEDULE.BUYER_PREMIUM_MIN_FEE), dataType: 'DECIMAL', description: 'Minimum buyer premium fee in USD' },
    { key: 'platform.buyer_premium_max', value: String(FEE_SCHEDULE.BUYER_PREMIUM_MAX_FEE), dataType: 'DECIMAL', description: 'Maximum buyer premium fee in USD' },
    { key: 'platform.bidder_deposit', value: String(FEE_SCHEDULE.BIDDER_REGISTRATION_DEPOSIT), dataType: 'DECIMAL', description: 'Required bidder registration hold deposit' },
    { key: 'platform.anti_sniping_window_sec', value: String(ANTI_SNIPING_DEFAULTS.WINDOW_SECONDS), dataType: 'INT', description: 'Soft close anti-sniping trigger window in seconds' },
    { key: 'platform.anti_sniping_ext_sec', value: String(ANTI_SNIPING_DEFAULTS.EXTENSION_SECONDS), dataType: 'INT', description: 'Extension duration when anti-sniping triggers' }
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s
    });
  }

  // 2. Seed Roles
  console.log('🛡️  Seeding Platform Roles & Hierarchies...');
  const roleMap = {};
  for (const roleName of Object.values(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Platform role: ${roleName.replace(/_/g, ' ')}`,
        isSystem: true
      }
    });
    roleMap[roleName] = role.id;
  }

  // 3. Seed Users across all 11 Roles
  console.log('👤 Seeding Platform Users (All 11 Roles)...');
  const usersToSeed = [
    { email: 'superadmin@autobidpro.com', firstName: 'Alexander', lastName: 'Vance', role: ROLES.SUPER_ADMINISTRATOR },
    { email: 'admin@autobidpro.com', firstName: 'Marcus', lastName: 'Sterling', role: ROLES.ADMINISTRATOR },
    { email: 'manager@autobidpro.com', firstName: 'Elena', lastName: 'Rostova', role: ROLES.AUCTION_MANAGER },
    { email: 'inspector@autobidpro.com', firstName: 'David', lastName: 'Kaufman', role: ROLES.INSPECTOR },
    { email: 'dealer@concoursmotors.com', firstName: 'Julian', lastName: 'DeLaCruz', role: ROLES.DEALER },
    { email: 'seller@collectorcars.com', firstName: 'Arthur', lastName: 'Pendleton', role: ROLES.SELLER },
    { email: 'buyer1@monacocars.com', firstName: 'Sébastien', lastName: 'Laurent', role: ROLES.BUYER },
    { email: 'buyer2@speedhunters.com', firstName: 'Kenji', lastName: 'Takahashi', role: ROLES.BUYER },
    { email: 'escrow@autobidescrow.com', firstName: 'Rachel', lastName: 'Sinclair', role: ROLES.ESCROW_AGENT },
    { email: 'logistics@supercartransport.com', firstName: 'Viktor', lastName: 'Hansen', role: ROLES.TRANSPORT_PARTNER },
    { email: 'support@autobidpro.com', firstName: 'Chloe', lastName: 'Bennett', role: ROLES.SUPPORT_AGENT }
  ];

  const userMap = {};
  for (const u of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { status: 'ACTIVE', emailVerified: true },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            bio: `${u.firstName} ${u.lastName} - Verified platform participant`
          }
        }
      }
    });

    userMap[u.email] = user.id;

    // Assign Role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roleMap[u.role]
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: roleMap[u.role]
      }
    });
  }

  // 4. Seed Vehicles & Supercar Catalog
  console.log('🏎️  Seeding Exotic & Classic Automobile Inventory...');
  const sellerId = userMap['seller@collectorcars.com'];
  const inspectorId = userMap['inspector@autobidpro.com'];

  const vehiclesData = [
    {
      vin: 'WP0AF2A99PS187291',
      year: 2023,
      make: 'Porsche',
      model: '911 GT3 RS',
      trim: 'Weissach Package',
      mileage: 1840,
      fuelType: 'GASOLINE',
      transmission: 'AUTOMATIC',
      engine: '4.0L Naturally Aspirated Flat-6 (518 HP)',
      driveType: 'RWD',
      exteriorColor: 'Shark Blue',
      interiorColor: 'Black Leather with Guards Red Stitching',
      bodyType: 'COUPE',
      city: 'Scottsdale',
      state: 'AZ',
      postalCode: '85255',
      titleStatus: 'CLEAN',
      condition: 'MINT',
      description: 'Factory Weissach Package equipped 992 GT3 RS. Magnesium wheels, exposed carbon fibre aero package, front-axle lift, and carbon-ceramic brakes (PCCB). Fully wrapped in paint protection film (PPF).',
      highlights: ['Weissach Package', 'Magnesium Lightweight Wheels', 'PCCB Ceramic Brakes', 'Front Axle Lift System', 'Full Vehicle XPEL PPF'],
      status: 'APPROVED',
      images: [
        { url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', isPrimary: true, caption: 'Front Three-Quarter View' },
        { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', isPrimary: false, caption: 'Rear Aero Wing Profile' }
      ]
    },
    {
      vin: 'ZFF83LFA0L0248912',
      year: 2020,
      make: 'Ferrari',
      model: '488 Pista',
      trim: 'Carbon Series',
      mileage: 3210,
      fuelType: 'GASOLINE',
      transmission: 'AUTOMATIC',
      engine: '3.9L Twin-Turbocharged V8 (710 HP)',
      driveType: 'RWD',
      exteriorColor: 'Rosso Corsa',
      interiorColor: 'Nero Alcantara with Giallo Accents',
      bodyType: 'COUPE',
      city: 'Newport Beach',
      state: 'CA',
      postalCode: '92660',
      titleStatus: 'CLEAN',
      condition: 'EXCELLENT',
      description: 'Stunning 488 Pista finished in iconic Rosso Corsa with Argento Nürburgring stripes. Optioned with exterior carbon package, carbon fibre wheels, telemetry system, and titanium exhaust pipes.',
      highlights: ['One Owner from New', 'Full Carbon Engine Bay', 'Carbon Fibre Wheels', 'Scuderia Shields', 'Ferrari 7-Year Maintenance'],
      status: 'APPROVED',
      images: [
        { url: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=80', isPrimary: true, caption: 'Front Fascia and S-Duct' }
      ]
    },
    {
      vin: 'WDD1903791A041890',
      year: 2021,
      make: 'Mercedes-AMG',
      model: 'GT Black Series',
      trim: 'Track Package',
      mileage: 820,
      fuelType: 'GASOLINE',
      transmission: 'AUTOMATIC',
      engine: '4.0L Flat-Plane Crank Bi-Turbo V8 (720 HP)',
      driveType: 'RWD',
      exteriorColor: 'Magmabeam',
      interiorColor: 'Black DINAMICA with Orange Stitching',
      bodyType: 'COUPE',
      city: 'Miami',
      state: 'FL',
      postalCode: '33139',
      titleStatus: 'CLEAN',
      condition: 'MINT',
      description: 'Nürburgring record holder production car. Finished in launch exclusive AMG Magmabeam. Manually adjustable carbon fibre front splitter and twin-blade active carbon rear spoiler.',
      highlights: ['AMG Magmabeam Paint', 'Carbon Ceramic Brakes', 'Titanium Roll Cage', 'Four-Point Schroth Harnesses'],
      status: 'APPROVED',
      images: [
        { url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80', isPrimary: true, caption: 'Magmabeam Front Aggressive Aero' }
      ]
    },
    {
      vin: '1FA6P8CF9K5104291',
      year: 2019,
      make: 'Ford',
      model: 'GT',
      trim: 'Carbon Series',
      mileage: 1150,
      fuelType: 'GASOLINE',
      transmission: 'AUTOMATIC',
      engine: '3.5L EcoBoost Twin-Turbo V6 (647 HP)',
      driveType: 'RWD',
      exteriorColor: 'Liquid Red',
      interiorColor: 'Dark Energy Alcantara',
      bodyType: 'COUPE',
      city: 'Dallas',
      state: 'TX',
      postalCode: '75201',
      titleStatus: 'CLEAN',
      condition: 'MINT',
      description: 'Factory Carbon Series saving nearly 40 pounds with exposed carbon dual stripes, carbon wheels, titanium exhaust, and polycarbonate engine hatch. Complete with original order kit.',
      highlights: ['Carbon Series Lightweight', 'Akrapovič Titanium Exhaust', 'Hydraulic Suspension Lift', 'Original Factory Build Book'],
      status: 'APPROVED',
      images: [
        { url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', isPrimary: true, caption: 'Liquid Red Flying Buttress Aero' }
      ]
    },
    {
      vin: 'WBS33AY08RFG48190',
      year: 2024,
      make: 'BMW',
      model: 'M3 CS',
      trim: 'CS Lightweight',
      mileage: 4100,
      fuelType: 'GASOLINE',
      transmission: 'AUTOMATIC',
      engine: '3.0L Twin-Turbocharged Inline-6 (543 HP)',
      driveType: 'AWD',
      exteriorColor: 'Frozen Solid White',
      interiorColor: 'Anthracite / Red Full Merino Leather',
      bodyType: 'SEDAN',
      city: 'Denver',
      state: 'CO',
      postalCode: '80202',
      titleStatus: 'CLEAN',
      condition: 'EXCELLENT',
      description: 'Limited production M3 CS with M xDrive all-wheel drive, yellow DRL motorsport headlights, carbon-fiber hood, and M Carbon bucket seats.',
      highlights: ['543 Horsepower S58 Engine', 'M xDrive AWD with 2WD Mode', 'Carbon Fibre Roof & Hood', 'Yellow Motorsport DRLs'],
      status: 'APPROVED',
      images: [
        { url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80', isPrimary: true, caption: 'Frozen White Front Profile' }
      ]
    },
    {
      vin: '67400F2A01894',
      year: 1967,
      make: 'Shelby',
      model: 'GT500',
      trim: 'Fastback 428 Police Interceptor',
      mileage: 48200,
      fuelType: 'GASOLINE',
      transmission: 'MANUAL',
      engine: '428ci Police Interceptor Dual-Quad V8 (355 HP)',
      driveType: 'RWD',
      exteriorColor: 'Wimbledon White',
      interiorColor: 'Black Vinyl Luxury Decor',
      bodyType: 'COUPE',
      city: 'Nashville',
      state: 'TN',
      postalCode: '37201',
      titleStatus: 'CLEAN',
      condition: 'EXCELLENT',
      description: 'Authentic 1967 Shelby GT500 verified in the SAAC registry. Matching-numbers 428ci dual 4-barrel carburetors paired with 4-speed Toploader manual transmission and factory roll bar.',
      highlights: ['Verified SAAC Registry Listed', 'Matching Numbers 428ci V8', 'Factory Inboard High-Beam Headlights', 'Magstar Wheels'],
      status: 'SOLD',
      images: [
        { url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80', isPrimary: true, caption: 'Classic Wimbledon White Fastback' }
      ]
    }
  ];

  const vehicleMap = {};
  for (const vData of vehiclesData) {
    const { images, ...vehicleFields } = vData;
    const vehicle = await prisma.vehicle.upsert({
      where: { vin: vData.vin },
      update: {},
      create: {
        ...vehicleFields,
        sellerId,
        images: {
          create: images.map((img, idx) => ({
            url: img.url,
            isPrimary: img.isPrimary,
            sortOrder: idx,
            caption: img.caption
          }))
        },
        inspections: {
          create: {
            inspectorId,
            status: 'COMPLETED',
            overallGrade: 'GRADE_A',
            rating: 9.8,
            mechanicalNotes: 'All drivetrain systems operating within optimal OEM tolerances. Zero leaks or diagnostic fault codes.',
            cosmeticNotes: 'Flawless exterior paint with full frontal PPF installed.',
            completedAt: new Date(),
            damages: {
              create: [
                {
                  location: 'FRONT_BUMPER',
                  damageType: 'STONE_CHIP',
                  severity: 'MINOR',
                  xCoord: 49.50,
                  yCoord: 88.20,
                  notes: 'Microscopic 1mm stone chip on lower front splitter (PPF absorbed impact).'
                }
              ]
            }
          }
        }
      }
    });
    vehicleMap[vData.vin] = vehicle.id;
  }

  // 5. Seed Auctions Across Different Lifecycle States
  console.log('⚡ Seeding Real-Time Auctions & Bidding Histories...');
  const now = new Date();
  const buyer1Id = userMap['buyer1@monacocars.com'];
  const buyer2Id = userMap['buyer2@speedhunters.com'];

  // Auction 1: LIVE GT3 RS
  const porscheVehId = vehicleMap['WP0AF2A99PS187291'];
  const porscheAuction = await prisma.auction.upsert({
    where: { vehicleId: porscheVehId },
    update: {},
    create: {
      vehicleId: porscheVehId,
      startingPrice: 220000,
      reservePrice: 280000,
      reserveMet: true,
      currentHighestBid: 285000,
      minimumIncrement: 2500,
      bidCount: 8,
      bidderCount: 4,
      startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Ends in 4 hours
      originalEndTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      status: 'LIVE',
      bids: {
        create: [
          { bidderId: buyer1Id, amount: 220000, status: 'OUTBID', createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
          { bidderId: buyer2Id, amount: 240000, status: 'OUTBID', createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          { bidderId: buyer1Id, amount: 260000, status: 'OUTBID', createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
          { bidderId: buyer2Id, amount: 280000, status: 'OUTBID', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
          { bidderId: buyer1Id, amount: 285000, status: 'ACTIVE', createdAt: new Date(now.getTime() - 30 * 60 * 1000) }
        ]
      }
    }
  });

  // Auction 2: LIVE Ferrari 488 Pista
  const ferrariVehId = vehicleMap['ZFF83LFA0L0248912'];
  await prisma.auction.upsert({
    where: { vehicleId: ferrariVehId },
    update: {},
    create: {
      vehicleId: ferrariVehId,
      startingPrice: 350000,
      reservePrice: 425000,
      reserveMet: true,
      currentHighestBid: 445000,
      minimumIncrement: 5000,
      bidCount: 14,
      bidderCount: 5,
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 18 * 60 * 60 * 1000), // Ends in 18 hours
      originalEndTime: new Date(now.getTime() + 18 * 60 * 60 * 1000),
      status: 'LIVE',
      bids: {
        create: [
          { bidderId: buyer2Id, amount: 350000, status: 'OUTBID', createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000) },
          { bidderId: buyer1Id, amount: 445000, status: 'ACTIVE', createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) }
        ]
      }
    }
  });

  // Auction 3: EXTENDED AMG GT Black Series (Demonstrating Anti-Sniping Soft Close)
  const amgVehId = vehicleMap['WDD1903791A041890'];
  await prisma.auction.upsert({
    where: { vehicleId: amgVehId },
    update: {},
    create: {
      vehicleId: amgVehId,
      startingPrice: 300000,
      reservePrice: 380000,
      reserveMet: true,
      currentHighestBid: 395000,
      minimumIncrement: 2500,
      bidCount: 19,
      bidderCount: 6,
      startTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 90 * 1000), // 90 seconds left!
      originalEndTime: new Date(now.getTime() - 150 * 1000),
      extensionCount: 2,
      status: 'EXTENDED',
      bids: {
        create: [
          { bidderId: buyer2Id, amount: 395000, status: 'ACTIVE', createdAt: new Date(now.getTime() - 30 * 1000) }
        ]
      }
    }
  });

  // Auction 4: SCHEDULED Ford GT Carbon
  const fordVehId = vehicleMap['1FA6P8CF9K5104291'];
  await prisma.auction.upsert({
    where: { vehicleId: fordVehId },
    update: {},
    create: {
      vehicleId: fordVehId,
      startingPrice: 850000,
      reservePrice: 1000000,
      currentHighestBid: 0,
      minimumIncrement: 10000,
      startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Starts in 2 days
      endTime: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      originalEndTime: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      status: 'SCHEDULED'
    }
  });

  // Auction 5: LIVE BMW M3 CS
  const bmwVehId = vehicleMap['WBS33AY08RFG48190'];
  await prisma.auction.upsert({
    where: { vehicleId: bmwVehId },
    update: {},
    create: {
      vehicleId: bmwVehId,
      startingPrice: 105000,
      reservePrice: 115000,
      reserveMet: true,
      currentHighestBid: 118500,
      minimumIncrement: 1000,
      bidCount: 7,
      bidderCount: 3,
      startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 36 * 60 * 60 * 1000),
      originalEndTime: new Date(now.getTime() + 36 * 60 * 60 * 1000),
      status: 'LIVE',
      bids: {
        create: [
          { bidderId: buyer1Id, amount: 118500, status: 'ACTIVE', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) }
        ]
      }
    }
  });

  // Auction 6: SOLD 1967 Shelby GT500 (Demonstrating Invoicing & Settlement)
  const shelbyVehId = vehicleMap['67400F2A01894'];
  const soldAuction = await prisma.auction.upsert({
    where: { vehicleId: shelbyVehId },
    update: {},
    create: {
      vehicleId: shelbyVehId,
      startingPrice: 150000,
      reservePrice: 200000,
      reserveMet: true,
      currentHighestBid: 220000,
      minimumIncrement: 2500,
      bidCount: 22,
      bidderCount: 7,
      startTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Ended 2 days ago
      originalEndTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: 'SOLD',
      winner: {
        create: {
          winnerId: buyer1Id,
          winningBidAmount: 220000,
          buyerPremium: 5000, // Capped at $5,000 maximum
          totalAmountDue: 225000,
          paymentStatus: 'PAID',
          paymentDueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      bids: {
        create: [
          { bidderId: buyer1Id, amount: 220000, status: 'WON', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }
        ]
      }
    }
  });

  // Invoice for Sold Shelby
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  await prisma.invoice.upsert({
    where: { invoiceNumber: `INV-${todayStr}-SHLBY1` },
    update: {},
    create: {
      invoiceNumber: `INV-${todayStr}-SHLBY1`,
      userId: buyer1Id,
      auctionId: soldAuction.id,
      vehiclePrice: 220000,
      buyerPremium: 5000,
      subtotal: 225000,
      taxAmount: 0,
      totalAmount: 225000,
      status: 'PAID',
      dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      paidAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  });

  console.log('✅ Enterprise Seed Completed Successfully!');
  console.log('──────────────────────────────────────────────────');
  console.log('📋 Default Credentials:');
  console.log('   Super Admin: superadmin@autobidpro.com  / Password123!');
  console.log('   Admin:       admin@autobidpro.com       / Password123!');
  console.log('   Manager:     manager@autobidpro.com     / Password123!');
  console.log('   Inspector:   inspector@autobidpro.com   / Password123!');
  console.log('   Seller:      seller@collectorcars.com   / Password123!');
  console.log('   Buyer:       buyer1@monacocars.com      / Password123!');
  console.log('──────────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seeder encountered fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
