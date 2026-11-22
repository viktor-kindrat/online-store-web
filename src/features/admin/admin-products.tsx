'use client';

import { Archive, ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api/client';
import { TableRowsSkeleton } from '@/components/ui/skeleton';
import type {
  Category,
  Paginated,
  Product,
  ProductDetail,
  ProductStatus,
} from '@/lib/api/types';
import { mediaUrl } from '@/lib/utils/media';
import { formatMinor } from '@/lib/utils/money';
import { messageOf } from './use-async-message';
import { RichTextEditor } from './rich-text-editor';

interface AttributeRow {
  name: string;
  value: string;
}

const MAX_ATTRIBUTES = 50;
const PRODUCT_STATUSES: readonly ProductStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

function readCsrfCookie(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const entry = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='));
  return entry?.slice('csrf_token='.length);
}

async function ensureCsrf(): Promise<string | undefined> {
  const existing = readCsrfCookie();
  if (existing) {
    return existing;
  }
  try {
    const response = await fetch(`${API_BASE}/auth/csrf`, {
      credentials: 'include',
    });
    const data = (await response.json()) as { csrfToken?: string };
    return data.csrfToken;
  } catch {
    return undefined;
  }
}

async function uploadProductImage(
  productId: string,
  file: File,
): Promise<void> {
  const csrf = await ensureCsrf();
  const form = new FormData();
  form.append('file', file);
  const headers: Record<string, string> = {};
  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }
  const response = await fetch(`${API_BASE}/admin/products/${productId}/images`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: form,
  });
  if (!response.ok) {
    throw new Error('Image upload failed');
  }
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceMinor, setPriceMinor] = useState('0');
  const [status, setStatus] = useState<ProductStatus>('ACTIVE');
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingId !== null;

  function selectImage(file: File | null): void {
    setImagePreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return file ? URL.createObjectURL(file) : null;
    });
    setImageFile(file);
  }

  function resetForm(): void {
    setEditingId(null);
    setName('');
    setDescription('');
    setPriceMinor('0');
    setStatus('ACTIVE');
    setAttributes([]);
    setCategoryId(categories[0]?.id ?? '');
    setExistingImageUrl(null);
    selectImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function reload(): Promise<void> {
    try {
      const [page, loadedCategories] = await Promise.all([
        api.get<Paginated<Product>>('/products?page=1&limit=100'),
        api.get<Category[]>('/categories'),
      ]);
      setProducts(page.items);
      setCategories(loadedCategories);
      if (!categoryId && loadedCategories[0]) {
        setCategoryId(loadedCategories[0].id);
      }
    } catch (cause) {
      setError(messageOf(cause, 'Failed to load products'));
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<Paginated<Product>>('/products?page=1&limit=100'),
      api.get<Category[]>('/categories'),
    ])
      .then(([page, loadedCategories]) => {
        if (!active) {
          return;
        }
        setProducts(page.items);
        setCategories(loadedCategories);
        if (loadedCategories[0]) {
          setCategoryId(loadedCategories[0].id);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(messageOf(cause, 'Failed to load products'));
        }
      })
      .finally(() => {
        if (active) {
          setProductsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function updateAttribute(
    index: number,
    field: keyof AttributeRow,
    next: string,
  ): void {
    setAttributes((current) =>
      current.map((row, i) => (i === index ? { ...row, [field]: next } : row)),
    );
  }

  function addAttribute(): void {
    setAttributes((current) =>
      current.length >= MAX_ATTRIBUTES
        ? current
        : [...current, { name: '', value: '' }],
    );
  }

  function removeAttribute(index: number): void {
    setAttributes((current) => current.filter((_, i) => i !== index));
  }

  async function startEdit(product: Product): Promise<void> {
    setError(null);
    setEditingId(product.id);
    setCategoryId(product.categoryId);
    setName(product.name);
    setDescription(product.description);
    setPriceMinor(String(product.priceMinor));
    setStatus(product.status);
    setExistingImageUrl(mediaUrl(product.primaryImageUrl));
    setAttributes([]);
    selectImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    try {
      const detail = await api.get<ProductDetail>(`/products/${product.id}`);
      setAttributes(
        detail.attributes.map((row) => ({ name: row.name, value: row.value })),
      );
    } catch {
      /* keep basic fields; attributes stay empty */
    }
  }

  async function submit(): Promise<void> {
    setError(null);
    if (!isEditing && !imageFile) {
      setError('Product image is required.');
      return;
    }
    const cleanedAttributes = attributes
      .map((row) => ({ name: row.name.trim(), value: row.value.trim() }))
      .filter((row) => row.name.length > 0 && row.value.length > 0);
    setSubmitting(true);
    try {
      if (isEditing && editingId) {
        await api.patch<Product>(`/admin/products/${editingId}`, {
          categoryId,
          name,
          description,
          priceMinor: Number(priceMinor),
          status,
          attributes: cleanedAttributes,
        });
        if (imageFile) {
          await uploadProductImage(editingId, imageFile);
        }
      } else {
        const body: {
          categoryId: string;
          name: string;
          description: string;
          priceMinor: number;
          attributes?: AttributeRow[];
        } = {
          categoryId,
          name,
          description,
          priceMinor: Number(priceMinor),
        };
        if (cleanedAttributes.length > 0) {
          body.attributes = cleanedAttributes;
        }
        const product = await api.post<Product>('/admin/products', body);
        await uploadProductImage(product.id, imageFile as File);
      }
      resetForm();
      await reload();
    } catch (cause) {
      setError(
        messageOf(
          cause,
          isEditing ? 'Failed to update product' : 'Failed to create product',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function archive(id: string): Promise<void> {
    setError(null);
    try {
      await api.del<void>(`/admin/products/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await reload();
    } catch (cause) {
      setError(messageOf(cause, 'Failed to archive product'));
    }
  }

  const preview = imagePreview ?? existingImageUrl;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">
            {isEditing ? 'Edit product' : 'New product'}
          </h2>
          {isEditing ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              <X className="size-4" aria-hidden />
              Cancel
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-label="Category"
            className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Name"
            value={name}
            maxLength={200}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
          />
          <input
            type="number"
            min={0}
            placeholder="Price (minor)"
            value={priceMinor}
            onChange={(event) => setPriceMinor(event.target.value)}
            className="w-36 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
          />
          {isEditing ? (
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ProductStatus)
              }
              aria-label="Status"
              className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
            >
              {PRODUCT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-black/60 dark:text-white/60">
            Description
          </span>
          <RichTextEditor value={description} onChange={setDescription} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-black/60 dark:text-white/60">
              Characteristics
            </span>
            <button
              type="button"
              onClick={addAttribute}
              disabled={attributes.length >= MAX_ATTRIBUTES}
              className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1 text-sm hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
            >
              <Plus className="size-4" aria-hidden />
              Add characteristic
            </button>
          </div>
          {attributes.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                placeholder="Name"
                value={row.name}
                maxLength={100}
                onChange={(event) =>
                  updateAttribute(index, 'name', event.target.value)
                }
                className="w-48 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
              />
              <input
                placeholder="Value"
                value={row.value}
                maxLength={500}
                onChange={(event) =>
                  updateAttribute(index, 'value', event.target.value)
                }
                className="flex-1 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
              />
              <button
                type="button"
                onClick={() => removeAttribute(index)}
                aria-label="Remove characteristic"
                title="Remove characteristic"
                className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
              >
                <Trash2 className="size-4" aria-hidden />
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-black/60 dark:text-white/60">
            Product image{' '}
            {isEditing ? null : <span className="text-red-600">*</span>}
          </span>
          <div className="flex items-center gap-4">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                className="h-20 w-20 rounded-md border border-black/10 object-cover dark:border-white/15"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-black/20 text-black/30 dark:border-white/25 dark:text-white/30">
                <ImagePlus className="size-6" aria-hidden />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              <ImagePlus className="size-4" aria-hidden />
              {imageFile || isEditing ? 'Change image' : 'Choose image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) =>
                selectImage(event.target.files?.[0] ?? null)
              }
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={(!isEditing && !imageFile) || submitting}
          className="inline-flex w-fit items-center gap-2 rounded-md bg-foreground px-4 py-2 text-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEditing ? (
            <Save className="size-4" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          {submitting
            ? isEditing
              ? 'Saving…'
              : 'Creating…'
            : isEditing
              ? 'Save'
              : 'Create'}
        </button>
      </div>

      {error ? <p className="text-red-600">{error}</p> : null}
      {productsLoading ? (
        <TableRowsSkeleton rows={5} cols={4} />
      ) : (
      <table className="w-full text-left text-sm">
        <thead className="text-black/60 dark:text-white/60">
          <tr>
            <th className="py-2">Name</th>
            <th>Price</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10 dark:divide-white/15">
          {products.map((product) => (
            <tr
              key={product.id}
              className={editingId === product.id ? 'bg-black/5 dark:bg-white/10' : ''}
            >
              <td className="py-2">{product.name}</td>
              <td>{formatMinor(product.priceMinor)}</td>
              <td>{product.status}</td>
              <td className="text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => void startEdit(product)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                  >
                    <Pencil className="size-4" aria-hidden />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void archive(product.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                  >
                    <Archive className="size-4" aria-hidden />
                    Archive
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </section>
  );
}
