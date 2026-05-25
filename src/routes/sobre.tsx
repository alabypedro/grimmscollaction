import { createFileRoute } from "@tanstack/react-router";
import { Award, Layers, Users } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Grimm's Collection" },
      { name: "description", content: "Conheça a história, a filosofia e o processo artesanal da Grimm's Collection." },
      { property: "og:title", content: "Sobre a Grimm's Collection" },
      { property: "og:description", content: "Impressão 3D premium, obsessão pelo detalhe." },
      { property: "og:url", content: "https://grimmscollaction.lovable.app/sobre" },
    ],
    links: [
      { rel: "canonical", href: "https://grimmscollaction.lovable.app/sobre" },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <p className="text-xs tracking-[0.3em] text-primary font-bold mb-3">NOSSA HISTÓRIA</p>
        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
          Onde a <span className="text-gradient">precisão</span> encontra a <span className="text-gradient">obsessão</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          A Grimm's Collection nasceu em 2022, do desejo obstinado de transformar arquivos digitais em objetos que pareçam ter sido esculpidos por séculos. Hoje somos um estúdio dedicado à impressão 3D premium — peça por peça, camada por camada.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-20">
        {[
          { I: Layers, t: "Tecnologia 8K", d: "Impressoras de resina LCD 8K e FDM industriais para texturas de altíssima fidelidade." },
          { I: Award, t: "Curadoria rígida", d: "Cada peça aprovada passa por inspeção manual em três etapas antes de ser embalada." },
          { I: Users, t: "Comunidade global", d: "Milhares de colecionadores, cosplayers e arquitetos confiam no nosso acabamento." },
        ].map(({ I, t, d }) => (
          <div key={t} className="p-8 rounded-xl border border-border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/15 grid place-items-center mb-4">
              <I className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-bold text-lg mb-2">{t}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-black mb-6">Nossa filosofia</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>Acreditamos que objetos têm alma. Que uma miniatura bem impressa carrega mais história do que um catálogo inteiro. Que cosplay é arte vestível. Que decoração é identidade.</p>
            <p>Por isso recusamos atalhos. Trabalhamos com fornecedores premium, pintamos à mão sempre que possível e tratamos cada pedido como se fosse o nosso primeiro.</p>
            <p className="text-foreground font-medium">Impresso com paixão. Esculpido em sombras.</p>
          </div>
        </div>
        <div className="relative aspect-square rounded-2xl overflow-hidden border border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-background" />
          <div className="absolute inset-0 grid place-items-center">
            <p className="text-[120px] font-black text-gradient leading-none">G.</p>
          </div>
        </div>
      </div>
    </div>
  );
}