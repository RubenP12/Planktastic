// ─── BACKOFFICE CONTENT LOADER ────────────
(function () {
  try {
    var d = JSON.parse(localStorage.getItem('planktastic_data') || 'null');
    if (!d) return;

    // Migration: restore spaces on hero-pre/hero-mid stripped by old trim bug
    if (d.texts) {
      var _mig = false;
      if (d.texts['hero-pre'] && !/\s$/.test(d.texts['hero-pre'])) { d.texts['hero-pre'] += ' '; _mig = true; }
      if (d.texts['hero-mid'] && !/^\s/.test(d.texts['hero-mid'])) { d.texts['hero-mid'] = ' ' + d.texts['hero-mid']; _mig = true; }
      if (_mig) localStorage.setItem('planktastic_data', JSON.stringify(d));
    }
    if (d.texts_pt) {
      var _migPt = false;
      if (d.texts_pt['hero-pre'] && !/\s$/.test(d.texts_pt['hero-pre'])) { d.texts_pt['hero-pre'] += ' '; _migPt = true; }
      if (d.texts_pt['hero-mid'] && !/^\s/.test(d.texts_pt['hero-mid'])) { d.texts_pt['hero-mid'] = ' ' + d.texts_pt['hero-mid']; _migPt = true; }
      if (_migPt) localStorage.setItem('planktastic_data', JSON.stringify(d));
    }

    // Apply text overrides (English defaults)
    Object.entries(d.texts || {}).forEach(function (entry) {
      var k = entry[0], v = entry[1];
      if (!v) return;
      document.querySelectorAll('[data-editable="' + k + '"]').forEach(function (el) {
        el.textContent = v;
      });
    });

    // Apply link overrides
    Object.entries(d.links || {}).forEach(function (entry) {
      var k = entry[0], url = entry[1];
      if (!url) return;
      document.querySelectorAll('[data-link-editable="' + k + '"]').forEach(function (el) {
        el.href = url;
      });
    });

    // Store PT overrides for use by setLang
    window.__boTextsPt = d.texts_pt || {};
    Object.entries(window.__boTextsPt).forEach(function (entry) {
      var k = entry[0], v = entry[1];
      if (!v) return;
      document.querySelectorAll('[data-editable="' + k + '"]').forEach(function (el) {
        el.setAttribute('data-pt', v);
      });
    });

    // Apply image overrides
    Object.entries(d.images || {}).forEach(function (entry) {
      var k = entry[0], src = entry[1];
      if (!src) return;
      document.querySelectorAll('[data-img-editable="' + k + '"]').forEach(function (el) {
        if (el.classList.contains('pi-avatar')) {
          el.innerHTML = '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
        } else {
          el.style.backgroundImage = 'url(' + src + ')';
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          var em = el.querySelector('.hc-emoji,.nc-emoji');
          if (em) em.style.opacity = '0';
        }
      });
    });

    // Apply logo
    if (d.logo) {
      ['nav-logo-img', 'hero-logo-img', 'footer-logo-img'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.src = d.logo;
      });
    }

    // Render news (if relevant containers exist on this page)
    if (d.news && d.news.length) {
      window.__boNewsItems = d.news;
      var _nc = function (item) {
        var ig = item.img ? 'background-image:url(' + item.img + ');background-size:cover;background-position:center;' : '';
        return '<div class="news-card reveal">' +
          '<div class="nc-img" style="' + ig + '">' + (item.img ? '' : '<span class="nc-emoji">🗞️</span>') + '</div>' +
          '<div class="nc-body">' +
          '<div class="nc-tag">' + (item.tag || '') + '</div>' +
          '<h3>' + (item.title || 'Untitled') + '</h3>' +
          '<p>' + (item.body || '') + '</p>' +
          (item.content_en ? '<a class="nc-more" href="news-article.html?id=' + item.id + '" data-en="Read more →" data-pt="Ler mais →">Read more →</a>' : (item.url ? '<a class="nc-more" href="' + item.url + '" target="_blank" rel="noopener" data-en="Read more →" data-pt="Ler mais →">Read more →</a>' : '')) +
          '</div></div>';
      };
      var hg = document.getElementById('home-news-grid');
      if (hg) { hg.innerHTML = d.news.slice(0, 3).map(_nc).join(''); observeReveals(); }
      var ng = document.getElementById('news-page-grid');
      if (ng) { ng.innerHTML = d.news.map(_nc).join(''); observeReveals(); }
    }

    // Render team (if relevant containers exist on this page)
    if (d.team && d.team.length) {
      var _init = function (n) {
        return ((n || '').split(' ').filter(function (w) { return w.length > 1; }).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase()) || '?';
      };
      var _tmc = function (m) {
        var ph = m.img ? '<img src="' + m.img + '" style="width:100%;height:100%;object-fit:cover;display:block">' : _init(m.name);
        var bd = m.isPi ? '<span class="tm-pi-badge">PI</span>' : '';
        var tg = (m.expertise || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean).map(function (t) { return '<span class="tm-tag">' + t + '</span>'; }).join('');
        var em = m.email ? '<a class="tm-email" href="mailto:' + m.email + '">✉ ' + m.email + '</a>' : '';
        var photoWrap = m.profileUrl ? '<a href="' + m.profileUrl + '" target="_blank" rel="noopener noreferrer" style="display:block" title="View profile">' : '';
        var photoWrapEnd = m.profileUrl ? '</a>' : '';
        return '<div class="tm-card">' + photoWrap + '<div class="tm-photo" style="' + (m.profileUrl ? 'cursor:pointer' : '') + '">' + ph + bd + '</div>' + photoWrapEnd + '<div class="tm-body">' + '<div class="tm-name">' + (m.name || '') + '</div>' + '<div class="tm-role">' + (m.role || '') + '</div>' + (tg ? '<div class="tm-tags">' + tg + '</div>' : '') + em + '</div></div>';
      };
      var ciim = d.team.filter(function (m) { return m.group === 'ciimar'; });
      var ines = d.team.filter(function (m) { return m.group === 'inesc'; });
      var cg = document.getElementById('team-ciimar-grid');
      if (cg) cg.innerHTML = ciim.length ? ciim.map(_tmc).join('') : '<p class="tm-empty">No members yet.</p>';
      var ig2 = document.getElementById('team-inesc-grid');
      if (ig2) ig2.innerHTML = ines.length ? ines.map(_tmc).join('') : '<p class="tm-empty">No members yet.</p>';
    }
  } catch (e) {
    console.warn('Planktastic content loader error:', e);
  }
})();

