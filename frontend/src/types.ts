export type Role = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
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
  averageRating: number;
  ratingCount: number;
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
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
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
