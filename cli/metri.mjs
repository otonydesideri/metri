#!/usr/bin/env node
// metri: o bin do pacote. Roda o TypeScript de cli/ sem build, pelo tsx (dependência do pacote).
import { register } from 'tsx/esm/api';

register();
await import('./main.ts');
