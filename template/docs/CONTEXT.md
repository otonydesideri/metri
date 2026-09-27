# Contexto: <Produto>

## Termos

**Pedido** · `Order`
Solicitação de compra confirmada pelo cliente.
_Evitar:_ Encomenda, Purchase, Request

## Relações

Um `Order` tem um ou mais `OrderItem`; pertence a um `Customer`.

## Ambiguidades resolvidas

"Conta" era usada para `Account` e `Customer`: são coisas diferentes.
