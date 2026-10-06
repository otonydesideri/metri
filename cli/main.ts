// main: dispatches "metri <command>" to the command's file, which reads process.argv as before.
const HELP = `metri: a CLI do método Slices com Guardrails.

Uso: metri <comando> [opções]   (metri <comando> --help explica cada um)

Comandos:
  init          prepara o projeto: num projeto novo, o starter; AGENTS.md, CLAUDE.md, .metri/ARCHITECTURE.md,
                links de skills e agents, .gitignore e scripts do package.json; termina rodando verify
  verify        roda os checks e soma o resultado
  check         os checks de código que nenhum lint cobre: boundaries e date-time
  rules-for     lista as regras de arquitetura de caminhos ou de um ticket
  rules-index   gera os INDEX.md das regras (--check confere)
  docs-lint     lint estrutural do source e do projeto
  design-tokens confere se o tema do código segue os tokens do docs/DESIGN.md
  sot           confere os cabeçalhos SOURCE OF TRUTH e o registro das slices construídas
  prune         tira da árvore a evidência dos tickets de uma slice, na poda do /accept
  scope         confere se a branch de um ticket muda só o que o ticket pode mudar
`;

const COMMANDS = ['init', 'verify', 'check', 'rules-for', 'rules-index', 'docs-lint', 'design-tokens', 'sot', 'prune', 'scope'];

const [command, ...rest] = process.argv.slice(2);
if (command === undefined || command === '--help' || command === '-h') {
  console.log(HELP);
  process.exit(command === undefined ? 1 : 0);
}
if (!COMMANDS.includes(command)) {
  console.log(`erro: comando ${command} não existe (metri --help)`);
  process.exit(1);
}
process.argv = [process.argv[0], `${process.argv[1]} ${command}`, ...rest];
await import(`./${command}.ts`);