// Capture all data-editable EN state after backoffice data is applied (used to restore when switching back to EN)
var __enState = {};
(function () {
  document.querySelectorAll('[data-editable]').forEach(function (el) {
    var k = el.getAttribute('data-editable');
    if (k && !__enState[k]) __enState[k] = el.textContent;
  });
})();

// ─── LANGUAGE ─────────────────────────────
var TRANSLATIONS = {
  en: {
    'hero-desc': 'Planktastic investigates how microplastics affect plankton — the microscopic organisms that underpin all life in the ocean — using a novel combination of field ecology and autonomous detection technology.',
    'home-intro-title': 'A New Approach to Microplastics Research',
    'home-intro-body': 'PLANKTASTIC is an interdisciplinary research project investigating how microplastics affect plankton — the foundation of marine food webs. By integrating field monitoring with an innovative in-situ detection system and advanced ecological analysis, PLANKTASTIC will generate new evidence on the biological and ecological impacts of microplastics on plankton communities and marine ecosystem functioning.',
    'card1-title': 'Project Vision',
    'card1-body': 'Understanding and quantifying the ecological impacts of microplastics on plankton communities and marine ecosystem functioning across estuarine and coastal environments.',
    'card2-title': 'Research Approach',
    'card2-body': 'Six interconnected work packages linking field ecological monitoring, an autonomous in-situ detection system, and ecological and biological impact assessments.',
    'card3-title': 'Project Updates',
    'card3-body': 'Field sampling campaigns, milestone achievements, stakeholder workshops and dissemination events — follow Planktastic’s progress from launch to final framework.',
    'card4-title': 'Get in Touch',
    'card4-body': 'Collaborate, ask questions, or subscribe to our mailing list for updates on microplastics research, new datasets and project milestones.',
    'news1-tag': 'Project Launch · Jan 2025',
    'news1-title': 'Planktastic Kick-off Meeting',
    'news1-body': 'Planktastic officially launched with a kick-off meeting bringing together the CIIMAR and INESC TEC teams.',
    'news2-tag': 'Field Work · Spring 2025',
    'news2-title': 'First Field Campaigns Begin',
    'news2-body': 'Seasonal sampling begins at the Douro and Lima estuaries, collecting the first plankton and microplastics samples.',
    'news3-tag': 'Engagement · Sep 2025',
    'news3-title': 'First Stakeholder Workshop',
    'news3-body': 'Environmental managers, fisheries experts and NGOs gathered for Planktastic’s first stakeholder workshop.',
    'about-page-title': 'About Planktastic',
    'about-page-sub': 'Why we study microplastics and plankton — and why it matters',
    'about-title': 'Microplastics and the Plankton at Risk',
    'about-p1': 'Microplastics — plastic particles smaller than 5 mm — are now found in every corner of the world’s oceans, rivers and estuaries. They do not disappear; they accumulate, fragment, and interact with marine life in ways we are still only beginning to understand.',
    'about-p2': 'Plankton are at the heart of this story. These microscopic organisms — phytoplankton, zooplankton and fish larvae — form the very foundation of marine food webs. They produce more than half of Earth’s oxygen, drive the cycling of carbon through the ocean, and sustain the fisheries that billions of people depend on.',
    'about-p3': 'Yet we know surprisingly little about how microplastics affect plankton at the level of communities and ecosystems. Most research to date has focused on individual organisms in laboratory conditions — often using plastic concentrations far higher than those found in nature. Planktastic is changing that.',
    'about-p4': 'By combining seasonal field campaigns in Portuguese estuaries with a novel autonomous detection technology and robust ecological analysis, Planktastic will generate the large, real-world datasets needed to assess the true environmental risk that microplastics pose to plankton and marine ecosystems.',
    'aim1-title': 'Build an Open-Access Baseline',
    'aim1-body': 'Establish the first comprehensive, open-access dataset of microplastics and plankton from Portuguese estuaries and coastal areas — a scientific reference point that researchers worldwide can build upon.',
    'aim2-title': 'Develop a Novel Detection System',
    'aim2-body': 'Create a new autonomous spectroscopic instrument capable of detecting and characterising microplastics and plankton in the field, in real time — making monitoring faster, cheaper and more scalable than ever before.',
    'aim3-title': 'Assess Biological and Ecological Impacts',
    'aim3-body': 'Investigate how microplastics affect fish larvae, phytoplankton and zooplankton communities in real estuarine conditions — from ingestion and physical harm to disruption of photosynthesis and ecological structure.',
    'aim4-title': 'Deliver a Practical Management Framework',
    'aim4-body': 'Translate our scientific findings into a practical toolkit that environmental managers, policy-makers and monitoring programmes can adopt — in Portugal and beyond — to tackle plastic pollution in coastal seas.',
    'outputs-pub': 'Scientific publications will be listed here as the project progresses. All publications will be open-access, following FCT and EU open science policy.',
    'outputs-data': 'The open-access FAIR baseline dataset of microplastics and plankton from Portuguese estuaries will be available here from December 2025.',
    'outputs-conf': 'Conference presentations and posters will be listed here as the team participates in national and international scientific meetings.',
    'news-p1-tag': 'Project Launch · January 2025',
    'news-p1-title': 'Planktastic Kick-off Meeting',
    'news-p1-body': 'Planktastic officially launched with a kick-off meeting bringing together the CIIMAR and INESC TEC teams to review the work plan and align on project goals for 2025–2027.',
    'news-p2-tag': 'Field Work · Spring 2025',
    'news-p2-title': 'First Field Campaigns at Douro &amp; Lima Estuaries',
    'news-p2-body': 'Seasonal sampling begins at the Douro estuary in Porto and the Lima estuary in Viana do Castelo, collecting the first plankton tows and microplastics samples of the project.',
    'news-p3-tag': 'Engagement · September 2025',
    'news-p3-title': 'First Stakeholder Workshop (M2)',
    'news-p3-body': 'Environmental managers, fisheries experts and NGOs gathered for Planktastic’s first stakeholder workshop, exploring how the project can support real-world monitoring and policy decisions.',
    'contact-intro': 'Interested in collaborating, following our work, or learning more about Planktastic? We’d love to hear from you.',
    'acts-page-title': 'Activities',
    'acts-page-sub': 'From field campaigns to technology development — how Planktastic advances our understanding of microplastics',
    'act-fld1-title': 'Seasonal Plankton Surveys',
    'act-fld1-body': 'Plankton tows and water samples collected from the Douro and Lima estuaries across all seasons, identifying phytoplankton, zooplankton and fish larvae.',
    'act-fld2-title': 'Microplastics Sampling &amp; Analysis',
    'act-fld2-body': 'Quantifying and characterising microplastic particles by type, size, and polymer composition in estuarine and coastal waters.',
    'act-fld3-title': 'Biological Impact Experiments',
    'act-fld3-body': 'Laboratory experiments assessing how microplastics affect fish larvae ingestion, phytoplankton photosynthesis, and plankton community structure.',
    'act-fld4-title': 'eDNA &amp; Biodiversity Profiling',
    'act-fld4-body': 'Using environmental DNA (18S rRNA) to characterise phytoplankton diversity and model the ecological impacts of microplastics on marine food webs.',
    'act-tec1-title': 'Spectroscopic Detection Instrument',
    'act-tec1-body': 'A novel multispectral imaging system that identifies microplastics and plankton in real time, underwater to 100 m depth, without any laboratory processing.',
    'act-tec2-title': 'AI-Powered Classification',
    'act-tec2-body': 'Deep learning models trained to automatically classify plankton species and microplastic types from multispectral imagery, enabling scalable autonomous monitoring.',
    'act-tec3-title': 'Field Deployment &amp; Validation',
    'act-tec3-body': 'Testing and validating the detection system from vessels of opportunity — fishing boats and research vessels — in real estuarine and coastal conditions.',
    'act-kto1-title': 'Environmental Management Framework',
    'act-kto1-body': 'Co-designing a practical monitoring toolkit with environmental agencies, fisheries experts and NGOs, transferable to other regions and countries.',
    'act-kto2-title': 'Stakeholder Engagement',
    'act-kto2-body': 'Participatory workshops bringing together scientists, environmental managers, local fishers, maritime authorities and NGOs throughout the project.',
    'act-kto3-title': 'Open-Access Data Publication',
    'act-kto3-body': 'Publishing all field and laboratory data openly via EMODnet and CIIMAR Watch, following FAIR data principles and EU open science policy.',
    'act-kto4-title': 'Science Communication',
    'act-kto4-body': 'Itinerant exhibition with CMIA Matosinhos, open-access publications, conference presentations and school outreach — raising awareness of plastic pollution and the vital role of plankton.',
  },
  pt: {
    'hero-highlight': 'Microplásticos',
    'hero-subtitle': 'Compreendendo a Ameaça Invisível',
    'hero-desc': 'O Planktastic investiga como os microplásticos afetam o plâncton — os organismos microscópicos que sustentam toda a vida no oceano — utilizando uma combinação inovadora de ecologia de campo e tecnologia de deteção autónoma.',
    'home-intro-title': 'Uma Nova Abordagem à Investigação de Microplásticos',
    'home-intro-body': 'O PLANKTASTIC é um projeto de investigação interdisciplinar que estuda como os microplásticos afetam o plâncton — a base das cadeias alimentares marinhas. Ao integrar monitorização de campo com um sistema inovador de deteção in-situ e análise ecológica avançada, o PLANKTASTIC gerará novas evidências sobre os impactos biológicos e ecológicos dos microplásticos nas comunidades de plâncton e no funcionamento dos ecossistemas marinhos.',
    'card1-title': 'Visão do Projeto',
    'card1-body': 'Compreender e quantificar os impactos ecológicos dos microplásticos nas comunidades de plâncton e no funcionamento dos ecossistemas marinhos em ambientes estuarinos e costeiros.',
    'card2-title': 'Abordagem de Investigação',
    'card2-body': 'Seis pacotes de trabalho interligados que articulam monitorização ecológica de campo, um sistema autónomo de deteção in-situ e avaliações de impacto ecológico e biológico.',
    'card3-title': 'Atualizações do Projeto',
    'card3-body': 'Campanhas de amostragem de campo, marcos alcançados, workshops com stakeholders e eventos de divulgação — acompanhe o progresso do Planktastic desde o lançamento até ao quadro final.',
    'card4-title': 'Contactar',
    'card4-body': 'Colabore, coloque questões ou subscreva a nossa lista de correio para receber atualizações sobre investigação de microplásticos, novas bases de dados e marcos do projeto.',
    'news1-tag': 'Lançamento · Jan 2025',
    'news1-title': 'Reunião de Arranque do Planktastic',
    'news1-body': 'O Planktastic foi oficialmente lançado com uma reunião de arranque que reuniu as equipas do CIIMAR e do INESC TEC.',
    'news2-tag': 'Trabalho de Campo · Primavera 2025',
    'news2-title': 'Início das Primeiras Campanhas de Campo',
    'news2-body': 'A amostragem sazonal tem início nos estuários do Douro e do Lima, recolhendo as primeiras amostras de plâncton e microplásticos.',
    'news3-tag': 'Envolvimento · Set 2025',
    'news3-title': 'Primeiro Workshop com Stakeholders',
    'news3-body': 'Gestores ambientais, especialistas em pescas e ONGs reuniram-se para o primeiro workshop de stakeholders do Planktastic.',
    'about-page-title': 'Sobre o Planktastic',
    'about-page-sub': 'Porque estudamos microplásticos e plâncton — e porque é importante',
    'about-title': 'Os Microplásticos e o Plâncton em Risco',
    'about-p1': 'Os microplásticos — partículas de plástico com menos de 5 mm — são hoje encontrados em todos os cantos dos oceanos, rios e estuários do mundo. Não desaparecem; acumulam-se, fragmentam-se e interagem com a vida marinha de formas que ainda estamos a começar a compreender.',
    'about-p2': 'O plâncton está no centro desta história. Estes organismos microscópicos — fitoplâncton, zooplâncton e larvas de peixe — constituem a base das cadeias alimentares marinhas. Produzem mais de metade do oxigénio da Terra, impulsionam o ciclo do carbono no oceano e sustentam as pescas das quais dependem milhões de pessoas.',
    'about-p3': 'No entanto, sabemos surpreendentemente pouco sobre como os microplásticos afetam o plâncton ao nível das comunidades e dos ecossistemas. A maioria das investigações até à data incidiu sobre organismos individuais em condições laboratoriais. O Planktastic está a mudar isso.',
    'about-p4': 'Ao combinar campanhas de campo sazonais em estuários portugueses com uma nova tecnologia de deteção autónoma e análise ecológica robusta, o Planktastic gerará as grandes bases de dados reais necessárias para avaliar o verdadeiro risco ambiental que os microplásticos representam para o plâncton e os ecossistemas marinhos.',
    'aim1-title': 'Construir uma Base de Dados em Acesso Aberto',
    'aim1-body': 'Estabelecer a primeira base de dados abrangente e em acesso aberto de microplásticos e plâncton dos estuários e zonas costeiras portuguesas.',
    'aim2-title': 'Desenvolver um Sistema de Deteção Inovador',
    'aim2-body': 'Criar um novo instrumento espectroscópico autónomo capaz de detetar e caracterizar microplásticos e plâncton no campo, em tempo real.',
    'aim3-title': 'Avaliar os Impactos Biológicos e Ecológicos',
    'aim3-body': 'Investigar como os microplásticos afetam larvas de peixe, fitoplâncton e comunidades de zooplâncton em condições estuarinas reais.',
    'aim4-title': 'Desenvolver um Quadro de Gestão Prático',
    'aim4-body': 'Traduzir as nossas descobertas científicas num conjunto de ferramentas práticas que gestores ambientais, decisores políticos e programas de monitorização possam adotar.',
    'outputs-pub': 'As publicações científicas serão listadas aqui à medida que o projeto avança.',
    'outputs-data': 'A base de dados FAIR de referência em acesso aberto de microplásticos e plâncton dos estuários portugueses estará disponível aqui a partir de dezembro de 2025.',
    'outputs-conf': 'Apresentações e posters em conferências serão listados aqui.',
    'news-p1-tag': 'Lançamento do Projeto · Janeiro 2025',
    'news-p1-title': 'Reunião de Arranque do Planktastic',
    'news-p1-body': 'O Planktastic foi oficialmente lançado com uma reunião de arranque que reuniu as equipas do CIIMAR e do INESC TEC para rever o plano de trabalho.',
    'news-p2-tag': 'Trabalho de Campo · Primavera 2025',
    'news-p2-title': 'Primeiras Campanhas de Campo nos Estuários do Douro e Lima',
    'news-p2-body': 'A amostragem sazonal tem início no estuário do Douro no Porto e no estuário do Lima em Viana do Castelo.',
    'news-p3-tag': 'Envolvimento · Setembro 2025',
    'news-p3-title': 'Primeiro Workshop com Stakeholders (M2)',
    'news-p3-body': 'Gestores ambientais, especialistas em pescas e ONGs reuniram-se para o primeiro workshop de stakeholders do Planktastic.',
    'contact-intro': 'Interessado em colaborar, acompanhar o nosso trabalho ou saber mais sobre o Planktastic? Teremos muito gosto em ouvi-lo.',
    'acts-page-title': 'Atividades',
    'acts-page-sub': 'De campanhas de campo ao desenvolvimento tecnológico — como o Planktastic avança o conhecimento sobre microplásticos',
    'act-fld1-title': 'Amostragens Sazonais de Plâncton',
    'act-fld1-body': 'Arrastos de plâncton e amostras de água recolhidos nos estuários do Douro e Lima em todas as estações.',
    'act-fld2-title': 'Amostragem e Análise de Microplásticos',
    'act-fld2-body': 'Quantificação e caracterização de partículas de microplásticos por tipo, tamanho e composição de polímero.',
    'act-fld3-title': 'Experiências de Impacto Biológico',
    'act-fld3-body': 'Experiências laboratoriais que avaliam como os microplásticos afetam a ingestão por larvas de peixe.',
    'act-fld4-title': 'eDNA e Perfil de Biodiversidade',
    'act-fld4-body': 'Utilização de DNA ambiental (18S rRNA) para caracterizar a diversidade do fitoplâncton.',
    'act-tec1-title': 'Instrumento de Deteção Espectroscópica',
    'act-tec1-body': 'Um novo sistema de imagiologia multiespectral que identifica microplásticos e plâncton em tempo real.',
    'act-tec2-title': 'Classificação com Inteligência Artificial',
    'act-tec2-body': 'Modelos de deep learning treinados para classificar automaticamente espécies de plâncton e tipos de microplásticos.',
    'act-tec3-title': 'Implantação e Validação no Campo',
    'act-tec3-body': 'Teste e validação do sistema de deteção a partir de embarcações de oportunidade.',
    'act-kto1-title': 'Quadro de Gestão Ambiental',
    'act-kto1-body': 'Co-design de ferramentas práticas de monitorização com agências ambientais e ONGs.',
    'act-kto2-title': 'Envolvimento de Stakeholders',
    'act-kto2-body': 'Workshops participativos reunindo cientistas, gestores ambientais e ONGs ao longo do projeto.',
    'act-kto3-title': 'Publicação de Dados em Acesso Aberto',
    'act-kto3-body': 'Publicação de todos os dados de campo e laboratório em acesso aberto via EMODnet e CIIMAR Watch.',
    'act-kto4-title': 'Comunicação Científica',
    'act-kto4-body': 'Exposição itinerante com o CMIA Matosinhos, publicações em acesso aberto e ações nas escolas.',
    'hero-pre': 'Dos ', 'hero-mid': ' aos Ecossistemas Marinhos:'
  }
};

