// main: despacha "metri <comando>" para o arquivo do comando, que lê process.argv como antes.
const HELP = `metri: a CLI do método Slices com Guardrails.

Uso: metri <comando> [opções]   (metri <comando> --help explica cada um)

Comandos:
  init          prepara o projeto: AGENTS.md, CLAUDE.md, .metri/ARCHITECTURE.md, links de skills e agents,
                .gitignore e scripts do package.json; termina rodando verify
  verify        roda os checks e soma o resultado
  rules-for     lista as regras de arquitetura de caminhos ou de um ticket
  rules-index   gera os INDEX.md das regras (--check confere)
  docs-lint     lint estrutural do source e do projeto
`;

const COMMANDS = ['init', 'verify', 'rules-for', 'rules-index', 'docs-lint'];

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
