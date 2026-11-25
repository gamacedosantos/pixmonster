# Biblioteca de efeitos (`fx/lib/`)

114 efeitos animados em pixel art, feitos no `vfx_workbench` do PixelLab (grátis no plano, sem gastar geração) e reutilizáveis por **qualquer** pixmon ou golpe.
Cada efeito é uma folha `nome.png` + `nome.json` (quadros, fps, loop, pivô). Vitrine para ver todos: `http://localhost:5181/fx/lib/vitrine.html`.

## Como usar

- No jogo: `PixmonArena.tocarFx('impacto-estrela', i, { dy: -10, escala: 0.6, dur: 800, flip })`. `i` = lado (0 = você, 1 = adversário). O pivô do efeito fica no monstro.
- **Uma vez** (explosão, impacto, golpe): toca e some. **Loop** (aura, bolhas, escudo): passe `dur` em ms, senão fica até a luta acabar.
- Escala padrão 0,6 (os efeitos foram feitos para um sprite de 64 px; os monstros na tela são menores). Ajuste por efeito em `o.escala`.
- Projéteis (`*-bola`, `*-orbe`, `*-lanca`, `*-jato`, `*-linhas`) são desenhados **apontando para a direita**; use `flip` quando o alvo estiver à esquerda e mova o efeito por código.
- `dust`/`trilha`/`ondas`/`brilho-chao` são do chão: use `dy` positivo para os pés.

## Catálogo

| Família | Uma vez | Loop |
|---|---|---|
| **Fogo** | `fogo-explosao`, `fogo-explosao-grande`, `fogo-faiscas` | `fogo-bola` (projétil), `fogo-labareda` (jato), `fogo-chama`, `fogo-anel`, `fogo-brasas`, `queimado` (status), `aura-chamas` |
| **Água** | `agua-respingo` | `agua-bolhas`, `agua-jato`, `agua-orbe` (projétil), `agua-ondas`, `agua-gotas` (molhado), `agua-escudo` |
| **Elétrico** | `eletrico-raio`, `eletrico-choque`, `eletrico-tempestade` | `eletrico-bola` (projétil), `eletrico-arcos` (status) |
| **Impacto geral** | `impacto-estrela`, `impacto-critico`, `impacto-faiscas`, `impacto-flash`, `impacto-poeira`, `impacto-poeira-grande`, `impacto-onda`, `impacto-estrelas` | |
| **Terra** | `terra-espinhos`, `terra-detritos`, `terra-rachaduras` | `terra-trilha` (poeira de corrida) |
| **Ar** | `corte-onda` | `ar-rajadas`, `ar-linhas` (velocidade) |
| **Gelo** | `gelo-estilhaco`, `gelo-espinhos` | `gelo-lanca` (projétil) |
| **Planta** | `planta-cipos`, `planta-espinhos` | `planta-folhas` |
| **Golpes** | `garra`, `mordida`, `corte` | |
| **Ults (um por elemento)** | `ult-fogo` (meteoro, cogumelo de explosão, parede de fogo), `ult-agua` (gêiser, respingos, ondas, chuva), `ult-eletrico` (nuvem, raios em sequência, choque, arcos), `ult-terra` (espinhos, rachaduras de lava, onda, detritos), `ult-ar` (ciclone cortante, ondas de corte, folhas, penas) | |
| **Orbes de energia** | | `orbe-fogo`, `orbe-agua`, `orbe-eletrico`, `orbe-terra`, `orbe-ar` (loop; Genkidama, supernova, carga do golpe forte) |
| **Poderes especiais** | `pulo-queda` (super pulo) | `disco-fogo`, `disco-agua`, `disco-eletrico`, `disco-terra`, `disco-ar` (Kienzan) |
| **Variedade por elemento** | `nova-onda-<el>` (supernova), `golpe-garra-<el>`, `golpe-mordida-<el>`, `golpe-estrela-<el>`, `golpe-corte3-<el>`, `golpe-cruz-<el>`, `proj-arco-<el>` | `dardo-<el>`, `lanca-<el>` |
| **Status e apoio** | `cura`, `carga` (juntando poder), `fumaca`, `penas`, `meteoro`, `subir-nivel` | `veneno`, `atordoado`, `sono`, `buff-cima`, `debuff-baixo`, `brilho-chao` |

## Onde a biblioteca já é usada

- `arena.js`: `PROJ_LIB` e `JATO_LIB` (projétil e labareda/jato do golpe forte), `IMPACTO_LIB` (impacto por elemento), `ULT_CARGA` e `ULT_SIG` (ultimate por elemento). Para mudar um golpe ou ult, edite essas tabelas: cada linha é um efeito deste catálogo com atraso, posição e escala.

- Uma ult nova é uma receita única no `vfx_workbench` (peças com `start`/`end`, a primeira peça precisa ser de uma vez só) exportada com `--game-pack` e importada com `node fx/importar-vfx.mjs <url> <zip> whole:ult_fogo:2200` (nome e duração em ms).

- Variantes: `PROJ_VAR` (projétil do golpe forte) e `GOLPE_RAPIDO` (estilo do golpe rápido) no `arena.js`; cada golpe escolhe o seu pelo nome, sempre o mesmo, então golpes diferentes ficam com visuais diferentes. `<el>` = fogo, agua, eletrico, terra, ar.

## Como acrescentar efeitos

1. No `vfx_workbench` (PixelLab, grátis): `start`, depois `add_part` com `parts=[...]`. O `id` da peça tem **no máximo 14 letras** (`a-z0-9_`).
2. Efeitos de uma vez só: dê um id curto e registre em `fx/lib/nomes.json` como `"id": ["nome_da_biblioteca_1x", duração_ms]` (o `_1x` marca "uma vez"). Loops: o próprio id vira o nome (`agua_bolhas` → `agua-bolhas`).
3. `export ... --game-pack` e rode `node fx/importar-vfx.mjs <url da pasta do export> <arquivo.zip>`. O importador gera `fx/lib/<nome>.png|json`, corta quadros vazios e atualiza `lib.json`.
4. Confira na vitrine.

Regra do pacote: o `vfx_workbench` estica todas as peças de um mesmo efeito para o quadro mais longo (por isso a duração vai em `nomes.json`). Agrupe loops num efeito e efeitos de uma vez em outro.
