export interface ShippingOption {
  id: number;
  name: string;
  company: string;
  price: number;
  currency: string;
  delivery_time: number;
  delivery_range: { min: number; max: number };
  error?: string | null;
}

export interface ShippingParams {
  from_cep: string;
  to_cep: string;
  weight_kg: number;
  height_cm: number;
  width_cm: number;
  length_cm: number;
}

const MELHOR_ENVIO_API = "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate";
const TOKEN = typeof import.meta !== "undefined" ? (import.meta.env?.VITE_MELHOR_ENVIO_TOKEN ?? "") : "";
const ORIGIN_CEP = typeof import.meta !== "undefined" ? (import.meta.env?.VITE_ORIGIN_CEP ?? "01310-100") : "01310-100";

export async function calculateShipping(params: ShippingParams): Promise<ShippingOption[]> {
  if (!TOKEN) {
    return [
      { id: 1, name: "PAC", company: "Correios", price: 18.90, currency: "BRL", delivery_time: 7, delivery_range: { min: 5, max: 9 } },
      { id: 2, name: "SEDEX", company: "Correios", price: 32.50, currency: "BRL", delivery_time: 3, delivery_range: { min: 2, max: 4 } },
    ];
  }

  const body = {
    from: { postal_code: params.from_cep.replace(/\D/g, "") },
    to: { postal_code: params.to_cep.replace(/\D/g, "") },
    package: {
      height: params.height_cm,
      width: params.width_cm,
      length: params.length_cm,
      weight: params.weight_kg,
    },
    options: { receipt: false, own_hand: false },
    services: "1,2,17",
  };

  const resp = await fetch(MELHOR_ENVIO_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "GrimmsCollection/1.0 (pedroalaby@gmail.com)",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error("Erro ao calcular frete");

  const data: any[] = await resp.json();

  return data
    .filter((s) => !s.error)
    .map((s) => ({
      id: s.id,
      name: s.name,
      company: s.company.name,
      price: parseFloat(s.price),
      currency: s.currency,
      delivery_time: s.delivery_time,
      delivery_range: s.delivery_range ?? { min: s.delivery_time, max: s.delivery_time + 2 },
    }));
}

export function estimatePackage(items: { qty: number }[]) {
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  return {
    weight_kg: Math.max(0.3, totalItems * 0.2),
    height_cm: 15,
    width_cm: 20,
    length_cm: 30,
  };
}

export const ORIGIN_CEP_VALUE = ORIGIN_CEP;
