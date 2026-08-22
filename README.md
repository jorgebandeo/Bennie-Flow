# Bennie Flow — gestão de pedidos e produção

Protótipo conceitual de um sistema para gestão de encomendas, cotações, capacidade produtiva, matéria-prima e acompanhamento da produção.

## Protótipo atual

- dashboard de pedidos e capacidade;
- pedidos com quantidade produzida e perdas;
- cotação com estimativa de preço, consumo e primeira data segura;
- cronograma por processo/recurso;
- margem de segurança de produção;
- estoque total, reservado e livre;
- estrutura de produto (BOM) e roteiro de fabricação;
- espaço conceitual para imagens, referências e comentários por item;
- layout responsivo branco e vinho, com identidade visual inspirada em um estúdio delicado e elegante.

## Regra central de planejamento

Ao confirmar um pedido, o backend deverá congelar a versão da estrutura dos itens, reservar matéria-prima, calcular setup e tempo variável, localizar janelas livres por recurso, respeitar precedências, permitir processos paralelos sem conflito de recurso, adicionar margem de segurança e determinar a primeira data comercial realmente disponível.

Cada item deve guardar `quantidade_pedida`, `quantidade_produzida`, `quantidade_aprovada`, `quantidade_perdida` e motivo da perda. Reposição de perdas deve atualizar consumo e agenda.

## Domínio sugerido

`customers`, `quotes`, `quote_items`, `orders`, `order_items`, `item_attachments`, `item_comments`, `products`, `product_versions`, `materials`, `bom_items`, `processes`, `product_routes`, `route_operations`, `resources`, `work_centers`, `calendars`, `resource_downtimes`, `production_jobs`, `job_operations`, `material_stock`, `material_movements`, `material_reservations`, `production_entries`, `scrap_entries`, `shipments`, `status_history`.

## Arquitetura futura

```text
Web / PWA
    ↓
Node.js + TypeScript API
    ├── Pedidos e cotações
    ├── Catálogo / BOM / roteiros
    ├── Estoque e reservas
    ├── Planejador de capacidade finita
    ├── Produção / apontamentos / perdas
    ├── Arquivos e comentários
    └── Portal do cliente
           ↓
       PostgreSQL
       + Object Storage
```

O MVP do planejador pode usar **forward finite-capacity scheduling**: cada operação busca a primeira janela livre em um recurso elegível; duração = setup + quantidade × tempo unitário; recursos diferentes trabalham em paralelo; sucessoras aguardam predecessoras; prazo comercial = término planejado + buffer configurável.

## Executar

A versão atual é estática. Abra `index.html`. Os dados em `app.js` são simulados e serão substituídos pela API Node.js na próxima fase.