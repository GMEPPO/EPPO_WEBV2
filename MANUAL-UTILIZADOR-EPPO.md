# MANUAL DO UTILIZADOR
## Sistema EPPO by Groupe GM
### Gestão de Propostas e Produtos

---

**Versão:** 2.0  
**Data:** 2025  
**Idioma:** Português de Portugal  
**Norma de Referência:** ISO 9001:2015

---

## ÍNDICE

1. [INTRODUÇÃO](#1-introdução)
2. [OBJETIVO E ÂMBITO](#2-objetivo-e-âmbito)
3. [DEFINIÇÕES E ABREVIAÇÕES](#3-definições-e-abreviações)
4. [ESTRUTURA DO SISTEMA](#4-estrutura-do-sistema)
5. [PÁGINAS DO SISTEMA](#5-páginas-do-sistema)
6. [FUNCIONALIDADES PRINCIPAIS](#6-funcionalidades-principais)
7. [GESTÃO DE UTILIZADORES E PERMISSÕES](#7-gestão-de-utilizadores-e-permissões)
8. [ANEXOS](#8-anexos)

---

## 1. INTRODUÇÃO

### 1.1. Apresentação

O sistema EPPO (Electronic Proposal and Product Organization) by Groupe GM é uma aplicação web desenvolvida para a gestão de propostas comerciais, produtos e stock. Este sistema permite aos utilizadores criar, editar e gerir propostas de forma eficiente, bem como administrar o catálogo de produtos e o stock disponível.

### 1.2. Estrutura do Manual

Este manual está organizado de acordo com as normas ISO 9001:2015, garantindo uma documentação clara e estruturada dos processos e funcionalidades do sistema. Todas as referências a páginas e funcionalidades utilizam os nomes dos botões e menus visíveis na interface, tanto em português como em espanhol.

---

## 2. OBJETIVO E ÂMBITO

### 2.1. Objetivo

Este manual tem como objetivo fornecer instruções detalhadas sobre a utilização do sistema EPPO, permitindo que os utilizadores compreendam e utilizem todas as funcionalidades disponíveis de forma eficaz.

### 2.2. Âmbito

O manual abrange:
- Descrição de todas as páginas do sistema
- Funcionalidades de criação e gestão de propostas
- Funcionalidades de consulta do histórico
- Funcionalidades de criação e edição de produtos
- Funcionalidades de gestão de stock
- Gestão de utilizadores e permissões

### 2.3. Público-Alvo

Este manual destina-se a:
- Utilizadores comerciais (rol: comercial)
- Administradores do sistema (rol: admin)
- Gestores e supervisores

---

## 3. DEFINIÇÕES E ABREVIAÇÕES

### 3.1. Definições

- **Proposta/Presupuesto**: Documento comercial que contém uma lista de produtos, quantidades, preços e condições para um cliente específico.
- **Produto**: Item do catálogo que pode ser incluído numa proposta.
- **Stock**: Quantidade disponível de um produto em armazém.
- **Categoria**: Agrupamento de produtos por tipo ou família.
- **Rol**: Nível de acesso e permissões de um utilizador no sistema.
- **Versão de Proposta**: Número que identifica diferentes versões da mesma proposta (V1, V2, etc.)

### 3.2. Abreviações

- **EPPO**: Electronic Proposal and Product Organization
- **PDF**: Portable Document Format
- **RLS**: Row Level Security (Segurança ao Nível de Linha)
- **PHC**: Referência do sistema de gestão de stock

---

## 4. ESTRUTURA DO SISTEMA

### 4.1. Arquitetura Geral

O sistema EPPO é uma aplicação web baseada em:
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Supabase (Base de dados PostgreSQL)
- **Autenticação**: Supabase Auth
- **Armazenamento**: Supabase Storage

### 4.2. Navegação Principal

O sistema possui uma barra de navegação superior com os seguintes elementos:

**[IMAGEM 1: Barra de navegação principal]**

1. **Logo EPPO by Groupe GM** (canto superior esquerdo)
2. **Links de navegação**:
   - **Home** (PT/ES): Página inicial com categorias
   - **Products** (PT/ES): Catálogo de produtos
   - **Orçamento** (PT) / **Presupuesto** (ES): Criação e edição de propostas
   - **Histórico** (PT/ES): Consulta de propostas criadas
3. **Menu hambúrguer** (ícone de três linhas horizontais) - Acesso a funcionalidades adicionais (apenas administradores):
   - **Comparar** (PT/ES): Comparação de produtos
   - **Criador/Editor** (PT) / **Creador/Editor** (ES): Criação e edição de produtos
4. **Seletor de idioma** (bandeiras: Portugal, Espanha, Reino Unido)
5. **Modo escuro/claro** (ícone de lua/sol)

---

## 5. PÁGINAS DO SISTEMA

### 5.1. Página Home

#### 5.1.1. Descrição

A página **Home** apresenta uma grelha de categorias de produtos organizadas alfabeticamente segundo o idioma selecionado. Esta página serve como ponto de entrada principal do sistema.

#### 5.1.2. Funcionalidades

- Visualização de todas as categorias disponíveis
- Navegação para a página **Products** de uma categoria específica
- Filtragem automática de produtos segundo o país do utilizador:
  - Utilizadores de **Portugal**: Veem todos os produtos
  - Utilizadores de **Espanha**: Veem apenas produtos com mercado = 'AMBOS'

**[IMAGEM 2: Página Home com categorias]**

#### 5.1.3. Elementos Visuais

- **Grelha de categorias**: Cards com ícone, nome da categoria e imagem representativa
- **Organização alfabética**: As categorias são ordenadas alfabeticamente segundo o idioma selecionado

---

### 5.2. Página Products

#### 5.2.1. Descrição

A página **Products** permite visualizar, filtrar e pesquisar produtos do catálogo. Inclui um painel lateral com filtros dinâmicos e uma área principal com os produtos filtrados.

#### 5.2.2. Funcionalidades

- **Visualização de produtos**: Lista de produtos com imagem, nome, preço e descrição
- **Filtros laterais**:
  - **Categorias**: Checkboxes para selecionar uma ou mais categorias (ordenadas alfabeticamente)
  - **Preço**: Slider para filtrar por preço máximo
  - **Filtros dinâmicos**: Campos específicos de cada categoria (ex: potência, cor, tipo, material)
- **Pesquisa**: Campo de pesquisa por nome ou descrição
- **Ordenação**: Opções para ordenar produtos por:
  - Padrão
  - Preço (crescente/decrescente)
  - Nome
  - Categoria

**[IMAGEM 3: Página Products com filtros]**

#### 5.2.3. Elementos Visuais

- **Sidebar esquerdo**: Painel de filtros com secções colapsáveis
- **Área principal**: Grelha de produtos com cards informativos
- **Indicadores de stock**: Produtos com stock disponível mostram "Em stock" em verde

---

### 5.3. Página de Detalhe de Produto

#### 5.3.1. Descrição

Página que exibe informações detalhadas de um produto específico, incluindo imagens, descrições, especificações técnicas e opções de personalização.

#### 5.3.2. Funcionalidades

- Visualização de múltiplas imagens do produto
- Descrição completa em português e espanhol
- Especificações técnicas
- Variantes disponíveis (cores, tamanhos, etc.)
- Botão para adicionar ao orçamento

**[IMAGEM 4: Página de detalhe de produto]**

---

### 5.4. Página Orçamento (PT) / Presupuesto (ES)

#### 5.4.1. Descrição

Esta é a página principal para criação e edição de propostas. Permite adicionar produtos, definir quantidades, ajustar preços e gerar o documento PDF da proposta.

#### 5.4.2. Funcionalidades Principais

A página **Orçamento** / **Presupuesto** contém os seguintes botões na barra superior:

- **Limpar Carrinho** (PT) / **Limpiar Presupuesto** (ES): Botão vermelho com ícone de lixeira que remove todos os itens do carrinho
- **Adicionar Produto** (PT) / **Agregar Producto** (ES): Botão verde com ícone de lupa que abre a página de seleção de produtos
- **Agregar Producto Exclusivo** (PT/ES): Botão dourado com ícone de estrela para adicionar produtos exclusivos de um cliente específico
- **Pedido Especial** (PT/ES): Botão roxo com ícone de lápis para adicionar itens personalizados que não estão no catálogo
- **Modo 200+** (PT/ES): Botão cinza com ícone de olho para ativar/desativar a aplicação automática de preços do escalão máximo (200+ unidades)
- **Atualizar Proposta** (PT) / **Actualizar Propuesta** (ES): Botão azul com ícone de lápis que aparece quando se está editando uma proposta existente
- **Enviar Proposta** (PT/ES): Botão verde com ícone de avião de papel para gerar e enviar o PDF da proposta

**[IMAGEM 5: Barra de botões da página Orçamento/Presupuesto]**

#### 5.4.3. Tabela de Itens

A tabela principal mostra:
- **FOTO**: Imagem do produto
- **DESCRIÇÃO**: Descrição completa do produto (editável)
- **QUANTIDADE**: Campo numérico para definir quantidade (editável)
- **PREÇO**: 
  - Se o preço é 0.00: Mostra "Sobre consulta" (utilizadores comerciais) ou campo editável (administradores)
  - Se o preço não é 0: Mostra o preço formatado (clicável para ver escalões de preço)
- **PRAZO DE ENTREGA**: Calculado automaticamente segundo o stock disponível
- **AÇÕES**: 
  - Ícone de lixeira (eliminar item)
  - Ícone de comentário (adicionar observações)

**[IMAGEM 6: Tabela de itens do orçamento]**

#### 5.4.4. Formulário de Proposta

Quando se clica em **Enviar Proposta** ou **Atualizar Proposta**, aparece um formulário modal com:

- **Nome do Cliente** *: Campo obrigatório com autocompletado
- **Nome do Comercial** *: Lista desplegável com os comerciais disponíveis (obtidos da base de dados)
  - **Nota importante**: Os comerciais mostrados dependem do rol do utilizador:
    - **Comerciais**: Veem apenas o seu nome e o nome do seu comercial espejo (se tiver um atribuído)
    - **Administradores**: Veem todos os comerciais, incluindo "Claudia Cruz" se for administradora
- **Data do Pedido** *: Seletor de data (obrigatório)
- **País** *: Seleção entre Portugal e Espanha (obrigatório)
- **Número de Cliente** *: Campo numérico (0 se o cliente não está criado no sistema)

**[IMAGEM 7: Formulário de proposta]**

#### 5.4.5. Sistema de Versões

Quando se edita uma proposta existente e se fazem alterações nos produtos (adicionar, editar ou eliminar), o sistema pergunta se se deseja criar uma nova versão do documento:

- **Opção 1**: "Criar Nova Versão" (PT) / "Crear Nueva Versión" (ES): Incrementa o número de versão (ex: V1 → V2)
- **Opção 2**: "Manter Versão Atual" (PT) / "Mantener Versión Actual" (ES): Mantém a versão atual (útil para correções)

A versão aparece no número da proposta no formato: "2701SS0126 - V2"

---

### 5.5. Página Histórico

#### 5.5.1. Descrição

A página **Histórico** permite consultar todas as propostas criadas, filtrar por diferentes critérios, visualizar detalhes e gerar PDFs.

#### 5.5.2. Funcionalidades

- **Filtros de pesquisa**:
  - Por nome do cliente
  - Por código da proposta
  - Por data
  - Por estado da proposta
- **Tabela de propostas**: Lista todas as propostas com informações resumidas, incluindo:
  - Código da proposta com versão (ex: "2701SS0126 - V2")
  - Nome do cliente
  - Nome do comercial
  - Data de criação
  - Estado da proposta
- **Filtragem por rol**:
  - **Administradores**: Veem todas as propostas
  - **Comerciais**: Veem apenas propostas onde o campo `nombre_comercial` corresponde ao seu nome ou ao do seu comercial espejo
- **Ações disponíveis**:
  - **Ver detalhes**: Abre modal com informações completas
  - **Editar**: Abre a proposta na página **Orçamento** / **Presupuesto** no modo de edição
  - **Gerar PDF**: Gera e descarrega o PDF da proposta
  - **Ver histórico de modificações**: Mostra todas as alterações realizadas (mudanças de estado e modificações de artículos)
  - **Eliminar**: Remove a proposta (com confirmação)

**[IMAGEM 8: Página Histórico de propostas]**

#### 5.5.3. Modal de Detalhes

Ao clicar em "Ver detalhes", abre-se um modal que mostra:
- Informações do cliente e comercial
- Lista completa de artigos com:
  - Foto
  - Nome
  - Quantidade
  - Preço unitário (mostra "Sobre consulta" se for 0 para comerciais)
  - Preço total (mostra "Sobre consulta" se o preço unitário for 0 para comerciais)
  - Prazo de entrega
- Total da proposta
- Histórico de modificações (inclui mudanças de estado e modificações de artículos)
- Amostras enviadas (se aplicável)

**[IMAGEM 9: Modal de detalhes da proposta]**

#### 5.5.4. Histórico de Modificações

O histórico de modificações mostra:
- **Mudanças de Estado**: Quando o estado da proposta muda (ex: "proposta em edição" → "amostra pedida")
- **Modificações de Artigos**: Quando se adicionam, editam ou eliminam produtos
- **Mudanças de Versão**: Quando se cria uma nova versão do documento

Cada entrada mostra:
- Data e hora da modificação
- Tipo de modificação (com ícone e cor diferenciados)
- Descrição da alteração
- Nome do utilizador que fez a alteração

**[IMAGEM 10: Histórico de modificações]**

---

### 5.6. Página Comparar

#### 5.6.1. Descrição

A página **Comparar** permite comparar lado a lado até 4 produtos diferentes, facilitando a análise de características, preços e especificações.

#### 5.6.2. Funcionalidades

- Seleção de produtos para comparação
- Tabela comparativa com:
  - Imagens
  - Nomes
  - Preços
  - Especificações técnicas
  - Características principais
- Filtragem por categoria
- **Acesso restrito**: Apenas administradores podem aceder a esta página através do menu hambúrguer

**[IMAGEM 11: Página Comparar produtos]**

---

### 5.7. Página Criador/Editor (PT) / Creador/Editor (ES)

#### 5.7.1. Descrição

A página **Criador/Editor** / **Creador/Editor** permite criar novos produtos ou editar produtos existentes. Inclui funcionalidades avançadas de gestão de produtos e stock.

#### 5.7.2. Funcionalidades

- **Menu de opções**:
  - **Crear/Editar Producto** (PT/ES): Criar ou editar produtos do catálogo
  - **Crear Nueva Categoría** (PT/ES): Criar ou editar categorias que aparecem na página **Home**
  - **Cargar Stock** (PT/ES): Atualizar stock desde ficheiro Excel PHC

- **Formulário de produto** (ao selecionar "Crear/Editar Producto"):
  - Informações básicas (nome, categoria, preço)
  - Descrições em português e espanhol
  - Upload de imagens
  - Especificações técnicas
  - Variantes e personalizações
  - Escalões de preço (price_tiers)

- **Gestão de stock** (ao selecionar "Cargar Stock"):
  - Upload de ficheiro Excel com referências PHC e stock
  - Visualização de estatísticas de stock
  - Atualização em lote

- **Acesso restrito**: Apenas administradores podem aceder através do menu hambúrguer

**[IMAGEM 12: Página Criador/Editor]**

---

### 5.8. Página de Login

#### 5.8.1. Descrição

Página de autenticação do sistema. Todos os utilizadores devem iniciar sessão para aceder às funcionalidades.

#### 5.8.2. Funcionalidades

- Login com email e palavra-passe
- Recuperação de palavra-passe
- Redirecionamento automático após login

**[IMAGEM 13: Página de login]**

---

## 6. FUNCIONALIDADES PRINCIPAIS

### 6.1. Criação de Propostas

#### 6.1.1. Processo Passo a Passo

1. **Aceder à página Orçamento / Presupuesto**
   - Clicar em **Orçamento** (PT) ou **Presupuesto** (ES) na barra de navegação

2. **Adicionar produtos ao carrinho**
   - Clicar no botão **Adicionar Produto** (PT) / **Agregar Producto** (ES) (verde, com ícone de lupa)
   - Na página de seleção, escolher produtos e clicar em "Adicionar ao Orçamento" / "Agregar al Presupuesto"
   - Os produtos aparecem na tabela do carrinho

3. **Configurar quantidades e preços**
   - Editar a quantidade diretamente na coluna **QUANTIDADE**
   - Para produtos com preço 0.00:
     - **Comerciais**: Verão "Sobre consulta" (não podem editar)
     - **Administradores**: Podem inserir um preço manualmente
   - Para produtos com preço: Clicar no preço para ver escalões disponíveis

4. **Adicionar observações** (opcional)
   - Clicar no ícone de comentário na coluna **AÇÕES**
   - Inserir observações específicas para o item

5. **Preencher informações da proposta**
   - Clicar em **Enviar Proposta** (PT/ES) ou **Atualizar Proposta** (PT) / **Actualizar Propuesta** (ES)
   - Preencher o formulário:
     - **Nome do Cliente** *: Obrigatório (com autocompletado)
     - **Nome do Comercial** *: Selecionar da lista (obrigatório)
     - **País** *: Portugal ou Espanha (obrigatório)
     - **Data do Pedido** *: Selecionar data (obrigatório)
     - **Número de Cliente** *: 0 se o cliente não está criado
   - O campo "Responsável" é preenchido automaticamente com o nome do utilizador autenticado

6. **Guardar a proposta**
   - Clicar em **Enviar Proposta** no formulário
   - A proposta é guardada na base de dados
   - É gerado um código único de proposta no formato: DDMMIIPPYY (Dia, Mês, Iniciais Comercial, Número Propuesta, Año)

**[IMAGEM 14: Fluxo de criação de proposta - diagrama]**

#### 6.1.2. Funcionalidades Especiais

**Modo 200+**
- Ativa/desativa através do botão **Modo 200+** (PT/ES)
- Aplica automaticamente os preços do escalão máximo (200+ unidades)
- Aplica-se apenas a produtos de equipamento (excluindo VACAVALIENTE e LASER BUILD)
- Disponível para todos os utilizadores

**Pedido Especial**
- Acesso através do botão **Pedido Especial** (PT/ES)
- Permite adicionar itens personalizados que não estão no catálogo
- Útil para produtos sob medida ou especificações especiais
- Requer preenchimento de: nome, descrição, quantidade, preço, prazo de entrega

**Agregar Producto Exclusivo**
- Acesso através do botão **Agregar Producto Exclusivo** (PT/ES)
- Permite adicionar produtos exclusivos de um cliente específico
- Estes produtos só aparecem quando se está criando uma proposta para esse cliente

**Edição de Descrições**
- As descrições dos produtos podem ser editadas diretamente na tabela
- As alterações são guardadas na proposta

---

### 6.2. Gestão do Histórico de Propostas

#### 6.2.1. Consulta de Propostas

1. **Aceder ao Histórico**
   - Clicar em **Histórico** (PT/ES) na barra de navegação

2. **Filtrar propostas**
   - Utilizar a barra de pesquisa para filtrar por:
     - Nome do cliente
     - Código da proposta
   - Selecionar filtros adicionais:
     - Data de criação
     - Estado da proposta

3. **Visualizar detalhes**
   - Clicar no botão "Ver Detalhes" de uma proposta
   - O modal mostra todas as informações completas

#### 6.2.2. Edição de Propostas Existentes

1. **Abrir proposta para edição**
   - Na página **Histórico**, clicar em "Editar" na proposta desejada
   - A proposta abre na página **Orçamento** / **Presupuesto** em modo de edição

2. **Identificação visual**
   - Aparece um badge azul no topo indicando:
     - "Editando Proposta #[código]" (PT) / "Editando Propuesta #[código]" (ES)
     - "Cliente: [nome]"
   - O botão **Enviar Proposta** muda para **Atualizar Proposta** (PT) / **Actualizar Propuesta** (ES)

3. **Fazer alterações**
   - Adicionar ou remover produtos
   - Modificar quantidades
   - Ajustar preços (se for administrador)
   - Modificar informações do cliente

4. **Guardar alterações**
   - Clicar em **Atualizar Proposta** (PT) / **Actualizar Propuesta** (ES)
   - Se houver alterações nos produtos, o sistema pergunta se se deseja criar uma nova versão
   - As alterações são guardadas e registadas no histórico de modificações

#### 6.2.3. Geração de PDF

1. **A partir do Histórico**
   - Clicar em "Gerar PDF" na proposta desejada
   - O PDF é gerado e descarregado automaticamente

2. **A partir da página Orçamento / Presupuesto**
   - Clicar em **Enviar Proposta**
   - Selecionar o idioma do PDF (português ou espanhol)
   - O PDF é gerado com todos os itens do carrinho

3. **Conteúdo do PDF**
   - Cabeçalho com logos da empresa
   - Informações da proposta em duas colunas:
     - **Coluna esquerda**:
       - Cliente: [número - nome] (ex: "325 - hotel savoy")
       - Nr proposta: [código - versão] (ex: "2701SS0126 - V1")
       - Data da proposta: [data]
     - **Coluna direita**:
       - Comercial: [nome]
       - [email]
       - [telefone]
   - Tabela de produtos com:
     - Foto (adaptada ao tamanho da célula mantendo proporção)
     - Descrição completa
     - Quantidade
     - Preço unitário (mostra "Sobre consulta" se for 0)
     - Preço total (mostra "Sobre consulta" se o preço unitário for 0)
     - Prazo de entrega
   - Total da proposta
   - Condições de pagamento e entrega

**[IMAGEM 15: Exemplo de PDF gerado]**

#### 6.2.4. Histórico de Modificações

- Cada proposta mantém um registo de todas as alterações
- Inclui:
  - **Mudanças de Estado**: Quando o estado da proposta muda
  - **Modificações de Artigos**: Quando se adicionam, editam ou eliminam produtos
  - **Mudanças de Versão**: Quando se cria uma nova versão do documento
- Cada entrada mostra:
  - Data e hora da modificação
  - Tipo de modificação (com ícone e cor diferenciados)
  - Descrição da alteração
  - Nome do utilizador que fez a alteração (obtido da base de dados)

**[IMAGEM 16: Histórico de modificações]**

---

### 6.3. Criação e Edição de Produtos

#### 6.3.1. Criar Novo Produto

1. **Aceder à página Criador/Editor / Creador/Editor**
   - Clicar no menu hambúrguer (apenas administradores)
   - Selecionar **Criador/Editor** (PT) ou **Creador/Editor** (ES)

2. **Selecionar opção**
   - Clicar em **Crear/Editar Producto** (PT/ES)

3. **Preencher informações básicas**
   - **Nome**: Nome do produto
   - **Categoria**: Selecionar da lista (ordenada alfabeticamente)
   - **Preço base**: Preço unitário do produto
   - **Marca**: Marca do produto
   - **Referência PHC**: Referência para consulta de stock

4. **Adicionar descrições**
   - **Descrição em Português**: Campo de texto rico
   - **Descrição em Espanhol**: Campo de texto rico
   - Suporta formatação (negrito, itálico, listas)

5. **Upload de imagens**
   - Clicar em "Selecionar Imagem" ou arrastar e soltar
   - Formatos suportados: JPG, PNG
   - Pode adicionar múltiplas imagens

6. **Configurar escalões de preço**
   - Adicionar escalões (ex: 1-10 unidades: €X, 11-50: €Y, 51-200: €Z, 200+: €W)
   - O sistema calcula automaticamente o preço segundo a quantidade

7. **Configurar variantes** (se aplicável)
   - Adicionar variantes personalizadas (ex: cores, tamanhos)
   - Cada variante pode ter preço e prazo de entrega próprios

8. **Especificações técnicas**
   - Preencher campos específicos da categoria (ex: potência para secadores)
   - Campos dinâmicos aparecem segundo a categoria selecionada

9. **Guardar produto**
   - Clicar em "Guardar Produto"
   - O produto é adicionado ao catálogo

**[IMAGEM 17: Formulário de criação de produto]**

#### 6.3.2. Editar Produto Existente

1. **Localizar o produto**
   - Na página **Criador/Editor** / **Creador/Editor**, selecionar "Editar Producto"
   - Ou através da pesquisa na página **Products**

2. **Abrir para edição**
   - Clicar em "Editar" no produto
   - O formulário abre com todos os dados preenchidos

3. **Fazer alterações**
   - Modificar qualquer campo necessário
   - As alterações são guardadas ao clicar em "Atualizar Produto"

#### 6.3.3. Gestão de Categorias

1. **Aceder à criação de categorias**
   - Na página **Criador/Editor** / **Creador/Editor**, selecionar **Crear Nueva Categoría** (PT/ES)

2. **Criar ou editar categoria**
   - Nome em português e espanhol
   - Ícone representativo
   - Campos dinâmicos específicos (configuráveis)

---

### 6.4. Gestão de Stock

#### 6.4.1. Carregamento de Stock via Excel

1. **Aceder à funcionalidade**
   - Na página **Criador/Editor** / **Creador/Editor**, selecionar **Cargar Stock** (PT/ES)

2. **Preparar o ficheiro Excel**
   - O ficheiro deve ter duas colunas:
     - **Coluna A**: Referência PHC do produto
     - **Coluna B**: Stock disponível (número)
   - Formato: .xlsx ou .xls

**[IMAGEM 18: Exemplo de ficheiro Excel para stock]**

3. **Carregar o ficheiro**
   - Clicar em "Selecionar Ficheiro Excel"
   - Escolher o ficheiro
   - O sistema valida e mostra uma pré-visualização

4. **Verificar estatísticas**
   - O sistema mostra:
     - Total de linhas processadas
     - Produtos com stock > 0
     - Produtos com stock = 0
     - Produtos com stock negativo (erros)

5. **Pré-visualização**
   - Tabela com as primeiras linhas do ficheiro
   - Verificação de formato antes do upload

6. **Upload para a base de dados**
   - Clicar em "Carregar Stock para Supabase"
   - Barra de progresso mostra o avanço
   - O sistema atualiza os registos em lotes (100 por vez)
   - Cada atualização regista a data/hora automaticamente

**[IMAGEM 19: Interface de carregamento de stock]**

#### 6.4.2. Consulta de Stock

O stock é consultado automaticamente em várias situações:

1. **Na página Products**
   - Produtos com stock disponível mostram "Em stock" em verde
   - Produtos sem stock mostram o prazo de entrega normal

2. **No carrinho de compras (Orçamento / Presupuesto)**
   - O prazo de entrega é calculado automaticamente segundo o stock:
     - **Stock suficiente**: "Em stock (sujeito a confirmação no momento da adjudicação)"
     - **Stock parcial**: Mostra quantidade disponível e prazo para o restante
     - **Sem stock**: Mostra o prazo de entrega normal do produto

3. **Aviso de stock desatualizado**
   - O sistema verifica diariamente se o stock foi atualizado
   - Se não houver atualizações no dia atual, aparece um aviso no topo da página
   - Apenas administradores veem este aviso

---

## 7. GESTÃO DE UTILIZADORES E PERMISSÕES

### 7.1. Roles do Sistema

O sistema possui dois níveis de acesso:

#### 7.1.1. Administrador (admin)

**Permissões completas:**
- Acesso a todas as páginas
- Acesso ao menu hambúrguer com opções **Comparar** e **Criador/Editor** / **Creador/Editor**
- Criação e edição de produtos
- Gestão de utilizadores
- Edição de preços em propostas (mesmo quando o preço é 0)
- Visualização de todas as propostas (sem filtro)
- Visualização de todos os comerciais na lista ao criar propostas

#### 7.1.2. Comercial (comercial)

**Permissões limitadas:**
- Visualização de produtos
- Criação e edição de propostas
- Consulta de propostas (apenas as suas e as do seu comercial espejo, se tiver um atribuído)
- **Não pode**:
  - Aceder ao menu hambúrguer (bloqueado)
  - Editar produtos
  - Gerir utilizadores
  - Editar preços de produtos com preço 0 (vê "Sobre consulta")
  - Aceder à página **Comparar**
  - Ver propostas de outros comerciais (exceto do seu espejo)
  - Ver todos os comerciais na lista (vê apenas o seu nome e o do seu espejo)

### 7.2. Comercial Espejo

Cada comercial pode ter um "comercial espejo" atribuído na base de dados. O comercial espejo:
- Pode ver as propostas do comercial principal
- Aparece na lista de comerciais quando o comercial principal cria uma proposta
- É útil para casos onde dois comerciais trabalham em conjunto

**Nota**: Apenas "Claudia Cruz" (se for administradora) aparece na lista de comerciais para todos os utilizadores, independentemente do rol.

### 7.3. Atribuição de Roles

Apenas administradores podem atribuir roles:

1. **Aceder à gestão de utilizadores**
   - Menu hambúrguer → (apenas para admin)
   - Ou aceder diretamente à página de gestão de utilizadores

2. **Localizar o utilizador**
   - A lista mostra todos os utilizadores autenticados
   - Inclui email e role atual

3. **Atribuir role**
   - Selecionar o utilizador
   - Escolher o role (admin ou comercial)
   - Confirmar a alteração

**[IMAGEM 20: Página de gestão de utilizadores]**

### 7.4. Filtragem por País

O sistema filtra produtos automaticamente segundo o país do utilizador:

- **Campo na base de dados**: `user_roles.Pais`
- **Comportamento**:
  - **Portugal**: Ve todos os produtos
  - **Espanha**: Ve apenas produtos com `mercado = 'AMBOS'`

Esta filtragem aplica-se em:
- Página **Home** (categorias)
- Página **Products**
- Página **Comparar**
- Consulta de propostas

---

## 8. ANEXOS

### 8.1. Anexo A: Estrutura de Navegação

```
EPPO Sistema
├── Home
├── Products
├── Orçamento (PT) / Presupuesto (ES)
├── Histórico
└── Menu Hambúrguer (apenas admin)
    ├── Comparar
    └── Criador/Editor (PT) / Creador/Editor (ES)
```

### 8.2. Anexo B: Botões Principais por Página

#### Página Orçamento / Presupuesto:
- **Limpar Carrinho** (PT) / **Limpiar Presupuesto** (ES)
- **Adicionar Produto** (PT) / **Agregar Producto** (ES)
- **Agregar Producto Exclusivo** (PT/ES)
- **Pedido Especial** (PT/ES)
- **Modo 200+** (PT/ES)
- **Atualizar Proposta** (PT) / **Actualizar Propuesta** (ES)
- **Enviar Proposta** (PT/ES)

### 8.3. Anexo C: Formatos de Ficheiro Suportados

- **Imagens de produtos**: JPG, PNG
- **Ficheiros de stock**: Excel (.xlsx, .xls)
- **Exportação de propostas**: PDF

### 8.4. Anexo D: Códigos de Erro Comuns

- **Erro de autenticação**: Verificar credenciais
- **Erro de permissões**: Contactar administrador
- **Erro ao carregar stock**: Verificar formato do ficheiro Excel
- **Erro ao gerar PDF**: Verificar que todos os campos obrigatórios estão preenchidos

### 8.5. Anexo E: Contactos e Suporte

Para questões técnicas ou problemas:
- Contactar o administrador do sistema
- Verificar a documentação técnica

---

## 9. CONTROLOS DE QUALIDADE (ISO 9001)

### 9.1. Rastreabilidade

- Todas as propostas têm um código único
- Todas as modificações são registadas com data, hora e utilizador
- O histórico de modificações permite rastrear todas as alterações
- Sistema de versões permite identificar diferentes versões do mesmo documento

### 9.2. Validação de Dados

- Campos obrigatórios são validados antes de guardar
- Formato de ficheiros é verificado antes do upload
- Preços e quantidades são validados numericamente

### 9.3. Segurança

- Autenticação obrigatória para todas as funcionalidades
- Permissões baseadas em roles (RLS)
- Dados sensíveis protegidos por políticas de segurança
- Filtragem automática de dados segundo o rol do utilizador

### 9.4. Documentação

- Este manual serve como documentação do sistema
- Todas as funcionalidades estão documentadas
- Processos estão definidos e podem ser auditados

---

**FIM DO MANUAL**

---

*Documento gerado automaticamente*  
*Última atualização: 2025*  
*Versão do sistema: 2.0*
