/**
 * High-fidelity initial automobile showcase data for the AutoBid Pro catalog
 */

export const MOCK_VEHICLES = [
  {
    id: 'v-001',
    vin: 'WP0AF2A97MS293812',
    make: 'Porsche',
    model: '911 GT3 RS',
    year: 2023,
    trim: 'Weissach Package',
    mileage: 1840,
    fuelType: 'GASOLINE',
    transmission: 'DUAL_CLUTCH',
    engine: '4.0L Naturally Aspirated Flat-6',
    driveType: 'RWD',
    exteriorColor: 'Shark Blue',
    interiorColor: 'Black Leather / Race-Tex w/ Shark Blue Stitching',
    bodyType: 'COUPE',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    titleStatus: 'CLEAN',
    condition: 'EXCELLENT',
    description: 'Finished in iconic Shark Blue over black leather with Race-Tex upholstery, this 2023 911 GT3 RS is equipped with the $33,520 Weissach Package, carbon-ceramic composite brakes (PCCB), front-axle lift system, magnesium wheels, and LED-Matrix Design headlights in black.',
    highlights: [
      'Weissach Package with Exposed Carbon-Fiber Hood & Roof',
      'Porsche Ceramic Composite Brakes (PCCB)',
      'Front Axle Lift System',
      'Bespoke Magnesium Forged Wheels in Satin Darksilver',
      'Single-Owner, Full Body PPF from New'
    ],
    images: [
      { id: 'img-1', url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80', isFeatured: true, category: 'EXTERIOR' },
      { id: 'img-2', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', isFeatured: false, category: 'EXTERIOR' },
      { id: 'img-3', url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80', isFeatured: false, category: 'INTERIOR' }
    ],
    specifications: {
      horsepower: 518,
      torqueFtLbs: 342,
      displacementLiters: 4.0,
      cylinders: 6,
      curbWeightLbs: 3268
    },
    inspection: {
      overallScore: 9.8,
      verifiedMileage: 1840,
      odometerVerified: true,
      summaryNotes: 'Immaculate specimen. Paint meter readings confirm 100% factory original paint across all carbon panels. Zero mechanical trouble codes.',
      damages: []
    },
    auction: {
      id: 'auc-001',
      status: 'LIVE',
      startingPrice: 220000,
      currentHighestBid: 295000,
      minimumIncrement: 2500,
      bidCount: 28,
      reservePrice: 280000,
      reserveMet: true,
      depositRequired: 500,
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 3 + 1000 * 60 * 42).toISOString() // 3h 42m
    }
  },
  {
    id: 'v-002',
    vin: 'ZFF83CNA6K0249102',
    make: 'Ferrari',
    model: '488 Pista',
    year: 2020,
    trim: 'Carbon Speciale',
    mileage: 3420,
    fuelType: 'GASOLINE',
    transmission: 'DUAL_CLUTCH',
    engine: '3.9L Twin-Turbocharged V8',
    driveType: 'RWD',
    exteriorColor: 'Rosso Corsa',
    interiorColor: 'Nero Alcantara w/ Rosso Accents',
    bodyType: 'COUPE',
    city: 'Miami',
    state: 'FL',
    country: 'USA',
    titleStatus: 'CLEAN',
    condition: 'EXCELLENT',
    description: 'This 2020 Ferrari 488 Pista is powered by a 710-hp 3.9L twin-turbo V8 paired with a 7-speed F1 dual-clutch transmission. Factory options include carbon-fiber wheels, carbon engine bay covers, titanium exhaust pipes, and telemetry system.',
    highlights: [
      '710 Horsepower Twin-Turbo 3.9L V8',
      'Factory Carbon-Fiber Wheels',
      'Rosso Corsa with Two-Tone Racing Livery',
      'Carbon-Fiber Racing Seats in Alcantara'
    ],
    images: [
      { id: 'img-4', url: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=80', isFeatured: true, category: 'EXTERIOR' },
      { id: 'img-5', url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80', isFeatured: false, category: 'EXTERIOR' }
    ],
    specifications: {
      horsepower: 710,
      torqueFtLbs: 568,
      displacementLiters: 3.9,
      cylinders: 8,
      curbWeightLbs: 3053
    },
    inspection: {
      overallScore: 9.6,
      verifiedMileage: 3420,
      odometerVerified: true,
      summaryNotes: 'Fresh annual Ferrari dealer service completed in January. Excellent tire tread depths (7/32 all around).',
      damages: []
    },
    auction: {
      id: 'auc-002',
      status: 'LIVE',
      startingPrice: 350000,
      currentHighestBid: 445000,
      minimumIncrement: 5000,
      bidCount: 34,
      reservePrice: 420000,
      reserveMet: true,
      depositRequired: 500,
      endTime: new Date(Date.now() + 1000 * 60 * 18).toISOString() // 18m remaining (hot auction)
    }
  },
  {
    id: 'v-003',
    vin: 'WBS83AY04MCF92810',
    make: 'BMW',
    model: 'M5 CS',
    year: 2022,
    trim: 'Frozen Deep Green Metallic',
    mileage: 6200,
    fuelType: 'GASOLINE',
    transmission: 'AUTOMATIC',
    engine: '4.4L Twin-Turbocharged V8',
    driveType: 'AWD',
    exteriorColor: 'Frozen Deep Green Metallic',
    interiorColor: 'Black Merino Leather w/ Mugello Red Accents',
    bodyType: 'SEDAN',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    titleStatus: 'CLEAN',
    condition: 'EXCELLENT',
    description: 'Limited production 2022 BMW M5 CS finished in Frozen Deep Green over black leather. Featuring carbon bucket seats, carbon ceramic brakes, bronze gold forged wheels, and yellow racing daytime running lights.',
    highlights: [
      '627 HP Twin-Turbo V8 — Quickest Production BMW',
      'M Carbon Bucket Seats Front & Rear',
      'Gold Bronze Accents & Forged Wheels',
      'M Carbon Ceramic Brakes Standard'
    ],
    images: [
      { id: 'img-6', url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80', isFeatured: true, category: 'EXTERIOR' }
    ],
    specifications: {
      horsepower: 627,
      torqueFtLbs: 553,
      displacementLiters: 4.4,
      cylinders: 8,
      curbWeightLbs: 4114
    },
    inspection: {
      overallScore: 9.7,
      verifiedMileage: 6200,
      odometerVerified: true,
      summaryNotes: 'Original paint protected by ceramic coating. Clean Carfax, zero track usage recorded on telematics.',
      damages: []
    },
    auction: {
      id: 'auc-003',
      status: 'LIVE',
      startingPrice: 110000,
      currentHighestBid: 142000,
      minimumIncrement: 1000,
      bidCount: 19,
      reservePrice: 135000,
      reserveMet: true,
      depositRequired: 500,
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString() // 22 hours
    }
  },
  {
    id: 'v-004',
    vin: '1FA6P8CF9M5501928',
    make: 'Ford',
    model: 'Mustang Shelby GT500',
    year: 2021,
    trim: 'Carbon Fiber Track Pack',
    mileage: 4100,
    fuelType: 'GASOLINE',
    transmission: 'DUAL_CLUTCH',
    engine: '5.2L Supercharged Predator V8',
    driveType: 'RWD',
    exteriorColor: 'Twister Orange',
    interiorColor: 'Ebony Leather Recaro Seats',
    bodyType: 'COUPE',
    city: 'Dallas',
    state: 'TX',
    country: 'USA',
    titleStatus: 'CLEAN',
    condition: 'EXCELLENT',
    description: 'Equipped with the coveted $18,500 Carbon Fiber Track Pack including 20-inch exposed carbon-fiber wheels, GT4 carbon rear wing, front splitter wickers, and Recaro leather bucket seats.',
    highlights: [
      '760 HP Supercharged 5.2L Predator V8',
      'Carbon Fiber Track Pack',
      'Tremec 7-Speed Dual Clutch',
      'MagneRide Damping System'
    ],
    images: [
      { id: 'img-7', url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80', isFeatured: true, category: 'EXTERIOR' }
    ],
    specifications: {
      horsepower: 760,
      torqueFtLbs: 625,
      displacementLiters: 5.2,
      cylinders: 8,
      curbWeightLbs: 4171
    },
    inspection: {
      overallScore: 9.4,
      verifiedMileage: 4100,
      odometerVerified: true,
      summaryNotes: 'Supercharger pulley inspection verified stock. Front splitter in pristine condition with no curbing.',
      damages: []
    },
    auction: {
      id: 'auc-004',
      status: 'LIVE',
      startingPrice: 65000,
      currentHighestBid: 89500,
      minimumIncrement: 500,
      bidCount: 22,
      reservePrice: 85000,
      reserveMet: true,
      depositRequired: 500,
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString() // 2 days
    }
  }
];
