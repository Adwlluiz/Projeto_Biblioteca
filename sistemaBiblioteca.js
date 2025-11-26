class Biblioteca {
    constructor() {
        this.livros = [];
        this.clientes = [];
        this.emprestimosAtivos = [];
        this.proximoLivroId = 1;
        this.limiteEmprestimo = 3;
        this.livrosParaFidelidade = 10;
        
        this.logLimit = 1; 
        
        this.carregarDados();
    }

    salvarDados() {
        try {
            localStorage.setItem('bibliotecaLivros', JSON.stringify(this.livros));
            localStorage.setItem('bibliotecaClientes', JSON.stringify(this.clientes));
            localStorage.setItem('bibliotecaEmprestimos', JSON.stringify(this.emprestimosAtivos));
            localStorage.setItem('bibliotecaProximoId', this.proximoLivroId.toString());
        } catch (e) {
            this.log('error', 'Erro ao salvar dados no LocalStorage.');
        }
    }

    carregarDados() {
        try {
            const livrosSalvos = localStorage.getItem('bibliotecaLivros');
            const clientesSalvos = localStorage.getItem('bibliotecaClientes');
            const emprestimosSalvos = localStorage.getItem('bibliotecaEmprestimos');
            const proximoIdSalvo = localStorage.getItem('bibliotecaProximoId');

            if (livrosSalvos) {
                this.livros = JSON.parse(livrosSalvos);
            }
            if (clientesSalvos) {
                this.clientes = JSON.parse(clientesSalvos).map(c => ({
                    ...c, 
                    cpf: c.cpf || 'CPF-NULO-' + Math.random(), 
                    livrosEmprestados: c.livrosEmprestados.map(item => typeof item === 'object' ? item.id : item) || [], 
                    entregasNoPrazo: c.entregasNoPrazo || 0,
                    emprestimosTotal: c.emprestimosTotal || 0,
                    elegivelGratis: c.elegivelGratis || false
                }));
            }
            if (emprestimosSalvos) {
                this.emprestimosAtivos = JSON.parse(emprestimosSalvos);
            }
            if (proximoIdSalvo) {
                this.proximoLivroId = parseInt(proximoIdSalvo, 10);
            }
        } catch (e) {
            this.log('error', 'Erro ao carregar dados do LocalStorage. Começando do zero.');
        }
    }
    
    
    log(type, message) {
        const container = document.getElementById('mensagem-container');
        if (!container) return; 

        container.innerHTML = ''; 

        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ' + type;
        
        
        msgDiv.innerHTML = message; 
        
        container.appendChild(msgDiv);
    }
    
    
    _validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, ''); 

        if (cpf.length !== 11) {
            return false;
        }

        return true;
    }

    cadastrarLivro(nome, autor, ano, genero) {
        if (nome.trim() === "" || autor.trim() === "" || ano.trim() === "" || genero.trim() === "") {
            this.log('error', 'Erro: Por favor, preencha todos os campos do livro.');
            return null;
        }

        const novoLivro = { id: this.proximoLivroId++, nome, autor, ano, genero, estaNaBiblioteca: true, emprestadoPara: null };
        this.livros.push(novoLivro);
        this.log('success', 'Livro cadastrado: ID ' + novoLivro.id + ' - "' + nome + '"'); 
        this.salvarDados(); 
        return novoLivro;
    }

    cadastrarCliente(cpf, nome, email) {
        const cpfLimpo = cpf.replace(/\D/g, ''); 
        
        
        if (!this._validarCPF(cpfLimpo)) {
            this.log('error', 'Erro: CPF ' + cpf + ' inválido. Deve conter exatamente 11 dígitos.');
            return null;
        }
        
        if (this.clientes.some(c => c.cpf === cpfLimpo)) {
            this.log('error', 'Erro: Cliente com CPF ' + cpfLimpo + ' já existe.');
            return null;
        }
        if (nome.trim() === "" || email.trim() === "") {
            this.log('error', 'Erro: Por favor, preencha o Nome Completo e o E-mail.');
            return null;
        }

        const novoCliente = { cpf: cpfLimpo, nome: nome.trim(), email: email.trim(), livrosEmprestados: [], entregasNoPrazo: 0, emprestimosTotal: 0, elegivelGratis: false };
        this.clientes.push(novoCliente);
        this.log('success', 'Cliente cadastrado: ' + nome.trim() + ' (CPF: ' + cpfLimpo + ')'); 
        this.salvarDados(); 
        return novoCliente;
    }

    
    extrairCpfDaString(clienteString) {
        const match = clienteString.match(/\(CPF: (\d+)\)/);
        if (match && match[1]) return match[1];

        const cpfPuro = clienteString.replace(/\D/g, '');
        if (cpfPuro.length === 11) return cpfPuro;

        
        const termo = clienteString.trim().toLowerCase();
        const clientePorNome = this.clientes.find(c => c.nome.toLowerCase() === termo);
        if (clientePorNome) return clientePorNome.cpf;

        return null;
    }

    retirarLivro(livroIdString, clienteString) {
        const idMatch = livroIdString.match(/ID: (\d+)\)/);
        const livroID = parseInt(idMatch ? idMatch[1] : livroIdString);
        const clienteCPF = this.extrairCpfDaString(clienteString);
        
        if (!livroIdString || livroIdString.trim() === '' || !clienteString || clienteString.trim() === '') {
            this.log('error', 'Erro: Por favor, preencha o livro e o cliente.'); 
            return;
        }

        const livro = this.livros.find(l => l.id === livroID);
        const cliente = this.clientes.find(c => c.cpf === clienteCPF);

        if (!livro) { this.log('error', 'Erro: Livro ID ' + livroID + ' não encontrado.'); return; }
        if (!cliente) { this.log('error', 'Erro: Cliente CPF ' + clienteCPF + ' não encontrado.'); return; }
        if (!livro.estaNaBiblioteca) { 
            const emprestadoParaNome = this.clientes.find(c => c.cpf === livro.emprestadoPara)?.nome || 'Outro Cliente';
            this.log('error', 'Erro: Livro "' + livro.nome + '" já está emprestado para ' + emprestadoParaNome + ' (CPF: ' + livro.emprestadoPara + ').'); 
            return; 
        }
        
        
        const limite = cliente.elegivelGratis ? this.limiteEmprestimo + 1 : this.limiteEmprestimo;

        if (cliente.livrosEmprestados.length >= limite) { 
            this.log('warning', 'Limite: Cliente ' + cliente.nome + ' já possui o máximo de ' + limite + ' livros.'); 
            return; 
        }

        const isGratis = cliente.elegivelGratis;
        
        livro.estaNaBiblioteca = false;
        livro.emprestadoPara = cliente.cpf;
        
        cliente.livrosEmprestados.push(livro.id);
        cliente.emprestimosTotal++; 
        
        const novoEmprestimo = { 
            livroId: livro.id, 
            clienteCpf: cliente.cpf, 
            dataEmprestimo: new Date().toLocaleDateString('pt-BR'),
            status: 'ativo'
        };
        this.emprestimosAtivos.push(novoEmprestimo);

        if (isGratis) {
            cliente.elegivelGratis = false;
            this.log('success', 'Livro retirado GRATIS: "' + livro.nome + '" por ' + cliente.nome + '. Agradecemos a fidelidade!');
        } else {
            this.log('info', 'Livro retirado: "' + livro.nome + '" (ID ' + livro.id + ') por ' + cliente.nome + ' (CPF: ' + cliente.cpf + ').');
        }
        this.salvarDados(); 
    }

    devolverLivro(livroIdString, clienteString, noPrazo) {
        const idMatch = livroIdString.match(/ID: (\d+)\)/);
        const livroID = parseInt(idMatch ? idMatch[1] : livroIdString);
        const clienteCPF = this.extrairCpfDaString(clienteString);

        const livro = this.livros.find(l => l.id === livroID);
        const cliente = this.clientes.find(c => c.cpf === clienteCPF);
        
        if (!livro) { this.log('error', 'Erro: Livro ID ' + livroID + ' não encontrado.'); return; }
        if (!cliente) { this.log('error', 'Erro: Cliente CPF "' + clienteCPF + '" não encontrado.'); return; }
        if (livro.emprestadoPara !== clienteCPF) { this.log('error', 'Erro: O livro "' + livro.nome + '" não está emprestado para o CPF ' + clienteCPF + '.'); return; }
        
        livro.estaNaBiblioteca = true;
        livro.emprestadoPara = null;
        
        cliente.livrosEmprestados = cliente.livrosEmprestados.filter(id => id !== livroID);
        
        const indexEmprestimo = this.emprestimosAtivos.findIndex(e => e.livroId === livroID && e.clienteCpf === clienteCPF && e.status === 'ativo');
        if (indexEmprestimo !== -1) {
            this.emprestimosAtivos[indexEmprestimo].status = 'devolvido';
            this.emprestimosAtivos[indexEmprestimo].dataDevolucao = new Date().toLocaleDateString('pt-BR');
        }

        if (noPrazo) {
            cliente.entregasNoPrazo++; 
            this.log('return', 'Devolução NO PRAZO: "' + livro.nome + '" por ' + cliente.nome + '. (Entregas no Prazo: ' + cliente.entregasNoPrazo + ')');
        } else {
            this.log('warning', 'Devolução FORA DO PRAZO: "' + livro.nome + '" por ' + cliente.nome + '. ');
        }

        this.verificarFidelidade(cliente); 
        this.salvarDados(); 
    }
    
    listarItens(tipo) {
        const resultadoDiv = document.getElementById('listagem-resultado');
        resultadoDiv.innerHTML = '';
        
        let titulo = 'CADASTRADOS';
        let itensParaListar = [];

        if (tipo === 'livros') {
            titulo = 'LIVROS CADASTRADOS';
            itensParaListar = this.livros.map(l => 
                `<div class="message info">
                    ID: ${l.id} | Título: ${l.nome} | Autor: ${l.autor} | Ano: ${l.ano} | Gênero: ${l.genero} | Disponível: ${l.estaNaBiblioteca ? 'Sim' : 'Não'}
                    <button onclick="biblioteca.excluirItem('livro', ${l.id})">Excluir</button>
                    <button onclick="biblioteca.iniciarEdicao('livro', ${l.id})">Editar</button>
                </div>`
            );
        } else if (tipo === 'clientes') {
            titulo = 'CLIENTES CADASTRADOS';
            itensParaListar = this.clientes.map(c => 
                `<div class="message info">
                    CPF: ${c.cpf} | Nome: ${c.nome} | E-mail: ${c.email} | Livros Emprestados: ${c.livrosEmprestados.length}
                    <button onclick="biblioteca.excluirItem('cliente', '${c.cpf}')">Excluir</button>
                    <button onclick="biblioteca.iniciarEdicao('cliente', '${c.cpf}')">Editar</button>
                </div>`
            );
        } else if (tipo === 'emprestimos_ativos' || tipo === 'historico_emprestimos') {
            
            let registros = this.emprestimosAtivos.slice().reverse(); 

            if (tipo === 'emprestimos_ativos') {
                titulo = 'EMPRÉSTIMOS ATIVOS';
                registros = registros.filter(e => e.status === 'ativo'); 
            } else {
                titulo = 'HISTÓRICO DE EMPRÉSTIMOS';
            }
            
            if (registros.length === 0) {
                itensParaListar.push('<p class="message warning">Nenhum empréstimo encontrado para esta listagem.</p>');
            } else {
                itensParaListar = registros.map(e => {
                    const livro = this.livros.find(l => l.id === e.livroId);
                    const cliente = this.clientes.find(c => c.cpf === e.clienteCpf);
                    
                    const nomeLivro = livro?.nome || `ID ${e.livroId} (Livro Excluído)`;
                    const nomeCliente = cliente?.nome || `CPF ${e.clienteCpf} (Cliente Excluído)`;
                    const dataDevolucao = e.dataDevolucao || 'N/A';
                    const statusClass = e.status === 'ativo' ? 'warning' : 'return';
                    const statusText = e.status.toUpperCase();
                    
                    return `<div class="message ${statusClass}">
                                Livro: "${nomeLivro}" (ID ${e.livroId}) | Cliente: ${nomeCliente} <br>
                                **Empréstimo:** ${e.dataEmprestimo} | **Devolução:** ${dataDevolucao} | **Status:** ${statusText}
                            </div>`;
                });
            }
            
        }

        let html = `<h4>${titulo}</h4>`;
        html += itensParaListar.join('');
        
        resultadoDiv.innerHTML = html;
    }

    iniciarEdicao(tipo, idOuCpf) {
        const resultadoDiv = document.getElementById('listagem-resultado');
        resultadoDiv.innerHTML = ''; 
        let item, formHtml = '<h4>Editar ' + (tipo === 'livro' ? 'Livro' : 'Cliente') + '</h4>';
        
        if (tipo === 'livro') {
            item = this.livros.find(l => l.id === idOuCpf);
            if (!item) { this.log('error', 'Livro não encontrado para edição.'); return; }
            formHtml += `
                <label for="edit-nome">Título:</label><input type="text" id="edit-nome" value="${item.nome}">
                <label for="edit-autor">Autor:</label><input type="text" id="edit-autor" value="${item.autor}">
                <label for="edit-ano">Ano:</label><input type="text" id="edit-ano" value="${item.ano}">
                <label for="edit-genero">Gênero:</label><input type="text" id="edit-genero" value="${item.genero}">
                <button onclick="biblioteca.salvarEdicao('livro', ${item.id})">Salvar Livro</button>
            `;
        } else if (tipo === 'cliente') {
            item = this.clientes.find(c => c.cpf === idOuCpf);
            if (!item) { this.log('error', 'Cliente não encontrado para edição.'); return; }
            formHtml += `
                <label for="edit-nome">Nome:</label><input type="text" id="edit-nome" value="${item.nome}">
                <label for="edit-email">E-mail:</label><input type="text" id="edit-email" value="${item.email}">
                <p>CPF (ID Único): ${item.cpf}</p>
                <button onclick="biblioteca.salvarEdicao('cliente', '${item.cpf}')">Salvar Cliente</button>
            `;
        }

        resultadoDiv.innerHTML = `<div class="section">${formHtml}</div>`;
    }

    salvarEdicao(tipo, idOuCpf) {
        if (tipo === 'livro') {
            const livro = this.livros.find(l => l.id === idOuCpf);
            if (!livro) return;

            livro.nome = document.getElementById('edit-nome').value.trim();
            livro.autor = document.getElementById('edit-autor').value.trim();
            livro.ano = document.getElementById('edit-ano').value.trim();
            livro.genero = document.getElementById('edit-genero').value.trim();

            if (livro.nome && livro.autor && livro.ano && livro.genero) {
                this.log('success', `Livro ID ${idOuCpf} editado com sucesso.`);
            } else {
                this.log('error', `Erro ao editar Livro: Preencha todos os campos.`);
                return;
            }
        } else if (tipo === 'cliente') {
            const cliente = this.clientes.find(c => c.cpf === idOuCpf);
            if (!cliente) return;
            
            cliente.nome = document.getElementById('edit-nome').value.trim();
            cliente.email = document.getElementById('edit-email').value.trim();

            if (cliente.nome && cliente.email) {
                this.log('success', `Cliente CPF ${idOuCpf} editado com sucesso.`);
            } else {
                this.log('error', `Erro ao editar Cliente: Preencha o Nome e E-mail.`);
                return;
            }
        }
        
        this.salvarDados();
        document.getElementById('listagem-resultado').innerHTML = '';
        this.listarItens(tipo === 'livro' ? 'livros' : 'clientes');
    }

    excluirItem(tipo, idOuCpf) {
        if (!confirm(`Tem certeza que deseja EXCLUIR este ${tipo}?`)) return;

        if (tipo === 'livro') {
            const index = this.livros.findIndex(l => l.id === idOuCpf);
            if (index !== -1) {
                const livro = this.livros[index];
                if (!livro.estaNaBiblioteca) {
                    this.log('error', `Erro: O livro "${livro.nome}" está emprestado e não pode ser excluído.`);
                    return;
                }
                this.livros.splice(index, 1);
                this.log('warning', `Livro ID ${idOuCpf} excluído.`);
                
                this.emprestimosAtivos = this.emprestimosAtivos.filter(e => e.livroId !== idOuCpf);
            }
        } else if (tipo === 'cliente') {
            const index = this.clientes.findIndex(c => c.cpf === idOuCpf);
            if (index !== -1) {
                const cliente = this.clientes[index];
                if (cliente.livrosEmprestados.length > 0) {
                    this.log('error', `Erro: O cliente "${cliente.nome}" possui livros emprestados e não pode ser excluído.`);
                    return;
                }
                this.clientes.splice(index, 1);
                this.log('warning', `Cliente CPF ${idOuCpf} excluído.`);
                
                this.emprestimosAtivos = this.emprestimosAtivos.filter(e => e.clienteCpf !== idOuCpf);
            }
        }
        
        this.salvarDados();
        document.getElementById('listagem-resultado').innerHTML = '';
        this.listarItens(tipo === 'livro' ? 'livros' : 'clientes');
    }

    getSuggestions(type, termo) {
        const termoUpper = termo.trim().toUpperCase();
        if (termoUpper.length === 0) return [];

        if (type === 'livro') {
            return this.livros
                .filter(l => l.nome.toUpperCase().includes(termoUpper) || l.id.toString().includes(termoUpper))
                .slice(0, 5) 
                .map(l => ({ display: l.nome + ' (ID: ' + l.id + ')', value: l.nome + ' (ID: ' + l.id + ')' }));
        } else if (type === 'cliente') {
            return this.clientes
                .filter(c => c.nome.toUpperCase().includes(termoUpper) || c.cpf.includes(termoUpper))
                .slice(0, 5)
                .map(c => ({ display: c.nome + ' (CPF: ' + c.cpf + ')', value: c.nome + ' (CPF: ' + c.cpf + ')' }));
        }
        return [];
    }

    
    verificarFidelidade(cliente) {
        if (cliente.entregasNoPrazo >= this.livrosParaFidelidade && cliente.emprestimosTotal >= this.livrosParaFidelidade) {
            cliente.elegivelGratis = true;
            cliente.entregasNoPrazo = 0;
            cliente.emprestimosTotal = 0;
            this.log('success', 'FIDELIDADE! Cliente ' + cliente.nome + ' é elegível para 1 livro grátis!');
            this.log('info', 'Proximo ciclo de fidelidade começa agora. (Objetivo: ' + this.livrosParaFidelidade + ' emprestimos/devolucoes no prazo)');
        }
    }

    statusLivro(livroId) {
        const livro = this.livros.find(l => l.id === livroId);
        if (!livro) { this.log('error', 'Erro: Livro com ID ' + livroId + ' não encontrado.'); return; }
        let status = '[ID ' + livro.id + '] "' + livro.nome + '" - ';
        if (livro.estaNaBiblioteca) {
            this.log('info', status + 'Disponível');
        } else {
            const cliente = this.clientes.find(c => c.cpf === livro.emprestadoPara);
            const nomeCliente = cliente ? cliente.nome : 'CPF Desconhecido';
            this.log('warning', status + 'Emprestado para: ' + nomeCliente + ' (CPF: ' + livro.emprestadoPara + ')');
        }
    }
    
    statusCliente(clienteString) {
        const clienteCPF = this.extrairCpfDaString(clienteString);
        const cliente = this.clientes.find(c => c.cpf === clienteCPF);

        if (!cliente) { this.log('error', 'Erro: Cliente CPF ' + clienteCPF + ' não encontrado.'); return; }

        const livrosEmprestadosInfo = cliente.livrosEmprestados.map(livroId => {
            const livro = this.livros.find(l => l.id === livroId);
            if (livro) {
                return '"' + livro.nome + '" (ID: ' + livro.id + ')';
            }
            return 'ID: ' + livroId + ' (Livro não encontrado)';
        }).join('; '); 
        
        const progressoFidelidade = Math.min(cliente.entregasNoPrazo, cliente.emprestimosTotal);

        let msg = `--- Status do Cliente: ${cliente.nome} (CPF: ${cliente.cpf}) ---
Livros emprestados: ${cliente.livrosEmprestados.length}/${this.limiteEmprestimo} (${livrosEmprestadosInfo || 'Nenhum'})
E-mail: ${cliente.email}
Total de Empréstimos: ${cliente.emprestimosTotal}
Entregas no Prazo: ${cliente.entregasNoPrazo}
Elegivel para Livro Gratis: ${cliente.elegivelGratis ? 'SIM' : 'NAO'} (${progressoFidelidade}/${this.livrosParaFidelidade})`;
        
        this.log('info', msg);
    }
}

