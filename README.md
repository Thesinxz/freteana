# Controle de Frete

Aplicativo web e PWA (**Esmeralda & Gelo**) para controle de fretes, conciliação de recebimentos PIX (Caixa Econômica e Nubank), agenda de coletas, relatórios gerenciais e notificações **Web Push em tempo real** (Android, Desktop e iOS 16.4+ na Tela de Início).

## Funcionalidades Principais

- **Painel de Saldo & Lucro Líquido:** Cartão interativo com progresso de quitação, recebimentos do mês e compartilhamento rápido via WhatsApp.
- **Lançamento Diário Unificado:** Registro simultâneo por transportadora com histórico agrupado por data.
- **Chaves PIX & Baixa de Pagamentos:** Cartões rápidos com cópia de chave e identificação visual da **Caixa Econômica** e **Nubank**.
- **Notificações Web Push + Tempo Real:** Disparo automático para todos os dispositivos inscritos sempre que um novo frete é lançado, um pagamento é recebido ou uma coleta é agendada (via API W3C Web Push + Firestore REST).
- **Agenda de Coletas & Gestão (`/agenda` e `/admin`):** Controle de coletas futuras, extrato filtrável, exportação CSV, despesas e gerenciamento de transportadoras.

## Como Executar Localmente

1. Copie `.env.example` para `.env.local` e preencha as variáveis do projeto Firebase.
2. Instale as dependências e inicie o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

3. Acesse `http://localhost:3000`.
