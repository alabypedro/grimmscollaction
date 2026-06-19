import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Send } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border mt-32">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Impressão 3D premium. Peças exclusivas para colecionadores, cosplayers e amantes do design.
            </p>
            <div className="flex gap-2 pt-2">
              {[Instagram, Youtube].map((I, i) => (
                <a key={i} href="#" aria-label="social" className="h-9 w-9 grid place-items-center rounded-md border border-border hover:border-primary hover:text-primary transition-colors">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.25em] text-foreground font-bold mb-4">NAVEGAÇÃO</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/loja" search={{ category: undefined, search: undefined }} className="hover:text-primary">Loja</Link></li>
              <li><Link to="/categorias" className="hover:text-primary">Categorias</Link></li>
              <li><Link to="/sobre" className="hover:text-primary">Sobre</Link></li>
              <li><Link to="/contato" className="hover:text-primary">Contato</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.25em] text-foreground font-bold mb-4">SUPORTE</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Envio & Entrega</a></li>
              <li><a href="#" className="hover:text-primary">Trocas e devoluções</a></li>
              <li><a href="#" className="hover:text-primary">FAQ</a></li>
              <li><a href="#" className="hover:text-primary">Termos & Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.25em] text-foreground font-bold mb-4">NEWSLETTER</h4>
            <p className="text-sm text-muted-foreground mb-3">Receba lançamentos exclusivos e drops limitados.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="seu@email.com"
                className="flex-1 h-10 bg-input border border-border rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button className="h-10 w-10 grid place-items-center rounded-md bg-primary text-primary-foreground hover:opacity-90 glow-purple">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-6 flex flex-col md:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Grimm's Collection. Todos os direitos reservados.</p>
          <p>Impresso com paixão. Esculpido em sombras.</p>
        </div>
      </div>
    </footer>
  );
}