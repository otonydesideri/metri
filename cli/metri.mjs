#!/usr/bin/env node
// metri: the package bin. Runs the TypeScript in cli/ without a build, through tsx (a package dependency).
import { register } from 'tsx/esm/api';

register();
await import('./main.ts');
