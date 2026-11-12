/**
 * AutoBid Pro — Platform Constants & Business Rules Configuration (Pure JavaScript ESM)
 */

export const ROLES = {
  GUEST: 'GUEST',
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  DEALER: 'DEALER',
  AUCTION_MANAGER: 'AUCTION_MANAGER',
  INSPECTOR: 'INSPECTOR',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  FINANCE_MANAGER: 'FINANCE_MANAGER',
  MODERATOR: 'MODERATOR',
  ADMINISTRATOR: 'ADMINISTRATOR',
  SUPER_ADMINISTRATOR: 'SUPER_ADMINISTRATOR'
};

export const PERMISSIONS = {
  // Users
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_SUSPEND: 'users.suspend',
  USERS_DELETE: 'users.delete',
  USERS_ROLE_ASSIGN: 'users.role_assign',

  // Vehicles
  VEHICLES_CREATE: 'vehicles.create',
  VEHICLES_READ: 'vehicles.read',
  VEHICLES_UPDATE: 'vehicles.update',
  VEHICLES_DELETE: 'vehicles.delete',
  VEHICLES_SUBMIT: 'vehicles.submit',
  VEHICLES_APPROVE: 'vehicles.approve',
  VEHICLES_REJECT: 'vehicles.reject',

  // Auctions
  AUCTIONS_CREATE: 'auctions.create',
  AUCTIONS_UPDATE: 'auctions.update',
  AUCTIONS_START: 'auctions.start',
  AUCTIONS_PAUSE: 'auctions.pause',
  AUCTIONS_EXTEND: 'auctions.extend',
  AUCTIONS_CANCEL: 'auctions.cancel',
  AUCTIONS_STOP: 'auctions.stop',

  // Bids
  BIDS_CREATE: 'bids.create',
  BIDS_READ: 'bids.read',
  BIDS_CANCEL: 'bids.cancel',

  // Inspections
  INSPECTIONS_ASSIGN: 'inspections.assign',
  INSPECTIONS_SUBMIT: 'inspections.submit',
  INSPECTIONS_REVIEW: 'inspections.review',

  // Payments & Finance
  PAYMENTS_READ: 'payments.read',
  PAYMENTS_PROCESS: 'payments.process',
  REFUNDS_CREATE: 'refunds.create',
  PAYOUTS_PROCESS: 'payouts.process',

  // Governance & System
  REPORTS_READ: 'reports.read',
  REPORTS_RESOLVE: 'reports.resolve',
  AUDIT_LOGS_READ: 'audit_logs.read',
  SETTINGS_UPDATE: 'settings.update',
  FEATURE_FLAGS_MANAGE: 'feature_flags.manage'
};

export const VEHICLE_STATUSES = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  INSPECTION: 'INSPECTION',
  APPROVED: 'APPROVED',
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  SOLD: 'SOLD',
  UNSOLD: 'UNSOLD',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED'
};

export const AUCTION_STATUSES = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  EXTENDED: 'EXTENDED',
  ENDED: 'ENDED',
  SOLD: 'SOLD',
  UNSOLD: 'UNSOLD',
  CANCELLED: 'CANCELLED'
};

export const BID_STATUSES = {
  ACTIVE: 'ACTIVE',
  OUTBID: 'OUTBID',
  WINNING: 'WINNING',
  WON: 'WON',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED'
};

/**
 * Standard dynamic bid increment ladders
 */
export const DEFAULT_BID_INCREMENT_TIERS = [
  { fromPrice: 0, toPrice: 2499.99, increment: 50 },
  { fromPrice: 2500, toPrice: 9999.99, increment: 100 },
  { fromPrice: 10000, toPrice: 49999.99, increment: 250 },
  { fromPrice: 50000, toPrice: 99999.99, increment: 500 },
  { fromPrice: 100000, toPrice: 249999.99, increment: 1000 },
  { fromPrice: 250000, toPrice: Infinity, increment: 2500 }
];

/**
 * Calculates required minimum bid increment based on current highest bid
 * @param {number|string} currentBid 
 * @returns {number}
 */
export function getMinimumIncrement(currentBid) {
  const bid = Number(currentBid) || 0;
  const tier = DEFAULT_BID_INCREMENT_TIERS.find(t => bid >= t.fromPrice && bid <= t.toPrice);
  return tier ? tier.increment : 250;
}

/**
 * Fee structure defaults
 */
export const FEE_SCHEDULE = {
  BUYER_PREMIUM_PERCENTAGE: 0.05, // 5% buyer's premium
  BUYER_PREMIUM_MIN_FEE: 500,     // $500 minimum
  BUYER_PREMIUM_MAX_FEE: 5000,    // $5,000 maximum cap
  SELLER_LISTING_FEE: 99,         // $99 standard listing fee
  DEFAULT_DEPOSIT_HOLD: 500       // $500 flat pre-auth hold
};

/**
 * Anti-Sniping defaults
 */
export const ANTI_SNIPING_DEFAULTS = {
  WINDOW_SECONDS: 120,    // Triggers if bid placed within last 2 minutes
  EXTENSION_SECONDS: 120, // Extends clock by 2 minutes
  MAX_EXTENSIONS: 10      // Max 10 extensions (20 mins max total extension)
};
