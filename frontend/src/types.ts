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
  imageUrl?: string;
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
  imageUrl?: string;
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
}

export interface OrderLine {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  userId: number;
  status: 'PENDING_SHIPMENT' | 'PENDING_RECEIPT' | 'COMPLETED' | 'AFTER_SALES';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  totalAmount: number;
  shippingAddress: string;
  phoneNumber: string;
  createdAt: string;
  lines: OrderLine[];
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
