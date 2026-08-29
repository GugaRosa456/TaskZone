# TaskZone

TaskZone é um **gerenciador de tarefas pessoais**, feito com **HTML5, CSS3 e JavaScript puro** — sem backend, sem banco de dados e sem frameworks obrigatórios. Organize suas tarefas em três áreas da vida: 🏠 **Casa**, 🎓 **Escola/Faculdade** e 🎮 **Jogos**.

Todos os dados ficam salvos no `localStorage` do seu navegador — nada é enviado para nenhum servidor.

## Funcionalidades

- **Dashboard** com resumo do dia, anel de progresso, progresso por categoria, tarefas de hoje e histórico de conclusões.
- **Todas as tarefas**: busca em tempo real, filtros rápidos (pendentes, concluídas, atrasadas, hoje), filtro por categoria e ordenação.
- **Tarefas recorrentes** (diária, semanal, mensal) — ao concluir, a próxima ocorrência é criada automaticamente.
- **Calendário** mensal com indicador de dias com tarefas; clique em um dia para ver as tarefas dele.
- **Estatísticas**: total criado, concluído, atrasado, sequência de dias (streak) e destaques por categoria.
- **Conquistas** desbloqueáveis (primeira tarefa, sequência de 7 dias, 100 tarefas, etc.).
- **Modo Foco**: cronômetro Pomodoro (5/10/25/50 min) para uma tarefa por vez.
- **Arquivamento** de tarefas antigas, com restauração.
- **Exportar/Importar** backup em `.json`.
- Tema claro/escuro, animações que podem ser desativadas, e layout 100% responsivo (menu lateral vira hambúrguer no celular).

## Tecnologias utilizadas

- HTML5, CSS3, JavaScript ES6+
- `localStorage` para persistência de dados
- Nenhum backend, banco de dados, API externa obrigatória ou framework

## Estrutura do projeto

```
TaskZone/
├── index.html   → Estrutura da aplicação (todas as telas/views)
├── style.css     → Estilos e responsividade
├── script.js      → Toda a lógica: dados, tarefas, dashboard, calendário,
│                     estatísticas, conquistas, modo foco e configurações
└── README.md
```

## Como executar localmente

Não é necessário instalar nada:

1. Baixe/copie a pasta `TaskZone/` para o seu computador.
2. Dê duplo clique em `index.html` (ou clique com o botão direito → **Abrir com** → seu navegador).
3. O site abrirá com algumas tarefas de demonstração já carregadas.

## Como colocar no GitHub

1. Acesse [github.com](https://github.com) e faça login (ou crie uma conta).
2. Clique em **New** para criar um repositório novo, por exemplo `taskzone`.
3. Marque como **Public**.
4. Em **Add file → Upload files**, envie `index.html`, `style.css`, `script.js` e `README.md`.
5. Escreva uma mensagem de commit e clique em **Commit changes**.

Ou, via terminal:

```bash
cd caminho/para/TaskZone
git init
git add .
git commit -m "Primeira versão do TaskZone"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/taskzone.git
git push -u origin main
```

## Como ativar o GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em **Source**, selecione a branch `main` e a pasta `/ (root)`.
3. Clique em **Save** e aguarde a publicação.
4. O site ficará disponível em:

```
https://SEU-USUARIO.github.io/taskzone/
```

## Como fazer backup das tarefas

Como o `localStorage` fica restrito a este navegador/dispositivo, use a exportação para não perder seus dados:

1. Vá em **Configurações**.
2. Clique em **Exportar** (em "Exportar tarefas").
3. Um arquivo `taskzone-backup-AAAA-MM-DD.json` será baixado com todas as suas tarefas, conquistas e preferências.

## Como importar um backup

1. Vá em **Configurações**.
2. Clique em **Importar** (em "Importar tarefas") e selecione o arquivo `.json` exportado anteriormente.
3. Confirme a importação — isso substituirá as tarefas atuais pelas do arquivo.

## Privacidade e armazenamento

Seus dados são armazenados **localmente neste navegador**. Se você limpar os dados do navegador ou trocar de dispositivo, eles poderão ser perdidos — por isso, use sempre a função de exportação para manter um backup seguro. O TaskZone não utiliza senhas, dados bancários ou qualquer informação pessoal sensível.

---

TaskZone © 2026 — Organize suas tarefas. Conclua seus objetivos.
