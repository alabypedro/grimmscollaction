import p1 from "../assets/product-1.jpg";
import p2 from "../assets/product-2.jpg";
import p3 from "../assets/product-3.jpg";
import p4 from "../assets/product-4.jpg";
import p5 from "../assets/product-5.jpg";
import p6 from "../assets/product-6.jpg";

export type Category =
  | "Miniaturas e Figuras"
  | "Cosplay & Acessórios"
  | "Decoração e Esculturas"
  | "Gadgets e Utilidades"
  | "Peças Funcionais";

export const CATEGORIES: Category[] = [
  "Miniaturas e Figuras",
  "Cosplay & Acessórios",
  "Decoração e Esculturas",
  "Gadgets e Utilidades",
  "Peças Funcionais",
];

export const MATERIALS = ["PLA", "PETG", "ABS", "Resina", "TPU"] as const;
export type Material = (typeof MATERIALS)[number];

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  category: Category;
  material: Material;
  popularity: number;
  image: string;
  gallery: string[];
  description: string;
  specs: { label: string; value: string }[];
  colors: { name: string; hex: string }[];
  featured?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: "guardiao-sombrio",
    name: "Guardião Sombrio — Miniatura Premium",
    price: 189.9,
    rating: 4.9,
    reviews: 142,
    category: "Miniaturas e Figuras",
    material: "Resina",
    popularity: 98,
    image: p1,
    gallery: [p1, p6, p3],
    description:
      "Miniatura colecionável esculpida em alta resolução, impressa em resina premium com acabamento detalhado pintado à mão. Ideal para colecionadores, RPG e dioramas.",
    specs: [
      { label: "Altura", value: "75mm" },
      { label: "Material", value: "Resina UV 8K" },
      { label: "Acabamento", value: "Pintado à mão" },
      { label: "Base inclusa", value: "Sim — 32mm" },
    ],
    colors: [
      { name: "Violeta Sombrio", hex: "#8B00FF" },
      { name: "Preto Obsidiana", hex: "#0A0A0A" },
      { name: "Prata Espectro", hex: "#C0C0C0" },
    ],
    featured: true,
  },
  {
    id: "helm-cyber-vanguard",
    name: "Helm Cyber Vanguard — Cosplay",
    price: 749.0,
    rating: 4.8,
    reviews: 87,
    category: "Cosplay & Acessórios",
    material: "PETG",
    popularity: 92,
    image: p2,
    gallery: [p2, p4, p1],
    description:
      "Capacete cosplay full-scale com sistema modular, LEDs RGB embutidos e visor escurecido. Estrutura leve em PETG reforçado, pronto para vestir.",
    specs: [
      { label: "Tamanho", value: "Ajustável M/L" },
      { label: "Material", value: "PETG + EVA interno" },
      { label: "LED", value: "RGB 5V USB-C" },
      { label: "Peso", value: "820g" },
    ],
    colors: [
      { name: "Magenta Neon", hex: "#C026D3" },
      { name: "Preto Mate", hex: "#0A0A0A" },
    ],
    featured: true,
  },
  {
    id: "orb-hexagonal",
    name: "Orb Hexagonal — Luminária Decorativa",
    price: 259.0,
    rating: 4.9,
    reviews: 213,
    category: "Decoração e Esculturas",
    material: "PLA",
    popularity: 95,
    image: p3,
    gallery: [p3, p5, p6],
    description:
      "Escultura geométrica iluminada por LED âmbar/roxo. Padrão hexagonal preciso, projeta sombras hipnóticas no ambiente.",
    specs: [
      { label: "Diâmetro", value: "18cm" },
      { label: "Material", value: "PLA Premium Matte" },
      { label: "Iluminação", value: "LED RGB Bluetooth" },
      { label: "Alimentação", value: "USB-C 5V" },
    ],
    colors: [
      { name: "Preto Profundo", hex: "#0A0A0A" },
      { name: "Cinza Espacial", hex: "#3A3A3A" },
    ],
    featured: true,
  },
  {
    id: "stand-levitar",
    name: "Stand Levitar — Suporte de Celular",
    price: 129.9,
    rating: 4.7,
    reviews: 318,
    category: "Gadgets e Utilidades",
    material: "ABS",
    popularity: 88,
    image: p4,
    gallery: [p4, p5],
    description:
      "Suporte de celular com base iluminada e ângulo ajustável. Construção sólida em ABS com underglow neon roxo customizável.",
    specs: [
      { label: "Compatibilidade", value: "Todos celulares" },
      { label: "Material", value: "ABS Industrial" },
      { label: "LED", value: "Underglow RGB" },
      { label: "Cabo", value: "USB-C 1.5m" },
    ],
    colors: [
      { name: "Preto Mate", hex: "#0A0A0A" },
      { name: "Branco Polar", hex: "#F5F5F5" },
    ],
    featured: true,
  },
  {
    id: "engrenagem-arcana",
    name: "Engrenagem Arcana — Peça Funcional",
    price: 89.0,
    rating: 4.8,
    reviews: 56,
    category: "Peças Funcionais",
    material: "TPU",
    popularity: 76,
    image: p5,
    gallery: [p5, p3],
    description:
      "Peça funcional de engrenagem com tolerância industrial. Ideal para mecanismos, protótipos e projetos maker de precisão.",
    specs: [
      { label: "Diâmetro", value: "60mm" },
      { label: "Material", value: "TPU 95A" },
      { label: "Tolerância", value: "±0.1mm" },
      { label: "Cor base", value: "Preto / Roxo" },
    ],
    colors: [
      { name: "Preto Industrial", hex: "#0A0A0A" },
      { name: "Violeta", hex: "#8B00FF" },
    ],
  },
  {
    id: "dragao-ametista",
    name: "Dragão Ametista — Colecionável",
    price: 459.0,
    rating: 5.0,
    reviews: 94,
    category: "Miniaturas e Figuras",
    material: "Resina",
    popularity: 99,
    image: p6,
    gallery: [p6, p1, p3],
    description:
      "Estatueta colecionável de dragão articulado, escamas detalhadas e asas membranosas translúcidas. Edição limitada.",
    specs: [
      { label: "Altura", value: "22cm" },
      { label: "Material", value: "Resina Premium" },
      { label: "Edição", value: "Limitada — 500 un." },
      { label: "Certificado", value: "Numerado" },
    ],
    colors: [
      { name: "Ametista", hex: "#8B00FF" },
      { name: "Ônix", hex: "#0A0A0A" },
    ],
    featured: true,
  },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);