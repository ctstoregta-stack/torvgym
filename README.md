# Lift Log

Use o arquivo lovable-specification.md anexado como a especificação principal e fonte de requisitos deste projeto.

Quero que você desenvolva um aplicativo completo de acompanhamento de academia, seguindo integralmente a especificação fornecida no arquivo.

Não trate o arquivo apenas como referência visual. Quero que as estruturas, regras e funcionalidades descritas sejam implementadas de forma funcional, com dados persistentes e integrados entre si.

Diretrizes gerais

Analise todo o arquivo antes de iniciar a implementação.

Não remova, simplifique ou ignore funcionalidades especificadas.

Não crie apenas um mockup ou protótipo visual: quero uma aplicação funcional.

Mantenha a arquitetura de dados definida no documento:

Routine → Workout → Days → Muscle Groups → Exercises → Performance Tracking

Os dados dos treinos, cargas, repetições, séries, histórico e PRs devem permanecer salvos e ser utilizados posteriormente.

Se a especificação não definir algum detalhe de implementação, escolha uma solução coerente com a arquitetura existente, sem alterar os requisitos principais.

Estruture o código de forma modular e preparada para futuras expansões.

Interface e experiência

A interface deve seguir uma experiência premium, moderna, minimalista e focada em academia, inspirada no padrão de experiência do Hevy, mas sem copiar identidade visual, código ou assets proprietários.

Priorize:

Dark Mode como padrão;

Fundo em tons zinc-950 / zinc-900;

Texto claro e alto contraste;

Azul elétrico como cor de destaque;

Cards e componentes modernos;

Excelente experiência em dispositivos móveis;

Navegação simples e rápida durante o treino;

Interface limpa para que o usuário consiga registrar uma série em poucos toques.

IMPORTANTE — GIFs e animações dos exercícios

Mantenha os GIFs/animações dos exercícios como parte fundamental do aplicativo.

Quero que os exercícios sejam apresentados com animações em loop no estilo de demonstração de exercícios do Hevy, mostrando claramente a execução do movimento.

Não substitua essas animações por:

emojis;

ícones;

imagens estáticas genéricas;

placeholders;

cards sem animação.

Os GIFs devem ser utilizados principalmente na tela de detalhes de cada exercício, juntamente com:

nome do exercício;

equipamento;

instruções de execução;

músculos primários;

músculos secundários;

histórico;

informações de progressão.

Os exercícios devem utilizar os gif_url fornecidos no arquivo sempre que forem válidos e acessíveis.

Se algum GIF fornecido não funcionar, não deixe uma imagem quebrada na interface. Implemente um fallback visual adequado e mantenha a estrutura preparada para substituir posteriormente o asset por uma animação válida.

Quando forem adicionados novos exercícios no futuro, eles também devem suportar o mesmo sistema de animação.

Banco de exercícios

Utilize o banco de exercícios fornecido no arquivo como banco inicial da aplicação.

Não descarte os campos existentes. Cada exercício deve manter sua identificação, nome, categoria, equipamento, animação, instruções de execução, músculos primários e músculos secundários.

O banco deve ser estruturado de maneira que seja fácil adicionar novos exercícios posteriormente.

Sistema de treinos

Implemente a hierarquia:

Rotina → Treino → Dias da semana → Grupos musculares → Exercícios

Os grupos musculares devem ser derivados automaticamente dos exercícios selecionados, conforme definido na especificação.

O usuário deve conseguir visualizar sua rotina e identificar facilmente qual treino está associado a cada dia.

Execução do treino

Ao selecionar "Iniciar Treino", quero uma tela de execução rápida e prática.

Para cada exercício, mostrar uma estrutura equivalente a:

Série | Anterior | Carga (kg) | Repetições | ✓

A carga e as repetições do treino anterior devem aparecer como referência/placeholder, conforme definido na especificação.

O usuário deve conseguir:

inserir a carga;

inserir repetições;

marcar a série como concluída;

visualizar o que fez anteriormente;

acompanhar seu progresso durante o treino.

Sistema de PR

Implemente o sistema de Personal Record descrito no arquivo.

Quando o usuário registrar uma carga superior à carga máxima histórica daquele exercício e concluir a série:

detectar automaticamente o novo PR;

mostrar imediatamente um indicador visual [PR] ou uma pequena coroa;

atualizar a carga máxima histórica;

manter o registro no histórico.

O PR deve ser associado ao ID específico do exercício, e não apenas ao nome exibido.

Histórico e progressão

A tela de detalhes do exercício deve possuir as três áreas:

Execução

Ativação Muscular

Histórico & Gráfico

Na área de histórico, mostrar:

carga máxima histórica;

PR;

1RM estimado;

datas dos treinos;

séries realizadas;

repetições;

maior carga de cada sessão;

evolução da performance.

O histórico deve ser baseado nos dados reais registrados pelo usuário, e não em dados fictícios.

Persistência

A aplicação deve utilizar a persistência local definida na especificação, através de LocalStorage ou IndexedDB, de maneira consistente.

Se o usuário fechar e abrir novamente o aplicativo, seus dados não devem desaparecer.

Rotinas, treinos, exercícios personalizados, séries, cargas, repetições, histórico e PRs devem permanecer disponíveis.

Qualidade da implementação

Antes de considerar a primeira versão concluída, verifique os principais fluxos:

Criar/selecionar rotina → selecionar treino → visualizar exercícios → iniciar treino → registrar séries → concluir séries → detectar PR → finalizar treino → consultar histórico → visualizar progressão.

Garanta também que:

não existam botões sem função;

não existam telas sem navegação;

os dados exibidos sejam derivados do estado real da aplicação;

os registros sejam persistidos;

os componentes sejam responsivos;

a interface funcione bem principalmente em celular;

GIFs tenham fallback quando necessário;

estados vazios sejam tratados corretamente;

erros de carregamento não quebrem a aplicação.

Não implemente funcionalidades fictícias apenas para preencher a interface.

Quero que o resultado seja uma base funcional de um aplicativo real de acompanhamento de musculação, com especial atenção à experiência durante o treino e ao acompanhamento de progressão.

Primeiro compreenda toda a especificação anexada. Depois implemente o projeto seguindo esses requisitos.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://torvgym.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9d3b5346-9774-4437-946e-76b491de76b6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