var currentLang = 'en';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('planktastic_lang', lang);

  // Update lang toggle buttons
  document.querySelectorAll('.ls-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  // Also update mobile menu lang buttons if present
  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    if (btn.tagName === 'BUTTON') {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    }
  });

  // Apply data-en / data-pt labels
  document.querySelectorAll('[data-en]').forEach(function (el) {
    var val = el.getAttribute('data-' + lang);
    if (val !== null) el.innerHTML = val;
  });

  // Apply translation table overrides (data-editable fields)
  var t = TRANSLATIONS[lang] || {};
  Object.entries(t).forEach(function (entry) {
    var key = entry[0], text = entry[1];
    document.querySelectorAll('[data-editable="' + key + '"]').forEach(function (el) {
      el.innerHTML = text;
    });
    document.querySelectorAll('[data-i18n="' + key + '"]').forEach(function (el) {
      el.innerHTML = text;
    });
  });

  // Apply backoffice PT overrides if lang === pt
  // Skip any value that matches the EN translation — it was stored by mistake.
  if (lang === 'pt') {
    var enT = TRANSLATIONS.en || {};
    Object.entries(window.__boTextsPt || {}).forEach(function (entry) {
      var k = entry[0], v = entry[1];
      if (!v) return;
      if (enT[k] && v === enT[k]) return;
      document.querySelectorAll('[data-editable="' + k + '"]').forEach(function (el) {
        el.textContent = v;
      });
    });
  }

  // Restore all EN state when switching back to EN (overrides any hardcoded TRANSLATIONS.en values)
  if (lang === 'en') {
    Object.keys(__enState).forEach(function (k) {
      var v = __enState[k];
      if (!v) return;
      document.querySelectorAll('[data-editable="' + k + '"]').forEach(function (el) {
        el.textContent = v;
      });
    });
  }

  // Re-render news grids with correct language (uses tag_pt/title_pt/body_pt if available)
  if (window.__boNewsItems && window.__boNewsItems.length) {
    var usePt = lang === 'pt';
    var _renderNc = function (item) {
      var tag   = (usePt && item.tag_pt)   ? item.tag_pt   : (item.tag   || '');
      var title = (usePt && item.title_pt) ? item.title_pt : (item.title || 'Untitled');
      var body  = (usePt && item.body_pt)  ? item.body_pt  : (item.body  || '');
      var ig = item.img ? 'background-image:url(' + item.img + ');background-size:cover;background-position:center;' : '';
      return '<div class="news-card reveal shown">' +
        '<div class="nc-img" style="' + ig + '">' + (item.img ? '' : '<span class="nc-emoji">🗞️</span>') + '</div>' +
        '<div class="nc-body">' +
        '<div class="nc-tag">' + tag + '</div>' +
        '<h3>' + title + '</h3>' +
        '<p>' + body + '</p>' +
        (item.content_en ? '<a class="nc-more" href="news-article.html?id=' + item.id + '" data-en="Read more →" data-pt="Ler mais →">' + (lang === 'pt' ? 'Ler mais →' : 'Read more →') + '</a>' : (item.url ? '<a class="nc-more" href="' + item.url + '" target="_blank" rel="noopener" data-en="Read more →" data-pt="Ler mais →">' + (lang === 'pt' ? 'Ler mais →' : 'Read more →') + '</a>' : '')) +
        '</div></div>';
    };
    var hg = document.getElementById('home-news-grid');
    if (hg) hg.innerHTML = window.__boNewsItems.slice(0, 3).map(_renderNc).join('');
    var ng = document.getElementById('news-page-grid');
    if (ng) ng.innerHTML = window.__boNewsItems.map(_renderNc).join('');
  }
}

