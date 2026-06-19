import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart, formatBRL } from "@/lib/cart";
import { Link, useNavigate } from "@tanstack/react-router";

export function CartDrawer() {
  const { items, open, setOpen, remove, updateQty, total, count } = useCart();
  const navigate = useNavigate();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h3 className="font-bold tracking-wide">SEU CARRINHO</h3>
            <span className="text-xs text-muted-foreground">({count})</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Fechar carrinho" className="h-9 w-9 grid place-items-center rounded-md hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-180px)] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex-1 grid place-items-center text-center p-8">
              <div>
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground mb-4">Seu carrinho está vazio</p>
                <button onClick={() => setOpen(false)} className="text-sm text-primary hover:underline">
                  Continuar comprando
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((it) => (
                <li key={it.product.id} className="p-4 flex gap-4">
                  <Link
                    to="/produto/$id"
                    params={{ id: it.product.id }}
                    onClick={() => setOpen(false)}
                    className="shrink-0"
                  >
                    <img src={it.product.image_url ?? "/products/product-1.jpg"} alt={it.product.name} className="h-20 w-20 object-cover rounded-md border border-border" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{it.product.name}</p>
                    {it.color && <p className="text-xs text-muted-foreground">{it.color}</p>}
                    <p className="text-sm text-primary font-bold mt-1">{formatBRL(it.product.price)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-border rounded-md">
                        <button onClick={() => updateQty(it.product.id, it.qty - 1)} aria-label={`Diminuir quantidade de ${it.product.name}`} className="h-7 w-7 grid place-items-center hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                        <span className="w-8 text-center text-sm">{it.qty}</span>
                        <button onClick={() => updateQty(it.product.id, it.qty + 1)} aria-label={`Aumentar quantidade de ${it.product.name}`} className="h-7 w-7 grid place-items-center hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => remove(it.product.id)} aria-label={`Remover ${it.product.name} do carrinho`} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-border p-6 bg-card space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold text-lg">{formatBRL(total)}</span>
            </div>
            <button
              onClick={() => { setOpen(false); navigate({ to: "/checkout" }); }}
              className="w-full h-12 rounded-md bg-primary text-primary-foreground font-bold tracking-wide hover:opacity-90 glow-purple transition-all"
            >
              FINALIZAR COMPRA
            </button>
          </div>
        )}
      </aside>
    </>
  );
}