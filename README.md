# meu rolê em SP — PWA inicial

Este é o protótipo inicial do PWA, preparado para uso em celular.

## O que já funciona
- Interface responsiva com visual minimalista.
- Abas Início, Roteiro, Viagem e Mapa.
- Importação de roteiro em TXT/MD/CSV e colagem de texto, com um local por linha.
- Cadastro e remoção de locais.
- Dados de Ribeirão Preto → São Paulo, hospedagem e voo de retorno.
- Persistência local no navegador (`localStorage`).
- Atalhos para pesquisar locais no Google Maps.
- Cronômetro manual com pausa e continuidade.
- Prévia de proposta e aprovação/rejeição sem apagar a lista original.
- Manifest e service worker para instalação como PWA.

## Limitações desta versão
A leitura do roteiro é local e baseada em linhas/nome; ainda não faz geocodificação automática, não calcula distâncias ou rotas reais, não verifica horários de funcionamento e não envia notificações em segundo plano. A prévia inicial não deve ser confundida com uma otimização geográfica. Essas funções exigem integração posterior com um serviço de mapas/rotas e, para notificações confiáveis, infraestrutura de push.

## Publicar pelo GitHub Pages usando iPhone
1. Crie um repositório público chamado `meu-role-em-sp` no GitHub.
2. Envie os arquivos deste pacote para a raiz do repositório (Add file → Upload files).
3. Em Settings → Pages, selecione Deploy from a branch, `main` e `/ (root)`.
4. Aguarde a publicação. O endereço será parecido com `https://SEU-USUARIO.github.io/meu-role-em-sp/`.
5. Abra esse endereço no Safari do iPhone.
6. Toque em Compartilhar → Adicionar à Tela de Início.

O endereço final depende do seu nome de usuário do GitHub.

## Próximas integrações
- Geocodificação dos nomes para endereços e coordenadas.
- Matriz de tempo/distância por modo de transporte.
- Otimização com janelas de horário, duração de visita, hotel e voo.
- Confirmação humana para locais ambíguos.
- Notificações push via servidor.
