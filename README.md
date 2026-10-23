# Do Silêncio ao Registro

Painel interativo dos resultados da pesquisa sobre o efeito das Delegacias Especializadas de Atendimento à Mulher (DEAMs) e do plantão 24 horas sobre o registro de violência doméstica e familiar contra a mulher nos 185 municípios de Pernambuco, de 2015 a 2025.

**Acesse:** https://acmfarias.github.io/do-silencio-ao-registro/

## Pergunta

Ampliar a presença especializada do Estado (instalação de DEAMs e plantão 24h) aumenta a capacidade de tornar visível, nos registros policiais, a violência doméstica que já ocorre?

## Resultados preliminares

- **Instalação da DEAM:** +29% de registros (IC 95% de 21% a 39%; p de aleatorização = 0,019), com efeito desigual entre os municípios.
- **Plantão 24h:** +22% de registros (IC 95% de 4% a 42%; p de aleatorização = 0,051), sensível ao grupo de controle.
- As âncoras (feminicídio e notificações do SINAN) não têm poder estatístico suficiente para separar efeito de registro de efeito sobre a violência.

## Método

Diferenças-em-diferenças com adoção escalonada: Poisson (PPML) com uma dummy pós-tratamento por coorte e efeitos fixos de município e trimestre (Wooldridge, 2023); event study de Sun e Abraham (2021); inferência por aleatorização.

## Dados

- Boletins de ocorrência de violência doméstica e familiar contra a mulher: SDS-PE (REL 491), via Lei de Acesso à Informação
- Datas de instalação das DEAMs e do plantão 24h: SDS-PE, via LAI
- Notificações de violência: SINAN
- Índice de Comprometimento Municipal de Proteção às Mulheres: TCE-PE
- População feminina (Censo 2022) e malha municipal: IBGE

## Arquivos

- `index.html`, `styles.css`, `app.js`: o painel (gráficos em D3)
- `dados.json`: dados agregados por município e resultados dos modelos, gerados pelo script `exportar_dashboard.R`

Resultados preliminares, sujeitos a revisão.
