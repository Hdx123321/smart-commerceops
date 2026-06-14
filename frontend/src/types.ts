export type Role = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: Role;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  shoeSize?: number;
  shippingAddress?: string;
  phoneNumber?: string;
  paymentMethod?: string;
  merchantId?: number;
  merchantName?: string;
  merchantDescription?: string;
  merchantContact?: string;
  merchantAddress?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export interface UpdateProfileRequest {
  username: string;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  shoeSize?: number;
  shippingAddress?: string;
  phoneNumber?: string;
  paymentMethod?: string;
  merchantName?: string;
  merchantDescription?: string;
  merchantContact?: string;
  merchantAddress?: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  salesCount: number;
  active: boolean;
  imageUrls?: string[];
  merchantId?: number;
  merchantName: string;
  merchantDescription?: string;
  merchantContact?: string;
  averageRating: number;
  ratingCount: number;
}

export interface ProductRequest {
  name: string;
  category: string;
  customCategory?: string;
  description?: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  active?: boolean;
  imageUrls?: string[];
  merchantId?: number;
  merchantName?: string;
  merchantDescription?: string;
  merchantContact?: string;
}

export interface ProductReview {
  id: number;
  productId: number;
  userId: number;
  username: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ProductReviewRequest {
  userId: number;
  username: string;
  rating: number;
  comment?: string;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  imageUrls?: string[];
  merchantId?: number;
  merchantName: string;
}

export interface OrderLine {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrls?: string[];
  merchantId?: number;
  merchantName: string;
}

export type AfterSalesType = 'RETURN' | 'EXCHANGE' | 'REFUND_ONLY' | 'CONTACT_MERCHANT';
export type AfterSalesStatus = 'PENDING_MERCHANT' | 'MERCHANT_REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: number;
  userId: number;
  merchantId?: number;
  merchantName: string;
  status: 'PENDING_SHIPMENT' | 'PENDING_RECEIPT' | 'COMPLETED' | 'AFTER_SALES';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  totalAmount: number;
  shippingAddress: string;
  phoneNumber: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  latestAfterSalesCaseId?: number;
  latestAfterSalesType?: AfterSalesType;
  latestAfterSalesStatus?: AfterSalesStatus;
  lines: OrderLine[];
}

export interface AfterSalesCase {
  id: number;
  orderId: number;
  userId: number;
  merchantId?: number;
  merchantName: string;
  type: AfterSalesType;
  status: AfterSalesStatus;
  reason: string;
  description?: string;
  contactMethod?: string;
  merchantNote?: string;
  orderTotalAmount: number;
  shippingAddress: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
  lines: OrderLine[];
}

export interface AfterSalesRequest {
  userId: number;
  type: AfterSalesType;
  reason: string;
  description?: string;
  contactMethod?: string;
}

export type ConversationContextType = 'PRODUCT' | 'ORDER' | 'AFTER_SALES' | 'GENERAL';
export type SenderRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface Conversation {
  id: number;
  customerId: number;
  merchantId: number;
  merchantName: string;
  contextType: ConversationContextType;
  contextId?: number;
  contextTitle?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderRole: SenderRole;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface CreateConversationRequest {
  customerId: number;
  merchantId: number;
  merchantName: string;
  contextType: ConversationContextType;
  contextId?: number;
  contextTitle?: string;
}

export interface SendMessageRequest {
  senderId: number;
  senderRole: SenderRole;
  senderName: string;
  content: string;
}

export interface InventoryRecommendation {
  productId: number;
  productName: string;
  stockQuantity: number;
  lowStockThreshold: number;
  recommendedRestock: number;
}

export interface DashboardSummary {
  gmv: number;
  orderCount: number;
  averageOrderValue: number;
  lowStockCount: number;
  topProducts: Array<{ productId: number; name: string; salesCount: number; averageRating: number }>;
  inventoryRecommendations: InventoryRecommendation[];
}
