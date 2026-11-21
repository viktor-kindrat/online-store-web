import { AdminOrders } from '@/features/admin/admin-orders';

export default function AdminOrdersPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Orders</h1>
      <AdminOrders />
    </>
  );
}
