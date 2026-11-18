# TaskZone

Lista pessoal de tarefas em português para computador e celular. Crie tarefas com descrição e prazo, conclua, reabra ou arquive. Clique no nome para editar. A tela inicial mostra as tarefas abertas.

## Ativar a sincronização Google (uma vez por site)

1. No [console Firebase](https://console.firebase.google.com/), crie ou selecione o projeto que será usado em todas as versões. Em Configurações do projeto, registre um aplicativo Web.
2. Em Authentication → Sign-in method, habilite Google e escolha o e-mail de suporte. Em Authentication → Settings → Authorized domains, adicione o domínio do TaskZone (por exemplo, `gugarosa456.github.io` se usar GitHub Pages).
3. Em Firestore Database, crie o banco padrão em modo de produção. Na aba Regras, publique o conteúdo de [firestore.rules](firestore.rules). Cada usuário só pode ler e gravar em sua própria lista.
4. Copie o objeto público de configuração do aplicativo Web para [firebase-config.js](firebase-config.js), substituindo `null`. Esse objeto inclui apiKey, authDomain, projectId e appId. Nunca coloque credenciais administrativas no site.
5. Publique os arquivos no mesmo endereço HTTPS de antes. No computador antigo, abra o TaskZone no navegador e perfil que já usava, entre com Google e clique em **Copiar para minha conta**. Abra o site em outro computador e entre com a mesma conta. Confira a lista e o indicador **Sincronizado com sua conta Google**.

Até a configuração, o site funciona em modo local e informa isso na tela. Depois da ativação, a lista da conta é separada da lista local. A importação exige confirmação pelo botão, preserva a origem e ignora IDs já existentes na conta. Se o endereço mudou, exporte o backup na versão antiga e use **Importar backup** depois de entrar na conta.

## Atualizações e dados

Publique novas versões mantendo o projeto Firebase, o banco padrão, as regras e o caminho `users/{uid}/tasks/{id}`. Cada tarefa é um documento separado. Atualizar HTML, CSS ou JavaScript não substitui o banco. Para desenvolver localmente, sirva a pasta com `python3 -m http.server`; para testar login local, autorize localhost no Firebase.

O modo local continua lendo `taskzone_tarefas`. Backups antigos são aceitos e os campos anteriores são preservados. O novo fluxo concentra-se na lista, sem XP, temporizador ou geração automática de tarefas recorrentes. Arquivar é reversível.