// Restore saved language on page load
(function () {
  var l = localStorage.getItem('planktastic_lang');
  if (l && l !== 'en') setLang(l);
})();

// ─── ACTIVE NAV LINK ──────────────────────
(function () {
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').split('/').pop();
    if (href === page) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
})();

// ─── NAV SCROLL SHADOW ────────────────────
window.addEventListener('scroll', function () {
  var nav = document.getElementById('nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// ─── MOBILE NAV ───────────────────────────
function toggleMobile() {
  var menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

// ─── REVEAL ANIMATIONS ────────────────────
var revealObs = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (e.isIntersecting) e.target.classList.add('shown');
  });
}, { threshold: 0.08 });

function observeReveals() {
  document.querySelectorAll('.reveal:not(.shown)').forEach(function (el) {
    revealObs.observe(el);
  });
}

observeReveals();

// Immediately show reveals already in viewport on load
setTimeout(function () {
  document.querySelectorAll('.reveal').forEach(function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add('shown');
    }
  });
}, 100);

// ─── FORMSPREE FORMS ──────────────────────
var FORMSPREE_CONTACT   = 'mojrlqap';
var FORMSPREE_SUBSCRIBE = 'mzdovbba';

function _showFormMsg(id, msg, ok) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = ok ? 'form-success' : 'form-error';
  el.style.display = 'block';
  if (ok) setTimeout(function () { el.style.display = 'none'; }, 7000);
}