const biblioteca = new Biblioteca();

function showSuggestions(type, termo, suggestionsId) {
    const suggestionsBox = document.getElementById(suggestionsId);
    suggestionsBox.innerHTML = '';
    if (termo.length < 2) { suggestionsBox.style.display = 'none'; return; }

    const suggestions = biblioteca.getSuggestions(type, termo);

    if (suggestions.length > 0) {
        suggestions.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'suggestion-item';
            
            if (type === 'livro') {
                const match = item.display.match(/(.*) \(ID: (\d+)\)/);
                itemDiv.innerHTML = match ? match[1] + ' <span class="item-id">(ID: ' + match[2] + ')</span>' : item.display;
            } else if (type === 'cliente') {
                const match = item.display.match(/(.*) \(CPF: (\d+)\)/);
                itemDiv.innerHTML = match ? match[1] + ' <span class="item-id">(CPF: ' + match[2] + ')</span>' : item.display;
            } else {
                itemDiv.textContent = item.display;
            }

            itemDiv.onclick = () => {
                let inputId = suggestionsId.replace('-suggestions', '');

                if (type === 'livro') {
                    if (inputId === 'livro-emprestimo' || inputId === 'livro-devolucao' || inputId === 'livro-status') {
                        inputId = 'nome-' + inputId;
                    }
                } 

                document.getElementById(inputId).value = item.value;
                suggestionsBox.style.display = 'none';
            };
            suggestionsBox.appendChild(itemDiv);
        });
        suggestionsBox.style.display = 'block';
    } else {
        suggestionsBox.style.display = 'none';
    }
}

