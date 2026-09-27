# ADR-0012 Biblioteca de estado global

status: proposed
area: frontend
kind: decision

## Contexto

a biblioteca de estado global é Zustand, escolhida por ser o default de menor atrito da comunidade para um app que já tem o estado servidor em React Query, com revisão em aberto: se o formato do estado pedir muitos valores independentes e derivados, com reatividade fina átomo a átomo, reavaliar Jotai (modelo de átomos) contra Zustand (store central) antes de multiplicar stores.

## Decisão

A decidir.

## Alternativas consideradas

- Zustand (store central)
- Jotai (modelo de átomos)
