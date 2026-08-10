/* ==========================================================================
   Salão de Festas Jardim Vitória — comportamento
   ==========================================================================
   Herdado da referência: só se move o que comunica alguma coisa.
   Nada de fade-up em cascata no scroll.
   ========================================================================== */

(function () {
  'use strict';

  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* mouse de verdade — dedo não tem "passar por cima" */
  var temMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- 1. Header sticky ------------------------------------------------- */
  (function () {
    var cabecalho = document.getElementById('cabecalho');
    if (!cabecalho) return;

    // guarda a posição e a altura originais para não dar salto ao fixar
    var topo = cabecalho.offsetTop;
    var espacador = null;

    function aoRolar() {
      var altura = cabecalho.offsetHeight;
      if (window.scrollY > topo + altura) {
        if (cabecalho.classList.contains('fixo')) return;
        espacador = document.createElement('div');
        espacador.style.height = altura + 'px';
        cabecalho.parentNode.insertBefore(espacador, cabecalho);
        cabecalho.classList.add('fixo');
      } else if (cabecalho.classList.contains('fixo') && window.scrollY <= topo) {
        cabecalho.classList.remove('fixo');
        if (espacador) { espacador.remove(); espacador = null; }
      }
    }

    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', function () {
      if (!cabecalho.classList.contains('fixo')) topo = cabecalho.offsetTop;
    });
    aoRolar();
  })();

  /* ---- 2. Seletor de eventos (01–05) ------------------------------------ */
  /* No desktop basta passar o mouse. No celular (sem mouse) continua no toque. */
  (function () {
    var abas = Array.prototype.slice.call(document.querySelectorAll('.categorias__btn'));
    if (!abas.length) return;

    function ativar(indice) {
      abas.forEach(function (aba, i) {
        var ativo = i === indice;
        aba.setAttribute('aria-selected', ativo ? 'true' : 'false');

        var painel = document.getElementById(aba.getAttribute('aria-controls'));
        if (!painel) return;
        painel.hidden = !ativo;
        painel.setAttribute('data-ativo', ativo ? 'true' : 'false');
      });
    }

    abas.forEach(function (aba, i) {
      aba.addEventListener('click', function () { ativar(i); });
      if (temMouse) {
        aba.addEventListener('mouseenter', function () { ativar(i); });
        aba.addEventListener('focus', function () { ativar(i); });
      }

      // navegação por teclado, como manda o padrão de tablist
      aba.addEventListener('keydown', function (e) {
        var passo = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
                  : e.key === 'ArrowUp'   || e.key === 'ArrowLeft'  ? -1 : 0;
        if (!passo) return;
        e.preventDefault();
        var alvo = (i + passo + abas.length) % abas.length;
        ativar(alvo);
        abas[alvo].focus();
      });
    });

    ativar(0);
  })();

  /* ---- 3. Contadores ---------------------------------------------------- */
  /* Contam de 0 até o número quando entram na tela. Uma vez só. */
  (function () {
    var alvos = Array.prototype.slice.call(document.querySelectorAll('[data-conta]'));
    if (!alvos.length) return;

    function contar(el) {
      var destino = parseInt(el.getAttribute('data-conta'), 10) || 0;
      var sufixo = el.getAttribute('data-sufixo');
      if (sufixo === null) sufixo = '';

      if (reduzido) { el.textContent = destino + sufixo; return; }

      var duracao = 1800;
      var inicio = null;

      function passo(agora) {
        if (inicio === null) inicio = agora;
        var t = Math.min((agora - inicio) / duracao, 1);
        var suave = 1 - Math.pow(1 - t, 3);            // easeOutCubic
        el.textContent = Math.round(destino * suave) + sufixo;
        if (t < 1) requestAnimationFrame(passo);
      }
      requestAnimationFrame(passo);
    }

    if (!('IntersectionObserver' in window)) {
      alvos.forEach(contar);
      return;
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        contar(entrada.target);
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.35 });

    alvos.forEach(function (el) { observador.observe(el); });
  })();

  /* ---- 4. Menu lateral (mobile) ----------------------------------------- */
  (function () {
    var menu = document.getElementById('menu-lateral');
    var veu = document.querySelector('[data-veu]');
    var abre = document.querySelector('.abre-menu');
    if (!menu || !veu || !abre) return;

    function definir(aberto) {
      menu.setAttribute('data-aberto', aberto ? 'true' : 'false');
      veu.setAttribute('data-aberto', aberto ? 'true' : 'false');
      abre.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      document.body.style.overflow = aberto ? 'hidden' : '';
    }

    abre.addEventListener('click', function () {
      definir(menu.getAttribute('data-aberto') !== 'true');
    });
    veu.addEventListener('click', function () { definir(false); });
    menu.querySelector('[data-fecha-menu]').addEventListener('click', function () { definir(false); });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { definir(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') definir(false);
    });
  })();

  /* ---- 5. Item de menu ativo conforme a seção na tela ------------------- */
  (function () {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-principal a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var secoes = links.map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    }).filter(Boolean);

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        links.forEach(function (a) {
          a.setAttribute('aria-current', a.getAttribute('href') === '#' + entrada.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    secoes.forEach(function (s) { observador.observe(s); });
  })();

  /* ======================================================================
     6. ACERVO — as fotos da página galeria.html
     ======================================================================
     A ordem daqui é a ordem dos quadros no mosaico de galeria.html: o
     `data-abre-acervo` de cada botão é o índice nesta lista. Mexeu aqui,
     mexa lá. O tour em vídeo não entra — ele fica solto no topo da página.
     ====================================================================== */
  var ACERVO = [
    { src: 'assets/img/g-01.jpg', legenda: 'A fachada do Jardim Vitória, na Rua Jenipapo.' },
    { src: 'assets/img/g-02.jpg', legenda: 'Salão montado para evento formal, com toalhas brancas, sousplat dourado e arranjos.' },
    { src: 'assets/img/g-03.jpg', legenda: 'Mesas redondas azuis e o painel de balões montado ao fundo.' },
    { src: 'assets/img/g-04.jpg', legenda: 'Mesas em tons pastel e a decoração de aniversário ao fundo.' },
    { src: 'assets/img/g-05.jpg', legenda: 'Área kids do segundo andar: brinquedão, mesa de atividades e fliperama.' },
    { src: 'assets/img/g-06.jpg', legenda: 'Crianças no air game, no segundo andar.' },
    { src: 'assets/img/g-07.jpg', legenda: 'Recreação monitorada durante a festa.' },
    { src: 'assets/img/g-08.jpg', legenda: 'Porções individuais servidas em ramequins.' },
    { src: 'assets/img/g-09.jpg', legenda: 'Salgados fritos servidos na cesta.' },
    { src: 'assets/img/g-10.jpg', legenda: 'Decoração de aniversário infantil com painéis e balões.' },
    { src: 'assets/img/g-11.jpg', legenda: 'Bolo de vários andares com os personagens da festa.' },
    { src: 'assets/img/g-12.jpg', legenda: 'Decoração em tons de lilás, com arcos e mesa de doces.' },
    { src: 'assets/img/g-13.jpg', legenda: 'Taças e balões na mesa dos convidados.' },
    { src: 'assets/img/g-14.jpg', legenda: 'Bolo de 15 anos com balões verdes e dourados ao fundo.' },
    { src: 'assets/img/g-15.jpg', legenda: 'Bolo de 15 anos branco, cercado de arranjos.' },
    { src: 'assets/img/g-16.jpg', legenda: 'Arranjo de flores rosa e roxas na mesa de bolo.' },
    { src: 'assets/img/g-17.jpg', legenda: 'Mesa de lembrancinhas em tons pastel.' },
    { src: 'assets/img/g-18.jpg', legenda: 'Placa personalizada na mesa da festa de 15 anos.' },
    { src: 'assets/img/g-19.jpg', legenda: 'Caixas de lembrancinha sobre suportes, em tons pastel.' },
    { src: 'assets/img/g-20.jpg', legenda: 'Lembrancinhas montadas em suporte de bolo.' },
    { src: 'assets/img/g-21.jpg', legenda: 'Bolo de borboletas em pasta americana.' },
    { src: 'assets/img/g-22.jpg', legenda: 'Decoração em rosa e lilás, com arcos e flores.' },
    { src: 'assets/img/g-23.jpg', legenda: 'Bolo decorado com borboletas e flores.' },
    { src: 'assets/img/g-24.jpg', legenda: 'Painéis em arco e o número de LED da aniversariante.' },
    { src: 'assets/img/g-25.jpg', legenda: 'Bolo temático com os personagens da festa infantil.' },
    { src: 'assets/img/g-26.jpg', legenda: 'Cupcakes e docinhos na mesa da festa.' },
    { src: 'assets/img/g-27.jpg', legenda: 'Painel decorado montado no salão.' },
    { src: 'assets/img/g-28.jpg', legenda: 'Prateleira com as lembrancinhas dos convidados.' },
    { src: 'assets/img/g-29.jpg', legenda: 'Mesa de doces montada com o tema da festa.' },
    { src: 'assets/img/g-30.jpg', legenda: 'Pote de doce decorado sobre a mesa.' }
  ];

  (function () {
    var caixa = document.getElementById('acervo');
    if (!caixa) return;

    var palco = caixa.querySelector('[data-acervo-palco]');
    var legenda = caixa.querySelector('[data-acervo-legenda]');
    var contagem = caixa.querySelector('[data-acervo-contagem]');
    var tiras = caixa.querySelector('[data-acervo-tiras]');
    var atual = -1;
    var deOndeVeio = null;

    /* miniaturas — montadas uma vez */
    ACERVO.forEach(function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'acervo__tira';
      b.setAttribute('aria-label', 'Item ' + (i + 1) + ' de ' + ACERVO.length);
      var img = document.createElement('img');
      img.src = item.src;
      img.alt = '';
      img.loading = 'lazy';
      b.appendChild(img);
      b.addEventListener('click', function () { mostrar(i); });
      tiras.appendChild(b);
    });

    function mostrar(i) {
      atual = (i + ACERVO.length) % ACERVO.length;
      var item = ACERVO[atual];

      palco.innerHTML = '';
      var foto = document.createElement('img');
      foto.src = item.src;
      foto.alt = item.legenda;
      palco.appendChild(foto);

      legenda.textContent = item.legenda;
      contagem.textContent = (atual + 1) + ' / ' + ACERVO.length;

      var botoes = tiras.querySelectorAll('.acervo__tira');
      botoes.forEach(function (b, j) {
        b.setAttribute('data-ativo', j === atual ? 'true' : 'false');
      });
      if (botoes[atual] && botoes[atual].scrollIntoView) {
        botoes[atual].scrollIntoView({ block: 'nearest', inline: 'center',
          behavior: reduzido ? 'auto' : 'smooth' });
      }
    }

    function abrir(i, gatilho) {
      deOndeVeio = gatilho || null;
      caixa.hidden = false;
      document.body.style.overflow = 'hidden';
      mostrar(i);
      caixa.querySelector('[data-fecha-acervo]').focus();
    }

    function fechar() {
      caixa.hidden = true;
      palco.innerHTML = '';
      document.body.style.overflow = '';
      if (deOndeVeio) deOndeVeio.focus();
    }

    document.querySelectorAll('[data-abre-acervo]').forEach(function (el) {
      el.addEventListener('click', function () {
        abrir(parseInt(el.getAttribute('data-abre-acervo'), 10) || 0, el);
      });
    });

    caixa.querySelector('[data-fecha-acervo]').addEventListener('click', fechar);
    caixa.querySelectorAll('[data-acervo]').forEach(function (b) {
      b.addEventListener('click', function () {
        mostrar(atual + (b.getAttribute('data-acervo') === 'prox' ? 1 : -1));
      });
    });

    /* clicar no fundo fecha; clicar na foto, não */
    caixa.addEventListener('click', function (e) {
      if (e.target === caixa || e.target === palco) fechar();
    });

    document.addEventListener('keydown', function (e) {
      if (caixa.hidden) return;
      if (e.key === 'Escape') fechar();
      if (e.key === 'ArrowRight') mostrar(atual + 1);
      if (e.key === 'ArrowLeft') mostrar(atual - 1);
    });
  })();

  /* ======================================================================
     7. FORMULÁRIO DO ORÇAMENTO
     ======================================================================
     O site não publica valores: o formulário junta o que a pessoa já sabe da
     festa (nome, data, tipo, número de convidados e um recado livre) e monta
     a mensagem do WhatsApp. Nada é enviado para servidor nenhum — o botão é
     um link `wa.me`, e é o próprio WhatsApp que entrega nome e telefone de
     quem escreve.

     A data ainda é checada contra a regra da promoção (segunda a quinta, até
     17/12/2026) só para avisar a pessoa. Feriado o site não sabe reconhecer.
     ====================================================================== */
  (function () {
    var zap = document.querySelector('[data-zap]');
    if (!zap) return;

    var LIMITE = new Date(2026, 11, 17);          // 17 de dezembro de 2026
    var DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
                'quinta-feira', 'sexta-feira', 'sábado'];
    var ZAP = 'https://wa.me/5531995406622?text=';

    var campos = {
      nome:    document.getElementById('f-nome'),
      data:    document.getElementById('f-data'),
      tipo:    document.getElementById('f-tipo'),
      pessoas: document.getElementById('f-pacote'),
      obs:     document.getElementById('f-obs')
    };
    var aviso = document.querySelector('[data-aviso]');

    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (campos.data) campos.data.min = iso(hoje);

    var data = null;
    var naPromocao = false;

    function iso(d) {
      return d.getFullYear() + '-' +
             ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
             ('0' + d.getDate()).slice(-2);
    }
    function maiuscula(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function curto(d) {
      return ('0' + d.getDate()).slice(-2) + '/' +
             ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    }

    /* a linha do resumo só existe enquanto o campo dela tiver conteúdo */
    function linha(nome, texto) {
      var el = document.querySelector('[data-linha="' + nome + '"]');
      if (!el) return;
      el.hidden = !texto;
      if (texto) el.querySelector('.resumo__val').textContent = texto;
    }

    function lerData() {
      var partes = (campos.data.value || '').split('-');
      if (partes.length !== 3) { data = null; aviso.hidden = true; return; }

      data = new Date(+partes[0], +partes[1] - 1, +partes[2]);
      data.setHours(0, 0, 0, 0);
      aviso.hidden = false;

      if (data < hoje) {
        data = null;
        aviso.setAttribute('data-tom', 'fora');
        aviso.textContent = 'Essa data já passou. Escolha um dia a partir de hoje.';
        return;
      }

      /* dois motivos diferentes para a data ficar fora da promoção, e cada um
         merece a sua frase: o dia da semana e o prazo de validade */
      var dia = data.getDay();
      var diaUtil = dia >= 1 && dia <= 4;
      naPromocao = diaUtil && data <= LIMITE;

      if (naPromocao) {
        aviso.setAttribute('data-tom', 'dentro');
        aviso.textContent = 'Boa escolha: ' + DIAS[dia] + ' entra na promoção de ' +
          'segunda a quinta. Feriados ficam de fora.';
      } else if (diaUtil) {
        aviso.setAttribute('data-tom', 'fora');
        aviso.textContent = 'A promoção de segunda a quinta vale para eventos até ' +
          'dezembro de 2026. Para depois disso, a gente monta o orçamento com você.';
      } else {
        aviso.setAttribute('data-tom', 'fora');
        aviso.textContent = maiuscula(DIAS[dia]) + ' fica fora da promoção de segunda ' +
          'a quinta. A festa acontece do mesmo jeito, com orçamento à parte.';
      }
    }

    function atualizar() {
      lerData();

      var nome = (campos.nome.value || '').trim();
      var tipo = campos.tipo.value;
      var tipoRot = campos.tipo.options[campos.tipo.selectedIndex].text;
      var pessoas = parseInt(campos.pessoas.value, 10) || 0;
      var obs = (campos.obs.value || '').trim();
      var quantos = pessoas > 120 ? 'mais de 120 convidados' : pessoas + ' convidados';

      linha('nome', nome);
      linha('data', data ? curto(data) + ' · ' + DIAS[data.getDay()] : '');
      linha('tipo', tipo ? tipoRot : '');
      linha('pessoas', pessoas ? quantos : '');

      /* a mensagem vai em linhas separadas: quem recebe lê os dados da festa de
         uma vez só, sem garimpar dentro de um parágrafo. Campo vazio não vira
         linha em branco — some da mensagem. */
      var linhas = [];
      if (nome) linhas.push('*Nome:* ' + nome);
      if (tipo) linhas.push('*Evento:* ' + tipoRot);
      if (data) linhas.push('*Data:* ' + curto(data) + ' (' + DIAS[data.getDay()] + ')');
      if (pessoas) linhas.push('*Convidados:* ' + (pessoas > 120 ? 'Mais de 120' : pessoas));

      var m = 'Olá! Vim pelo site do Salão Jardim Vitória e gostaria de um orçamento.';
      if (linhas.length) m += '\n\n' + linhas.join('\n');
      if (obs) m += '\n\n*Observação:* ' + obs;
      m += data ? '\n\nA data está livre?' : '\n\nQuais datas vocês têm livres?';

      zap.href = ZAP + encodeURIComponent(m);
    }

    Object.keys(campos).forEach(function (k) {
      if (!campos[k]) return;
      campos[k].addEventListener('change', atualizar);
      campos[k].addEventListener('input', atualizar);
    });

    atualizar();
  })();

})();

