import db from './db.js';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto-js' 
import require from 'sequelize'

    const app = new express()
    app.use(cors())
    app.use(express.json())

    app.post('/cadastrar', async (req, resp) => {

        try {
            let cd = req.body;
            let tbProduto = await db.pcpjp2021_tb_usuario.findAll()


            if(cd.nome == '' || cd.email == '' || cd.senha == '' ){
                resp.send({erro: 'Todos os campos devem estar preenchidos'})
            }

            if(tbProduto.some( x => x.dataValues.ds_email == cd.email) ){
                resp.send({erro: 'Email já foi cadastrado!'})
                return
            }

            if( cd.email.includes('@') == false ){
                resp.send({erro: 'Insira um Email válido'})
                return
            }

            console.log(cd)

                let inserirCadastro = {
                    nm_usuario: cd.nome,
                    ds_email: cd.email,
                    ds_senha: crypto.SHA256(cd.senha).toString(crypto.enc.Base64),
                    bt_ativo: false
                }

            let r = await db.pcpjp2021_tb_usuario.create(inserirCadastro)
                delete(r.dataValues.ds_senha)

            resp.send(r)

        } catch (e) {
           resp.send({erro: e.toString() }) 
        }      

    })

    app.get('/gerenciarLogin/:idUsuario', async (req, resp) => {

        try {
            let r = await db.pcpjp2021_tb_usuario.findOne({
                where: {
                    id_usuario: req.params.idUsuario
                }
            })

            delete(r.dataValues.ds_senha)
            resp.send(r)
            
        } catch (e) {
            resp.send({erro: e.toString()})            
        }

    })

    app.post('/login', async (req, resp) => {

        try {
            let user = req.body;
            
            console.log(user)

            let login = await db.pcpjp2021_tb_usuario.findOne({
                where: {
                    ds_email: user.email,
                    ds_senha: crypto.SHA256(user.senha).toString(crypto.enc.Base64)
                }
            })

            console.log(login)

                if( login == null ){
                    resp.send({erro: 'Cadastro não foi encontrado'})
                    return
                }

            delete(login.dataValues.ds_senha)
            resp.send(login)

        } catch (e) {
            resp.send({erro: e.toString()})
        }

    })

    app.post('/produto/:idUsuario', async (req, resp) => {

        try {
            let p = req.body;
            let usu = req.params.idUsuario;

            let produtos = await db.pcpjp2021_tb_produto.findAll()


            if( produtos.some( x => x.dataValues.nr_codigo == p.codigoP) ){
                resp.send({erro: 'O código de produto inserido já foi cadastrado'})
                return
            }


            if(String(p.codigoP).substring(0, 3) != '690'){
                resp.send({erro: "Os três primeiros digitos do Código do Produto devem ser iguais a '690'"})
                return
            }


            if(String(p.codigoP).length != 9 ){
                resp.send({erro: 'O Código do Produto dever ter nove digitos'})
                return
            }

            if(p.qtdAtual < 0 || p.qtdMinima < 0 || p.valorC < 0 || p.valorV < 0){
                resp.send({erro: 'Você não pode insirir números negativos'})
                return
            }

            if(p.qtdAtual % 1 != 0 || p.qtdMinima % 1 != 0){
                resp.send({erro: "Você só pode inserir números inteiros nos campos: 'Quantidade Atual' e 'Quantidade Mínima'"})
                return
            }

            if (p.valorV < p.valorC){
                resp.send({erro: 'O Valor de Custo não pode ser maior que o Valor de Venda'})
                return
            }


            if(isNaN(p.qtdAtual) || isNaN(p.qtdMinima) || isNaN(p.codigoP) ||isNaN(p.valorC) || isNaN(p.valorV)){
                
                if (isNaN(p.qtdAtual)) {
                    resp.send({erro: "Você pode insirir apenas números no campo 'Quantidade Atual' "})

                } else if(isNaN(p.qtdMinima)){
                    resp.send({erro: "Você pode insirir apenas números no campo 'Quantidade Mínima' "})

                } else if(isNaN(p.codigoP)){
                    resp.send({erro: "Você pode insirir apenas números no campo 'Código de Produto' "})

                } else if(isNaN(p.valorC)){
                    resp.send({erro: "Você pode insirir apenas números no campo 'Valor de Custo' "})

                } else if(isNaN(p.valorV)){
                    resp.send({erro: "Você pode insirir apenas números no campo 'Valor de Venda' "})

                } 

                return

            }


            if(p.nome == '' || p.categoria == '' || String(p.codigoP) == '' || String(p.qtdAtual) == '' || String(p.qtdMinima) == '' || String(p.valorC) == '' || String(p.valorV) == '' ){
                resp.send({erro: "Todos os campos devem estar preenchidos"})
                return
            }


                let inserirProduto = {
                    id_usuario: usu,
                    nm_produto: p.nome,
                    ds_categoria: p.categoria,
                    nr_codigo: p.codigoP,
                    qtd_atual: p.qtdAtual,
                    qtd_minima: p.qtdMinima,
                    vl_custo: p.valorC,
                    vl_venda: p.valorV,
                    dt_cadastro: new Date()
                }

            let r = await db.pcpjp2021_tb_produto.create(inserirProduto)
            resp.sendStatus(200)

        } catch (e) {
            resp.send({erro: e.toString()})
        }


    })

    app.get('/categorias', async (req, resp) => {
        
        try {
            
            let produtos = await db.pcpjp2021_tb_produto.findAll()

            let categorias = []

            for ( const r of produtos ){
                let c = r.ds_categoria[0].toUpperCase() + r.ds_categoria.substring(1)

                    if( categorias.some((C) => C === c ) ) {
                        continue
                    }

                categorias.push(c)
            }

            resp.send(categorias)

        } catch (e) {
            resp.send({erro: e.toString()})
        }

    })

    app.get('/produto/:idUsuario', async (req, resp) => {

        try {
        

            const { Op } = require;

                let where = [
                    {
                        id_usuario: req.params.idUsuario
                    }
                ]

                let filtros = [
                    {
                        nm_produto: {[Op.substring]:req.query.nomeP},
                        value: req.query.nomeP
                    },
                    {
                        nr_codigo:  {[Op.substring]: req.query.codigoP},
                        value: req.query.codigoP
                    },
                    {
                        ds_categoria: {[Op.substring]: req.query.categoriaP},
                        value: req.query.categoriaP
                    },
                    {
                        dt_cadastro: {[Op.substring]: req.query.dtCadastro},
                        value: req.query.dtCadastro
                    }   
                ]
            

                filtros = filtros.filter( (c) => c.value != '' )

                for( let c of filtros ){
                    delete(c.value)
                }

                if (filtros.length != 0 ){

                    if( req.query.buscaAvancada == 'false' ){
                        filtros = {
                            [Op.or]: filtros
                        }
                        // console.log(filtros)
                    }
                    
                    where.push(filtros)
                }
  
                let r = await db.pcpjp2021_tb_produto.findAll({
                    where: where
                })

            resp.send(r)

        } catch (e) {
            resp.send({erro: e.toString()})
        }

    })

    app.delete('/produto/:idProduto', async (req, resp) => {

        try {

            await db.pcpjp2021_tb_controle_estoque.destroy({
                where: {
                    id_produto: req.params.idProduto
                }
            })

            await db.pcpjp2021_tb_produto.destroy({
                where: {
                    id_produto: req.params.idProduto
                }
            })

            resp.sendStatus(200)

        } catch (e) {
            resp.send({erro: e.toString()})
        }

    })

    app.put('/produto/:idProduto', async (req, resp) => {

        try {
            let p = req.body

            let produtos = await db.pcpjp2021_tb_produto.findAll()


            if( produtos.some( x => x.dataValues.nr_codigo == p.codigoP && x.dataValues.id_produto != req.params.idProduto ) ){
                resp.send({erro: 'O código de produto inserido já foi cadastrado'})
                return
            }


            if(String(p.codigoP).substring(0, 3) != '690'){
                resp.send({erro: "Os três primeiros digitos do Código do Produto devem ser iguais a '690'"})
                return
            }


            if(String(p.codigoP).length != 9 ){
                resp.send({erro: 'O Código do Produto dever ter nove digitos'})
                return
            }

            if(p.qtdAtual < 0 || p.qtdMinima < 0 || p.valorC < 0 || p.valorV < 0){
                resp.send({erro: 'Você não pode insirir números negativos'})
                return
            }

            if(p.qtdAtual % 1 != 0 || p.qtdMinima % 1 != 0){
                resp.send({erro: "Você só pode inserir números inteiros nos campos: 'Quantidade Atual' e 'Quantidade Mínima'"})
                return
            }

            if(isNaN(p.qtdAtual) || isNaN(p.qtdMinima) || isNaN(p.codigoP) ||isNaN(p.valorC) || isNaN(p.valorV)){
                
                if (isNaN(p.qtdAtual)) {
                    resp.send({erro: "Você pode insirir apenas números no campo 'Quantidade Atual' "})

                } else if(isNaN(p.qtdMinima)){
                    resp.send({erro: "Você pode insirir apenas números no campo 'Quantidade Mínima' "})

                } else if(isNaN(p.codigoP)){
                    resp.send({erro: "Você pode insirir apenas números no campo 'Código de Produto' "})

                } else if(isNaN(p.valorC)){
                    resp.send({erro: "Você pode insirir apenas números no campo 'Valor de Custo' "})

                } else if(isNaN(p.valorV)){
                    resp.send({erro: "Você pode insirir apenas números no campo 'Valor de Venda' "})

                } 

                return

            }


            if(p.nome == '' || p.categoria == '' || String(p.codigoP) == '' || String(p.qtdAtual) == '' || String(p.qtdMinima) == '' || String(p.valorC) == '' || String(p.valorV) == '' ){
                resp.send({erro: "Todos os campos devem estar preenchidos"})
                return
            }


            
                let r = await db.pcpjp2021_tb_produto.update({
                        nm_produto: p.nome,
                        ds_categoria: p.categoria,
                        nr_codigo: p.codigoP,
                        qtd_atual: p.qtdAtual,
                        qtd_minima: p.qtdMinima,
                        vl_custo: p.valorC,
                        vl_venda: p.valorV,       
                    }, {
                        where: {
                            id_produto: req.params.idProduto
                        }
                    }
                )

            resp.sendStatus(200)
            

        } catch (e) {
            resp.send({erro: e.toString()})
        }

    })

    app.put('/controleestoque/:idUsuario', async (req, resp) =>  {

        try {

            let {codigoP, qtdM, mov} = req.body
            qtdM = Number(qtdM)

                    let p = await db.pcpjp2021_tb_produto.findOne({
                        where: {
                            nr_codigo: codigoP
                        }
                    })

                if (p == null){
                    resp.send({erro: 'O código inserido não está cadastrado'})
                    return
                }

               if (String(qtdM) == '' ){
                   resp.send({erro: 'Nenhum campo pode estar vazio'})
                   return
               }

               if (isNaN(qtdM) || qtdM % 1 != 0 ){
                    resp.send({erro: 'Você só pode inserir números inteiros no campo Quantidade'})
               }
                
               if (qtdM < 0){
                    resp.send({erro: 'Você não pode inserir números negativos'})
               }


            if( mov == 'Entrada' ){

                    let r = await db.pcpjp2021_tb_produto.update({
                            qtd_atual: p.qtd_atual + qtdM
                        }, {
                            where: {
                                nr_codigo: codigoP
                            }
                        }
                    )

            } else if (mov == 'Saida') {

                if (p.qtd_atual - qtdM < 0){
                    resp.send({erro: 'A quantidade de produtos no estoque não pode ser menor que zero'})
                    return
                }


                    let r = await db.pcpjp2021_tb_produto.update({
                            qtd_atual: p.qtd_atual - qtdM
                        }, {
                            where: {
                                nr_codigo: codigoP
                            }
                        }
                    )

            }


                    let lucroM = (p.vl_venda - p.vl_custo) * qtdM


                let inserirControleEstoque =  {
                    id_produto: p.id_produto,
                    id_usuario: req.params.idUsuario,
                    qtd_produtos: qtdM,
                    ds_movimentacao: mov,
                    vl_lucro: lucroM,
                    dt_movimentacao: new Date()
                }

                let i = await db.pcpjp2021_tb_controle_estoque.create(inserirControleEstoque)  

            resp.sendStatus(200)


        } catch (e) {
            resp.send({erro: e.toString()})
        }

    })

   
    //permite que o adm faça login em uma conta já cadastrada
   app.post('/loginAdm', async (req, resp) => {
       try {
            let { email, senha } = req.body 

            let adm = await db.pcpjp2021_tb_adm.findOne({
                where: {
                    ds_email: email,
                    ds_senha: senha
                }
            })

                if( adm == null ){
                    resp.send({erro: 'Credenciais inválidas!'})
                    return
                }

            resp.send(adm)

       } catch (e) {
           resp.send({erro: e.toString()})
       }
   })