function openTab(evt, tabName) {
    let tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }

    let tablinks = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    
    document.getElementById('listagem-resultado').innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cadastro').style.display = "block";
    document.querySelector('.tabs .tab-button').classList.add('active');
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-container')) {
            document.querySelectorAll('.suggestions-list').forEach(list => {
                list.style.display = 'none';
            });
        }
    });
});

function handleCadastrarLivro() {
    const nomeLivro = document.getElementById('nome-livro').value.trim();
    const autorLivro = document.getElementById('autor-livro').value.trim();
    const anoLivro = document.getElementById('ano-livro').value.trim();
    const generoLivro = document.getElementById('genero-livro').value.trim();

    if (nomeLivro && autorLivro && anoLivro && generoLivro) { 
        biblioteca.cadastrarLivro(nomeLivro, autorLivro, anoLivro, generoLivro); 
        document.getElementById('nome-livro').value = ''; 
        document.getElementById('autor-livro').value = '';
        document.getElementById('ano-livro').value = '';
        document.getElementById('genero-livro').value = '';
    } else { 
        biblioteca.log('error', 'Preencha todos os campos do livro.'); 
    }
}

function handleCadastrarCliente() {
    const nomeCliente = document.getElementById('nome-cliente-cadastro').value.trim();
    const emailCliente = document.getElementById('email-cliente-cadastro').value.trim();
    const cpfCliente = document.getElementById('cpf-cliente-cadastro').value.trim();

    if (nomeCliente && emailCliente && cpfCliente) { 
        biblioteca.cadastrarCliente(cpfCliente, nomeCliente, emailCliente); 
        document.getElementById('nome-cliente-cadastro').value = ''; 
        document.getElementById('email-cliente-cadastro').value = '';
        document.getElementById('cpf-cliente-cadastro').value = ''; 
    } else { 
        biblioteca.log('error', 'Preencha todos os campos do cliente (Nome, E-mail e CPF).'); 
    }
}