async function sendContactForm(e) {
  e.preventDefault();
  var btn   = e.submitter;
  var first = document.getElementById('cf-first').value.trim();
  var last  = document.getElementById('cf-last').value.trim();
  var email = document.getElementById('cf-email').value.trim();
  var msg   = document.getElementById('cf-msg').value.trim();
  if (!email || !msg) { _showFormMsg('cf-status', 'Please fill in your email and message.', false); return; }
  if (!FORMSPREE_CONTACT) { _showFormMsg('cf-status', 'Form not yet connected.', false); return; }
  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    var res = await fetch('https://formspree.io/f/' + FORMSPREE_CONTACT, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: first, lastName: last, email: email, message: msg })
    });
    if (res.ok) {
      _showFormMsg('cf-status', '✓ Message sent! We\'ll be in touch soon.', true);
      ['cf-first', 'cf-last', 'cf-email', 'cf-msg'].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = '';
      });
    } else {
      var d = await res.json();
      _showFormMsg('cf-status', d.error || 'Something went wrong. Please try again.', false);
    }
  } catch (_) { _showFormMsg('cf-status', 'Network error. Please try again.', false); }
  btn.disabled = false; btn.textContent = 'Send Message →';
}

async function subscribeMailList() {
  var email   = document.getElementById('ml-email') ? document.getElementById('ml-email').value.trim() : '';
  var consent = document.getElementById('ml-consent') ? document.getElementById('ml-consent').checked : false;
  if (!email)   { _showFormMsg('ml-status', 'Please enter your email address.', false); return; }
  if (!consent) { _showFormMsg('ml-status', 'Please tick the consent box to subscribe.', false); return; }
  if (!FORMSPREE_SUBSCRIBE) { _showFormMsg('ml-status', 'Form not yet connected.', false); return; }
  var btn = document.querySelector('.btn-subscribe');
  if (btn) { btn.disabled = true; btn.textContent = 'Subscribing…'; }
  try {
    var res = await fetch('https://formspree.io/f/' + FORMSPREE_SUBSCRIBE, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, type: 'mailing-list' })
    });
    if (res.ok) {
      _showFormMsg('ml-status', '✓ You\'re subscribed! Thank you.', true);
      var mlEl = document.getElementById('ml-email'); if (mlEl) mlEl.value = '';
      var cbEl = document.getElementById('ml-consent'); if (cbEl) cbEl.checked = false;
    } else {
      _showFormMsg('ml-status', 'Something went wrong. Please try again.', false);
    }
  } catch (_) { _showFormMsg('ml-status', 'Network error. Please try again.', false); }
  if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
}

