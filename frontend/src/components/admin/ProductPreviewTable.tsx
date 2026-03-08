import type { ImportProduct } from "@/types/admin";
import { FABRIC_LABELS } from "@/lib/admin/constants";

interface ProductPreviewTableProps {
  products: ImportProduct[];
}

/** Таблица предпросмотра товаров перед импортом */
export function ProductPreviewTable({ products }: ProductPreviewTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Название</th>
            <th className="px-4 py-3">Тип ткани</th>
            <th className="px-4 py-3">Состав</th>
            <th className="px-4 py-3">Ширина</th>
            <th className="px-4 py-3">Цена</th>
            <th className="px-4 py-3">Ед.</th>
            <th className="px-4 py-3">Запас</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((p, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{p.sku}</td>
              <td className="max-w-[200px] truncate px-4 py-2.5 font-medium">
                {p.title}
              </td>
              <td className="px-4 py-2.5">
                <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  {FABRIC_LABELS[p.fabric_type] || p.fabric_type}
                </span>
              </td>
              <td className="max-w-[160px] truncate px-4 py-2.5 text-gray-600">
                {p.composition}
              </td>
              <td className="px-4 py-2.5 text-right">{p.width_cm} см</td>
              <td className="px-4 py-2.5 text-right font-medium">
                {p.price} ₽
              </td>
              <td className="px-4 py-2.5">
                {(p.measurement_unit || "running_meter") === "running_meter"
                  ? "/м"
                  : "/шт"}
              </td>
              <td className="px-4 py-2.5 text-right">{p.inventory ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