//    lista os usuarios não ativos/aceitos no sistema
   app.get('/usersNaoCadastrados', async (req, resp) => {
       try {
            let { nome, email } = req.query
            let {Op} = require

                let filtro = [
                    {nm_usuario: {[ Op.substring ]: nome}, value: nome },
                    {ds_email: { [ Op.substring ]: email}, value: email }
                ]

                filtro = filtro.filter( (f) => f.value !== '' )

                for( let c of filtro ){
                    delete(c.value)
                }

            let users = null

                if( filtro.length != 0 ){
                    
                    users = await db.pcpjp2021_tb_usuario.findAll({
                        where: {
                            bt_ativo: false,
                            [Op.or]: filtro
                        }
                    })

                } else {

                    users = await db.pcpjp2021_tb_usuario.findAll({
                        where: {
                            bt_ativo: false
                        }
                    })
                       
                }

           resp.send(users)
           
       } catch (e) {
           resp.send({erro: e.toString()})
       }
    })


   //permite que o adm aprove a entrada de pessoas em seu sistema, através do cadastro de suas contas
   app.put('/aprovarCad/:idUser', async (req, resp) => {
        try {
            
            if( req.query.situacaoCadastro == 'Aceitar' ){
                
                await db.pcpjp2021_tb_usuario.update({
                        bt_ativo: true
                    },{
                    where: {
                        id_usuario: req.params.idUser
                    }}
                )

            } else if( req.query.situacaoCadastro == 'Recusar' ){

                await db.pcpjp2021_tb_usuario.destroy({
                    where: {
                        id_usuario: req.params.idUser
                    }
                })

            }

            resp.sendStatus(200)
            
        } catch (e) {
            resp.send({erro: e.toString()})
        }
    })

    //lista usuarios já aprovados e caadastrados
    app.get('/usuarioscadastrados', async (req, resp) => {
        try { 
            let { nome, email } = req.query
            let {Op} = require

                let filtro = [
                    {nm_usuario: {[ Op.substring ]: nome}, value: nome },
                    {ds_email: { [ Op.substring ]: email}, value: email }
                ]

                filtro = filtro.filter( (f) => f.value !== '' )

                for( let c of filtro ){
                    delete(c.value)
                }

            let users = null

                if( filtro.length != 0 ){
                    
                    users = await db.pcpjp2021_tb_usuario.findAll({
                        where: {
                            bt_ativo: true,
                            [Op.or]: filtro
                        }
                    })

                } else {

                    users = await db.pcpjp2021_tb_usuario.findAll({
                        where: {
                            bt_ativo: true
                        }
                    })
                       
                }

           resp.send(users)
           
        } catch (e) {
            resp.send({erro: e.toString()})
        }
    })

    
    //exclui o cadastro dos usuarios
    app.delete('/usuarioscadastrados/:idUsuario', async (req, resp) =>{
        try{
            
            let controleEstoque = await db.pcpjp2021_tb_controle_estoque.destroy({
                where: {
                    id_usuario: req.params.idUsuario
                }
            })

            let ProdutosUser = await db.pcpjp2021_tb_produto.destroy({
                where: {
                    id_usuario: req.params.idUsuario
                }
            })

            let deletarUsu = await db.pcpjp2021_tb_usuario.destroy({
                where: {
                    id_usuario: req.params.idUsuario
                }
            })
        
        resp.sendStatus(200)

        } catch (e) {
            resp.send({erro: e.toString()})
        }
    })


        function FiltroProdutosSimples( NomeP, CodP ){

            const { Op } = require;

            let filtrosP = [
                {
                    nm_produto: {[Op.substring]: NomeP },
                    value: NomeP
                },
                {
                    nr_codigo:  {[Op.substring]: CodP },
                    value: CodP
                }
            ]

            filtrosP = filtrosP.filter( (c) => c.value != '' )

                for( let c of filtrosP ){
                    delete(c.value)
                }

            return filtrosP
        }

        function FiltrosAvancado( NomeUsuario, DtMovimentacao, NProduto, Categoria ){

            const { Op } = require;

            let FiltroUser = [
                {
                    nm_usuario: {[Op.substring]: NomeUsuario },
                    value: NomeUsuario
                }
            ]
            FiltroUser = FiltroUser.filter( (c) => c.value != '' )

            for( let c of FiltroUser ){
                delete(c.value)
            }


            let FiltroControleEstoque = [
                {
                    dt_movimentacao: {[Op.substring]: DtMovimentacao },
                    value: DtMovimentacao
                }
            ]
            FiltroControleEstoque = FiltroControleEstoque.filter( (c) => c.value != '' )

            for( let c of FiltroControleEstoque ){
                delete(c.value)
            }


            let FiltroProduto = [
                {
                    nm_produto: {[Op.substring]: NProduto },
                    value: NProduto
                },
                {
                    nm_produto: {[Op.substring]: Categoria },
                    value: Categoria
                }
            ]
            FiltroProduto = FiltroProduto.filter( (c) => c.value != '' )

            for( let c of FiltroProduto ){
                delete(c.value)
            }

            return {
                FiltroProduto,
                FiltroControleEstoque,
                FiltroUser
            }

        }



    //permite que o adm veja o controle de estoque dos usuarios
    app.get('/controleEstoque', async (req, resp) => {
        try { 


            const { Op } = require;

            let filtrosP = FiltroProdutosSimples(req.query.nomeP, req.query.codigoP )
            let FiltroAvancado = FiltrosAvancado(req.query.NomeUser, req.query.DtMovimentacao, req.query.nomeP, req.query.categoriaP)
  
            console.log(req.query.buscaAvancada)

                let controleEsto = null

            

                // if (filtrosP.length != 0 || FiltroAvancado.FiltroProduto.length  != 0  &&  FiltroAvancado.FiltroControleEstoque.length  != 0 &&  FiltroAvancado.FiltroUser.length  != 0  ){


                    if( req.query.buscaAvancada == 'false' ){
                    
                        if(filtrosP.length != 0){
                            filtrosP = {
                                [Op.or]: filtrosP
                            }
                        }

                        controleEsto = await db.pcpjp2021_tb_controle_estoque.findAll({
                            include: [
                                {
                                    model: db.pcpjp2021_tb_usuario,
                                    as: "id_usuario_pcpjp2021_tb_usuario",
                                    required: true,
                                   
                                },
                                {
                                    model: db.pcpjp2021_tb_produto,
                                    as: "id_produto_pcpjp2021_tb_produto",
                                    required: true,
                                    where: filtrosP
                                    
                               }
                            ]
                        })
                    
                    } else {

                        controleEsto = await db.pcpjp2021_tb_controle_estoque.findAll({
                            where: FiltroAvancado.FiltroControleEstoque,
                            include: [
                                {
                                    model: db.pcpjp2021_tb_usuario,
                                    as: "id_usuario_pcpjp2021_tb_usuario",
                                    required: true,
                                    where: FiltroAvancado.FiltroUser

                                },
                                {
                                    model: db.pcpjp2021_tb_produto,
                                    as: "id_produto_pcpjp2021_tb_produto",
                                    required: true,
                                    where: FiltroAvancado.FiltroProduto
                                    
                               }
                            ]
                        })

                    }

                

                    
                // } else {

                //     controleEsto = await db.pcpjp2021_tb_controle_estoque.findAll({
                //         include: [
                //             {
                //                 model: db.pcpjp2021_tb_usuario,
                //                 as: "id_usuario_pcpjp2021_tb_usuario",
                //                 required: true,
                                
                //             },
                //             {
                //                 model: db.pcpjp2021_tb_produto,
                //                 as: "id_produto_pcpjp2021_tb_produto",
                //                 required: true,
                                
                //            }
                //         ]
                //     })

                // }

       

        resp.send(controleEsto)

        } catch (e) {
            resp.send({erro: e.toString()})
        }
    })

    //lista os produtos cadastrados dos usuarios
    app.get('/produtosUsuarios', async (req, resp) => {
        try{

            const { Op } = require;


                let filtros = [
                    {
                        nm_produto: {[Op.substring]:req.query.nomeP},
                        value: req.query.nomeP
                    },
                    {
                        nr_codigo:  {[Op.substring]: req.query.codigoP},
                        value: req.query.codigoP
                    },
                    {
                        ds_categoria: {[Op.substring]: req.query.categoriaP},
                        value: req.query.categoriaP
                    },
                    {
                        dt_cadastro: {[Op.substring]: req.query.dtCadastro},
                        value: req.query.dtCadastro
                    }   
                ]
            

                filtros = filtros.filter( (c) => c.value != '' )

                for( let c of filtros ){
                    delete(c.value)
                }

                if (filtros.length != 0 ){

                    if( req.query.buscaAvancada == 'false' ){
                        filtros = {
                            [Op.or]: filtros
                        }
                        // console.log(filtros)
                    }
                    
                }

            let ListarProdutos = await db.pcpjp2021_tb_produto.findAll({
                where: filtros,
                include: [{
                    model: db.pcpjp2021_tb_usuario,
                    as: 'id_usuario_pcpjp2021_tb_usuario',
                    required: true,

                }] 
            })

            resp.send(ListarProdutos)

        } catch (e) {
            resp.send({erro: e.toString()})
        }
    })

    //permite o adm excluir produtos dos usuarios 
    app.delete('/DeletarProdutoUsuario/:idProduto', async (req, resp) => {
        try{
            const ExcluirProdutoUsu = await db.pcpjp2021_tb_produto.destroy({
                where: {
                    id_produto: req.params.idProduto
                }
            })

            resp.sendStatus(200)

        } catch (e) {
            resp.send({erro: e.toString()})
        }
    })
    
app.listen(process.env.PORT,
                x => console.log('Server up at port ' + process.env.PORT))