// ─── COOKIE CONSENT ──────────────────────
(function () {
  var KEY = 'planktastic_cookie_consent';
  var consent = localStorage.getItem(KEY);

  if (consent === 'accepted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    return;
  }
  if (consent === 'declined') return;

  var style = document.createElement('style');
  style.textContent =
    '#cc-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;' +
    'background:rgba(0,10,22,0.97);backdrop-filter:blur(10px);' +
    'border-top:1px solid rgba(20,180,220,0.18);' +
    'padding:1rem 1.5rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;' +
    'transform:translateY(100%);transition:transform .38s cubic-bezier(.34,1.56,.64,1);}' +
    '#cc-banner.cc-in{transform:translateY(0);}' +
    '#cc-banner p{flex:1;min-width:180px;font-size:.8rem;color:rgba(255,255,255,.7);line-height:1.6;margin:0;}' +
    '.cc-btns{display:flex;gap:.75rem;align-items:center;flex-shrink:0;}' +
    '#cc-accept{background:#14b4dc;color:#00101f;border:none;padding:.5rem 1.4rem;' +
    'font-family:\'Raleway\',sans-serif;font-size:.72rem;font-weight:700;letter-spacing:.08em;' +
    'text-transform:uppercase;cursor:pointer;transition:background .2s,transform .15s;}' +
    '#cc-accept:hover{background:#fff;transform:translateY(-1px);}' +
    '#cc-accept:focus-visible{outline:2px solid #14b4dc;outline-offset:2px;}' +
    '#cc-decline{background:none;border:none;color:rgba(255,255,255,.38);' +
    'font-family:\'Raleway\',sans-serif;font-size:.72rem;font-weight:600;letter-spacing:.06em;' +
    'text-transform:uppercase;cursor:pointer;padding:.5rem 0;transition:color .2s;}' +
    '#cc-decline:hover{color:rgba(255,255,255,.7);}' +
    '#cc-decline:focus-visible{outline:2px solid rgba(255,255,255,.4);outline-offset:2px;}';
  document.head.appendChild(style);

  var lang = localStorage.getItem('planktastic_lang') || 'en';
  var txt = lang === 'pt'
    ? 'Utilizamos cookies (Google Analytics) para perceber como os visitantes utilizam o nosso site. Nenhum dado pessoal é vendido ou partilhado.'
    : 'We use cookies (Google Analytics) to understand how visitors use our site. No personal data is sold or shared.';
  var acceptLbl = lang === 'pt' ? 'Aceitar' : 'Accept';
  var declineLbl = lang === 'pt' ? 'Recusar' : 'Decline';

  var banner = document.createElement('div');
  banner.id = 'cc-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML =
    '<p data-en="We use cookies (Google Analytics) to understand how visitors use our site. No personal data is sold or shared." ' +
    'data-pt="Utilizamos cookies (Google Analytics) para perceber como os visitantes utilizam o nosso site. Nenhum dado pessoal é vendido ou partilhado.">' +
    txt + '</p>' +
    '<div class="cc-btns">' +
    '<button id="cc-accept" data-en="Accept" data-pt="Aceitar">' + acceptLbl + '</button>' +
    '<button id="cc-decline" data-en="Decline" data-pt="Recusar">' + declineLbl + '</button>' +
    '</div>';
  document.body.appendChild(banner);

  setTimeout(function () { banner.classList.add('cc-in'); }, 150);

  function dismiss(accepted) {
    localStorage.setItem(KEY, accepted ? 'accepted' : 'declined');
    if (accepted) gtag('consent', 'update', { analytics_storage: 'granted' });
    banner.style.transition = 'transform .25s ease-in, opacity .25s ease-in';
    banner.style.transform = 'translateY(100%)';
    banner.style.opacity = '0';
    setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 280);
  }

  document.getElementById('cc-accept').addEventListener('click', function () { dismiss(true); });
  document.getElementById('cc-decline').addEventListener('click', function () { dismiss(false); });
})();
