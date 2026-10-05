export enum UserRole {
  SuperAdmin = 1,
  Admin = 2,
  Operator = 3,
  Customer = 4
}

export enum ProductType {
  Mobile = 1,
  Tablet = 2,
  Accessory = 3
}

export enum OrderStatus {
  Draft = 1,
  Pending = 2,
  Confirmed = 3,
  Packed = 4,
  Shipped = 5,
  Delivered = 6,
  Cancelled = 7,
  Returned = 8
}

export enum PaymentStatus {
  Pending = 1,
  Authorized = 2,
  Paid = 3,
  Failed = 4,
  Refunded = 5
}

export enum PurchaseOrderStatus {
  Draft = 1,
  Ordered = 2,
  PartiallyReceived = 3,
  Received = 4,
  Cancelled = 5
}

export enum RepairTicketStatus {
  Received = 1,
  Diagnosing = 2,
  WaitingForParts = 3,
  InRepair = 4,
  ReadyForPickup = 5,
  Delivered = 6,
  Cancelled = 7
}

export enum ReturnStatus {
  Requested = 1,
  Approved = 2,
  Rejected = 3,
  Completed = 4
}

export enum StockTransactionType {
  OpeningBalance = 1,
  Purchase = 2,
  Sale = 3,
  ReturnIn = 4,
  ReturnOut = 5,
  Adjustment = 6
}

export enum AddressType {
  Primary = 1,
  Billing = 2,
  Shipping = 3
}

export enum NotificationType {
  OrderCreated = 1,
  OrderConfirmed = 2,
  OrderShipped = 3,
  OrderDelivered = 4,
  PaymentReceived = 5,
  PaymentFailed = 6,
  LowStockAlert = 7,
  PurchaseOrderCreated = 8,
  RepairStatusUpdate = 9,
  ReviewApproved = 10,
  PriceAlert = 11,
  WishlistItemAvailable = 12,
  LoyaltyPointsEarned = 13,
  PromotionAvailable = 14,
  GeneralAlert = 15
}

export enum LoyaltyTier {
  Bronze = 1,
  Silver = 2,
  Gold = 3,
  Platinum = 4
}

export type RoleName = 'SuperAdmin' | 'Admin' | 'Operator' | 'Customer';

export const roleNames: Record<UserRole, RoleName> = {
  [UserRole.SuperAdmin]: 'SuperAdmin',
  [UserRole.Admin]: 'Admin',
  [UserRole.Operator]: 'Operator',
  [UserRole.Customer]: 'Customer'
};

export const roleValues: Record<RoleName, UserRole> = {
  SuperAdmin: UserRole.SuperAdmin,
  Admin: UserRole.Admin,
  Operator: UserRole.Operator,
  Customer: UserRole.Customer
};

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface QueryParameters {
  search?: string;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface AuthResponse {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole | RoleName;
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  alternatePhoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  password: string;
  billingAddressLine1: string;
  shippingAddressLine1: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface LookupDto {
  id: string;
  name: string;
  description?: string | null;
}

export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  productType: ProductType;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  price: number;
  costPrice: number;
  taxPercentage: number;
  discountAmount: number;
  promoCode?: string | null;
  quantityOnHand: number;
  reorderLevel: number;
}

export interface CustomerDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  alternatePhoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  addresses: AddressDto[];
}

export interface AddressDto {
  type: AddressType;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface SupplierDto {
  id: string;
  name: string;
  contactPerson?: string | null;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  taxRegistrationNumber?: string | null;
  isActive: boolean;
}

export interface InventoryStockDto {
  productId: string;
  productName: string;
  sku: string;
  quantityOnHand: number;
  reservedQuantity: number;
  reorderLevel: number;
}

export interface StockTransactionDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  transactionType: StockTransactionType;
  quantity: number;
  reason: string;
  createdAtUtc: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  taxAmount: number;
  discountAmount: number;
  status: OrderStatus;
  createdAtUtc: string;
}

export interface PaymentDto {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  transactionReference?: string | null;
  createdAtUtc: string;
}

export interface InvoiceDto {
  id: string;
  orderId: string;
  invoiceNumber: string;
  issuedAtUtc: string;
}

