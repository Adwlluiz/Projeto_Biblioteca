# 📚 Sistema de Gerenciamento de Biblioteca (Local Storage)

Este é um projeto simples de sistema de biblioteca desenvolvido em JavaScript puro, HTML e CSS, utilizando o **LocalStorage** do navegador para persistência de dados.

## ✨ Funcionalidades

* **Cadastro:** Livros (Nome, Autor, Ano, Gênero) e Clientes (CPF, Nome, Email).
* **Empréstimo/Devolução:** Gerenciamento de empréstimos com controle de limite por cliente.
* **Validação de CPF:** Implementação de uma validação básica para garantir CPFs válidos.
* **Busca com Autocompletar:** Sugestões dinâmicas para Livros (ID/Nome) e Clientes (CPF/Nome).
* **Sistema de Fidelidade:** Clientes que realizam 10 empréstimos e devoluções no prazo ganham o próximo livro grátis.
* **Edição/Exclusão:** Funções para editar ou excluir livros e clientes (com restrição de exclusão se houver empréstimos ativos).
* **Status:** Visualização rápida do status de um livro (disponível/emprestado) ou de um cliente (livros emprestados, progresso de fidelidade).

## 🛠️ Tecnologias Utilizadas

* **HTML5** (Estrutura da página)
* **CSS3** (Estilização minimalista e responsiva)
* **JavaScript (ES6+)** (Toda a lógica da aplicação)
* **LocalStorage** (Persistência de dados no navegador)

## 💡 Como Executar

O projeto é inteiramente front-end e pode ser executado diretamente em qualquer navegador moderno.

1.  Clone ou baixe o repositório.
2.  Abra o arquivo `sistemaBiblioteca.html` no seu navegador.
3.  Todos os dados serão armazenados localmente no seu navegador.
