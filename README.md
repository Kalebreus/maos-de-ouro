# Mãos de Ouro · Barbearia

Demonstrativo de um site moderno, responsivo e editorial para a barbearia **Mãos de Ouro**. Paleta preta, creme e dourada; tipografia marcante; fotos de referência; motion art original de tesoura, pente e navalha.

## Páginas e experiência

- **Início:** apresentação, serviços, referências de cortes, filosofia e convite ao agendamento.
- **Cortes:** galeria com filtros, detalhes e envio do estilo escolhido ao agendamento.
- **A barbearia:** filosofia, escuta, técnica e cuidado nos detalhes.
- **Agendar:** serviço → data/horário → dados → revisão → resumo para o WhatsApp.
- **Meu perfil:** cadastro local, edição e exclusão dos dados.
- **Loja:** catálogo, busca, categorias, ordenação, detalhes, carrinho e pedido pelo WhatsApp.
- Animação de ferramentas ao rolar, vídeo original em loop com controle de reprodução, pausa do movimento, respeito a `prefers-reduced-motion`, menu móvel e navegação por teclado.

## Loja e pedidos

A página **[Loja](https://maos-de-ouro-barbearia-demo.aromaticearth4.chatgpt.site/loja.html)** reúne oito produtos ilustrativos: pomadas matte e brilho, gel, óleo para barba, escova, tesoura, máquina e navalha. Tem busca, filtros por categoria, ordenação, detalhes, carrinho com quantidades e resumo para abrir no WhatsApp da barbearia.

Edite `src/shop-data.js` para substituir os produtos, descrições, imagens e preços. `priceCents` guarda o valor em **centavos inteiros**: `4990` significa R$ 49,90. As ilustrações ficam em `public/assets/shop/`; origens em `ASSETS-SHOP.md`.

O carrinho guarda somente IDs e quantidades em `maos-de-ouro:cart:v1` no localStorage. É possível aumentar ou diminuir quantidades (até 20 por item), remover itens ou limpar o carrinho. Não há coleta de dados pessoais no carrinho nem pagamento online. Abrir o WhatsApp prepara a mensagem; o visitante decide enviá-la.

**Preços, produtos e artes são demonstrativos.** A solicitação depende da confirmação de preço, disponibilidade, entrega ou retirada e forma de pagamento com a barbearia. Nenhum pedido é transmitido, cobrado ou confirmado automaticamente. O subtotal não inclui frete.

## Rodar localmente

Requer **Node.js 20 ou superior**. Não há dependências de execução nem instalação obrigatória.

```sh
npm run dev
```

Abra `http://localhost:4173`. O comando gera `dist/` e inicia um servidor estático. Após editar arquivos de origem, execute `npm run build` e atualize a página. Para mudar a porta: `PORT=4300 npm run dev` em Linux/macOS.

```sh
npm test       # regras de agendamento, datas e telefones
npm run build # gera as seis páginas estáticas e copia os assets
```

Use o servidor HTTP para módulos JavaScript; abrir o HTML diretamente com `file://` não é suportado.

## Estrutura

```text
src/
  pages/          # conteúdo das seis páginas
  config.js       # serviços, valores, cortes e contatos
  app.js          # navegação, galeria, motion e vídeo
  booking.js      # agendamento demonstrativo e disponibilidade local
  profile.js      # cadastro, edição e exclusão local
  shop-data.js    # catálogo ilustrativo e preços em centavos
  shop.js         # busca, filtros, carrinho e pedido no WhatsApp
  styles.css      # identidade visual e responsividade
public/assets/    # fotos WebP, fontes locais, SVG e vídeo MP4
scripts/
  build.mjs       # layout compartilhado, metadados e build estático
  serve.mjs       # servidor local sem dependências
tests/            # testes Node das regras do demonstrativo
.github/workflows/pages.yml # validação e publicação no GitHub Pages
dist/             # site gerado, pronto para hospedagem estática
ASSETS.md         # fontes e licença dos materiais visuais
```

## Personalizar

Edite `src/config.js` para alterar contatos, serviços, preços, durações e referências de cortes. Os contatos fornecidos para este demonstrativo são:

- WhatsApp: **(11) 92726-0440** — https://wa.me/5511927260440
- Instagram: https://www.instagram.com/jonathan_k310/

Textos em `src/pages/`; layout compartilhado em `scripts/build.mjs`; cores e estilos em `src/styles.css`. Troque as fotografias de referência por fotos próprias antes de usá-lo como portfólio real. Depois, rode `npm run build`.

Os dias e horários são uma agenda ilustrativa: terça a sábado, 9h–19h, próximos 60 dias, em **America/Sao_Paulo**. Para alterar, ajuste `buildTimeSlots()` e `dateLimit()` em `src/booking.js` e os textos correspondentes em `src/pages/agendar.html`.

## Publicar no GitHub Pages

1. Crie um repositório público vazio chamado `maos-de-ouro` na sua conta.
2. Envie este projeto à branch `main`:

```sh
git init -b main
git add .
git commit -m "Cria demonstrativo da barbearia Mãos de Ouro"
git remote add origin https://github.com/Kalebreus/maos-de-ouro.git
git push -u origin main
```

3. No GitHub, abra **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Em **Actions**, acompanhe “Publicar demonstrativo”. Se necessário, execute **Run workflow**. Ao concluir, a URL esperada é `https://kalebreus.github.io/maos-de-ouro/`.

Essa URL só passa a funcionar depois que o repositório existir e a publicação terminar. O workflow executa os testes e o build; se o Pages estiver habilitado, publica apenas `dist/`. Se ainda não estiver, os testes e o build terminam normalmente, e a publicação é ignorada até a ativação. Os caminhos relativos também permitem hospedar em subdiretórios.

## Dados e limites do demonstrativo

O site não tem backend nem autenticação. Nome, telefone, e-mail opcional e simulações de agendamento ficam no **localStorage deste navegador**. O perfil preenche o formulário de agendamento. A exclusão em “Meu perfil” remove o cadastro e as simulações deste dispositivo. Mensagens já enviadas pelo WhatsApp permanecem na conversa.

Os conflitos são bloqueados somente entre horários salvos no mesmo navegador; não existe agenda compartilhada entre clientes. **Salvar não reserva um horário real.** O cliente pode abrir uma mensagem com seu resumo no WhatsApp e decidir enviá-la para a barbearia confirmar disponibilidade e preço. Nada é enviado automaticamente.

Para uso operacional, será preciso integrar um backend, calendário compartilhado, autenticação apropriada e a política de privacidade da operação. Valores, durações e imagens desta versão são ilustrativos.

## Verificação

Testes automatizados cobrem as regras de datas em Brasília, dias fechados, sobreposição entre serviços, duração até o fechamento e telefones. O build deve concluir sem dependências externas. Consulte os arquivos de teste para os casos concretos. Uma revisão visual em navegadores reais é recomendada antes do lançamento comercial.

A loja também tem testes de valores em centavos, validação de carrinho, limites por item, busca, filtros e mensagem de pedido pelo WhatsApp.