export interface BillItemDto {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface BillDto {
  id: string;
  billNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  issuedAtUtc: string;
  dueAtUtc: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  balanceDue: number;
  notes?: string | null;
  status: number | string;
  statusText: string;
  shippingAddress?: AddressDto | null;
  deliveryAddress?: AddressDto | null;
  items: BillItemDto[];
}

export interface ReturnRequestDto {
  id: string;
  orderId: string;
  reason: string;
  status: ReturnStatus;
  refundAmount: number;
  createdAtUtc: string;
}

export interface PurchaseOrderItemDto {
  productId: string;
  productName: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  taxPercentage: number;
  lineTotal: number;
}

export interface PurchaseOrderDto {
  id: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  expectedAtUtc?: string | null;
  receivedAtUtc?: string | null;
  status: PurchaseOrderStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  createdAtUtc: string;
  items: PurchaseOrderItemDto[];
}

export interface RepairTicketDto {
  id: string;
  ticketNumber: string;
  customerProfileId?: string | null;
  customerName: string;
  phoneNumber: string;
  deviceBrand: string;
  deviceModel: string;
  imeiOrSerialNumber?: string | null;
  problemDescription: string;
  technicianNotes?: string | null;
  estimatedCost: number;
  advanceAmount: number;
  finalAmount: number;
  status: RepairTicketStatus;
  expectedDeliveryUtc?: string | null;
  completedAtUtc?: string | null;
  createdAtUtc: string;
}

export interface ExpenseDto {
  id: string;
  expenseDateUtc: string;
  category: string;
  amount: number;
  paymentMethod: string;
  paidTo?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface TaxRuleDto {
  id: string;
  name: string;
  percentage: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface PromoCodeDto {
  id: string;
  code: string;
  discountAmount: number;
  discountPercentage?: number | null;
  validFromUtc: string;
  validToUtc: string;
  isActive: boolean;
}

export interface AppSettingDto {
  id: string;
  key: string;
  value: string;
  description?: string | null;
}

export interface AdminUserDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
}

export interface DashboardSummaryDto {
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  pendingPurchaseOrders: number;
  openRepairTickets: number;
  lowStockProducts: number;
  todaySales: number;
  todayExpenses: number;
  todayProfit: number;
  monthlySales: number;
}

export interface SalesReportItemDto {
  label: string;
  ordersCount: number;
  salesAmount: number;
}

export interface ExpenseReportItemDto {
  category: string;
  count: number;
  totalAmount: number;
}

export interface StockReportItemDto {
  productName: string;
  sku: string;
  quantityOnHand: number;
  reorderLevel: number;
}

export interface DailyCashSummaryDto {
  dateUtc: string;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  otherSales: number;
  expenses: number;
  netCashFlow: number;
  paymentsCount: number;
}

export interface ProfitLossReportDto {
  fromUtc?: string | null;
  toUtc?: string | null;
  ordersCount: number;
  salesTotal: number;
  taxCollected: number;
  discounts: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface AuditLogDto {
  id: string;
  entityName: string;
  action: string;
  performedBy: string;
  payload?: string | null;
  createdAtUtc: string;
}

export interface WeatherForecastDto {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary?: string | null;
}

// New Feature DTOs
export interface ProductReviewDto {
  id: string;
  productId: string;
  productName: string;
  customerProfileId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  isApproved: boolean;
  imageUrls?: string[];
  createdAtUtc: string;
}

export interface ReviewSummaryDto {
  averageRating: number;
  totalReviews: number;
  verifiedPurchaseCount: number;
  ratingDistribution: Record<number, number>;
}

export interface WishlistItemDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentPrice: number;
  priceWhenAdded: number;
  notifyAtPrice?: number | null;
  shouldNotifyOnPriceChange: boolean;
  viewCount: number;
  lastViewedUtc?: string | null;
  addedAtUtc: string;
  isPriceDropped: boolean;
}

export interface WishlistSummaryDto {
  totalItems: number;
  totalValue: number;
  itemsWithPriceDrop: number;
}

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAtUtc: string;
  readAtUtc?: string | null;
}

export interface NotificationSummaryDto {
  totalUnread: number;
  totalNotifications: number;
  notificationsByType: Record<NotificationType, number>;
}

export interface LoyaltyAccountDto {
  id: string;
  customerProfileId: string;
  currentPoints: number;
  tier: LoyaltyTier;
  tierMultiplier: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  joinedUtc: string;
  isActive: boolean;
}

export interface LoyaltyTransactionDto {
  id: string;
  transactionType: string;
  pointsAmount: number;
  description: string;
  createdAtUtc: string;
}

export interface LoyaltyTierProgressDto {
  currentTier: LoyaltyTier;
  currentPoints: number;
  pointsForNextTier: number;
  pointsProgressPercentage: number;
  nextTier?: LoyaltyTier | null;
}

export interface LoyaltyBenefitsDto {
  tier: LoyaltyTier;
  pointsMultiplier: number;
  discountPercentage: number;
  description: string;
  pointsRequiredForUpgrade: number;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title: string;
  comment: string;
  imageUrls?: string[];
}

export interface SearchFilterOptionsDto {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  priceRange: { min: number; max: number };
}

export interface SelectOption<T = string | number | boolean> {
  label: string;
  value: T;
}

export function roleName(value: UserRole | RoleName | number | string | null | undefined): RoleName {
  if (typeof value === 'string') {
    if (value in roleValues) {
      return value as RoleName;
    }

    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric in roleNames) {
      return roleNames[numeric as UserRole];
    }
  }

