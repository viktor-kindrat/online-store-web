import { OrdersView } from '@/features/orders/orders-view';

export default function OrdersPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Order history</h1>
      <OrdersView />
    </>
  );
}
