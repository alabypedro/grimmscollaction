import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Grimm's Collection" },
      { name: "description", content: "Fale com a Grimm's Collection. Tire dúvidas, peça encomendas customizadas ou colabore com a marca." },
      { property: "og:title", content: "Contato — Grimm's Collection" },
      { property: "og:description", content: "Estamos prontos para responder." },
      { property: "og:url", content: "https://grimmscollaction.lovable.app/contato" },
    ],
    links: [
      { rel: "canonical", href: "https://grimmscollaction.lovable.app/contato" },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
      <div className="max-w-2xl mb-16">
        <p className="text-xs tracking-[0.3em] text-primary font-bold mb-2">FALE CONOSCO</p>
        <h1 className="text-4xl md:text-5xl font-black mb-4">Vamos criar algo épico.</h1>
        <p className="text-lg text-muted-foreground">Pedidos, customizações ou apenas para conversar sobre impressão 3D. Estamos ouvindo.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12">
        <div className="space-y-6">
          {[
            { I: Mail, t: "E-mail", d: "ola@grimmscollection.com" },
            { I: MessageCircle, t: "WhatsApp", d: "+55 11 99999-0000" },
            { I: MapPin, t: "Atelier", d: "São Paulo · Brasil" },
          ].map(({ I, t, d }) => (
            <div key={t} className="flex gap-4 p-5 rounded-lg border border-border bg-card">
              <div className="h-11 w-11 rounded-lg bg-primary/15 grid place-items-center shrink-0">
                <I className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs tracking-[0.2em] font-bold text-muted-foreground mb-1">{t.toUpperCase()}</p>
                <p className="font-medium">{d}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          className="p-8 rounded-xl border border-border bg-card space-y-5"
        >
          {sent ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-primary/20 grid place-items-center mx-auto mb-4 glow-purple">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Mensagem enviada</h3>
              <p className="text-muted-foreground">Respondemos em até 24 horas.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome" name="name" required />
                <Field label="E-mail" name="email" type="email" required />
              </div>
              <Field label="Assunto" name="subject" required />
              <div className="space-y-2">
                <label className="text-xs tracking-[0.2em] font-bold text-muted-foreground">MENSAGEM</label>
                <textarea
                  required
                  rows={6}
                  className="w-full bg-input border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <button className="w-full h-12 rounded-md bg-primary text-primary-foreground font-bold tracking-wide hover:opacity-90 glow-purple">
                ENVIAR MENSAGEM
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-xs tracking-[0.2em] font-bold text-muted-foreground">{label.toUpperCase()}</label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full h-11 bg-input border border-border rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}