  if (typeof value === 'number' && value in roleNames) {
    return roleNames[value as UserRole];
  }

  return 'Customer';
}

export const productTypeOptions: SelectOption<ProductType>[] = [
  { label: 'Mobile', value: ProductType.Mobile },
  { label: 'Tablet', value: ProductType.Tablet },
  { label: 'Accessory', value: ProductType.Accessory }
];

export const orderStatusOptions: SelectOption<OrderStatus>[] = [
  { label: 'Draft', value: OrderStatus.Draft },
  { label: 'Pending', value: OrderStatus.Pending },
  { label: 'Confirmed', value: OrderStatus.Confirmed },
  { label: 'Packed', value: OrderStatus.Packed },
  { label: 'Shipped', value: OrderStatus.Shipped },
  { label: 'Delivered', value: OrderStatus.Delivered },
  { label: 'Cancelled', value: OrderStatus.Cancelled },
  { label: 'Returned', value: OrderStatus.Returned }
];

export const paymentStatusOptions: SelectOption<PaymentStatus>[] = [
  { label: 'Pending', value: PaymentStatus.Pending },
  { label: 'Authorized', value: PaymentStatus.Authorized },
  { label: 'Paid', value: PaymentStatus.Paid },
  { label: 'Failed', value: PaymentStatus.Failed },
  { label: 'Refunded', value: PaymentStatus.Refunded }
];

export const purchaseOrderStatusOptions: SelectOption<PurchaseOrderStatus>[] = [
  { label: 'Draft', value: PurchaseOrderStatus.Draft },
  { label: 'Ordered', value: PurchaseOrderStatus.Ordered },
  { label: 'Partially received', value: PurchaseOrderStatus.PartiallyReceived },
  { label: 'Received', value: PurchaseOrderStatus.Received },
  { label: 'Cancelled', value: PurchaseOrderStatus.Cancelled }
];

export const repairStatusOptions: SelectOption<RepairTicketStatus>[] = [
  { label: 'Received', value: RepairTicketStatus.Received },
  { label: 'Diagnosing', value: RepairTicketStatus.Diagnosing },
  { label: 'Waiting for parts', value: RepairTicketStatus.WaitingForParts },
  { label: 'In repair', value: RepairTicketStatus.InRepair },
  { label: 'Ready for pickup', value: RepairTicketStatus.ReadyForPickup },
  { label: 'Delivered', value: RepairTicketStatus.Delivered },
  { label: 'Cancelled', value: RepairTicketStatus.Cancelled }
];

export const returnStatusOptions: SelectOption<ReturnStatus>[] = [
  { label: 'Requested', value: ReturnStatus.Requested },
  { label: 'Approved', value: ReturnStatus.Approved },
  { label: 'Rejected', value: ReturnStatus.Rejected },
  { label: 'Completed', value: ReturnStatus.Completed }
];

export const roleOptions: SelectOption<UserRole>[] = [
  { label: 'Super admin', value: UserRole.SuperAdmin },
  { label: 'Admin', value: UserRole.Admin },
  { label: 'Operator', value: UserRole.Operator },
  { label: 'Customer', value: UserRole.Customer }
];

export function optionLabel<T extends string | number | boolean>(options: SelectOption<T>[], value: T | null | undefined): string {
  return options.find((option) => option.value === value)?.label ?? String(value ?? '');
}