function handleRetirarLivro() {
    const idLivro = document.getElementById('nome-livro-emprestimo').value.trim();
    const cliente = document.getElementById('cliente-emprestimo').value.trim();

    biblioteca.retirarLivro(idLivro, cliente);
    
    document.getElementById('nome-livro-emprestimo').value = '';
    document.getElementById('cliente-emprestimo').value = '';
}

function handleDevolverLivro() {
    const idLivro = document.getElementById('nome-livro-devolucao').value.trim();
    const cliente = document.getElementById('cliente-devolucao').value.trim();
    const noPrazo = document.getElementById('devolucao-no-prazo').checked; 
    
    if (idLivro && cliente) {
        biblioteca.devolverLivro(idLivro, cliente, noPrazo);
        document.getElementById('nome-livro-devolucao').value = '';
        document.getElementById('cliente-devolucao').value = '';
        document.getElementById('devolucao-no-prazo').checked = false; 
    } else {
        biblioteca.log('error', 'Preencha o nome/ID do livro e o Nome/CPF do cliente.');
    }
}


function handleVerStatusLivroUnificado() {
    const livroString = document.getElementById('nome-livro-status').value.trim();
    
    if (!livroString) {
        biblioteca.log('error', 'Preencha o nome/ID do livro para verificar o status.');
        return;
    }

    const idMatch = livroString.match(/ID: (\d+)\)/);
    let livroID = parseInt(idMatch ? idMatch[1] : livroString);

    if (isNaN(livroID)) {
        
        const livroEncontrado = biblioteca.livros.find(l => l.nome.toLowerCase() === livroString.toLowerCase());
        
        if (livroEncontrado) {
            livroID = livroEncontrado.id;
        } else {
            biblioteca.log('error', 'Erro: Livro não encontrado ou ID inválido. Por favor, use o autocompletar ou digite o ID numérico.');
            return;
        }
    }
    
    biblioteca.statusLivro(livroID); 
    
    document.getElementById('nome-livro-status').value = '';
}

function handleStatusCliente() {
    const cliente = document.getElementById('cliente-status').value.trim();
    if (cliente) { biblioteca.statusCliente(cliente); } else { biblioteca.log('error', 'Preencha o Nome ou CPF do cliente.'); }
}
