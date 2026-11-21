import { CatalogView } from '@/features/catalog/catalog-view';

export default function HomePage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Products</h1>
      <CatalogView />
    </>
  );
}
