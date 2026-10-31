export type Locale = 'fr' | 'en' | 'pt';

export interface Translations {
  nav: {
    home: string;
    portfolio: string;
    about: string;
    contact: string;
    mentions: string;
    inquireNow: string;
  };
  hero: {
    subtitle: string;
    title: string;
    description: string;
    explorePortfolio: string;
    inquire: string;
    scrollDown: string;
    locationBadge: string;
  };
  portfolio: {
    tagline: string;
    title: string;
    subtitle: string;
    all: string;
    weddings: string;
    editorials: string;
    portraits: string;
    details: string;
    viewProject: string;
    closeModal: string;
    filmDetails: string;
    capturedAt: string;
  };
  about: {
    tagline: string;
    title: string;
    subtitle: string;
    locationLine: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    quote: string;
    quoteAuthor: string;
    pillarsTitle: string;
    pillars: Array<{
      number: string;
      title: string;
      description: string;
    }>;
    languagesLabel: string;
    ctaLabel: string;
  };
  contact: {
    tagline: string;
    title: string;
    subtitle: string;
    form: {
      fullName: string;
      fullNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      eventDate: string;
      eventDatePlaceholder: string;
      destination: string;
      destinationPlaceholder: string;
      destinations: string[];
      guestCount: string;
      guestCountOptions: string[];
      message: string;
      messagePlaceholder: string;
      submit: string;
      submitting: string;
      successTitle: string;
      successMessage: string;
      privacyNotice: string;
    };
    directContact: string;
    whatsappText: string;
    whatsappButton: string;
    locationNote: string;
  };
  footer: {
    rights: string;
    curatedWithLove: string;
    mentionsLegales: string;
    privacy: string;
    top: string;
  };
  mentions: {
    title: string;
    subtitle: string;
    editorTitle: string;
    editorContent: string;
    hostingTitle: string;
    hostingContent: string;
    ipTitle: string;
    ipContent: string;
    privacyTitle: string;
    privacyContent: string;
    close: string;
  };
}

export const translations: Record<Locale, Translations> = {
  fr: {
    nav: {
      home: "Accueil",
      portfolio: "Portfolio",
      about: "À Propos",
      contact: "Contact & Devis",
      mentions: "Mentions Légales",
      inquireNow: "Réserver Votre Date",
    },
    hero: {
      subtitle: "Photographie Fine Art de Mariage & Éditoriale",
      title: "L'art de capturer l'élégance intemporelle & l'émotion pure.",
      description: "Basé en France, disponible pour des mariages d'exception et des reportages éditoriaux à travers toute l'Europe et le monde.",
      explorePortfolio: "Découvrir la Galerie",
      inquire: "Demander une Disponibilité",
      scrollDown: "Faites défiler",
      locationBadge: "France & International",
    },
    portfolio: {
      tagline: "GALERIE ÉDITORIALE",
      title: "Histoires Choisies",
      subtitle: "Une sélection curatée de célébrations romantiques, séances sur les falaises normandes, portraits en lumière dorée et branding d'exception.",
      all: "Tout",
      weddings: "Mariages & Célébrations",
      editorials: "Destinations & Séries",
      portraits: "Portraits d'Art",
      details: "Branding & Détails",
      viewProject: "Explorer la Série",
      closeModal: "Fermer l'Aperçu",
      filmDetails: "Prise de vue argentique & numérique hybride",
      capturedAt: "Lieu",
    },
    about: {
      tagline: "LE PHOTOGRAPHE",
      title: "Kennedy Wanderson",
      subtitle: "Une quête sensible de la lumière dorée, du geste vrai et de l'élégance naturelle.",
      locationLine: "France · Normandie · International",
      paragraph1: "Basé en France, Kennedy Wanderson façonne une photographie lumineuse et intemporelle où l'émotion sincère rencontre le sens du détail éditorial. Son regard puise dans la douceur de la lumière naturelle pour composer des images vivantes, poétiques et durables.",
      paragraph2: "Son travail embrasse aussi bien l'intensité d'un mariage sous un ciel de guirlandes étoilées, l'élan romantique d'une séance sur les falaises sauvages d'Étretat en Normandie, la grâce d'un portrait au soleil couchant dans un village français de caractère, que la précision d'un reportage de branding en studio.",
      paragraph3: "Alliant la discrétion d'un observateur attentif à une direction artistique bienveillante, Kennedy accompagne chaque couple, particulier et créateur avec sérénité — en français, portugais et anglais — du premier échange jusqu'à la remise de vos souvenirs.",
      quote: "La véritable élégance ne cherche jamais l'artifice : elle réside dans la sincérité d'un regard et la justesse d'une lumière.",
      quoteAuthor: "Kennedy Wanderson",
      pillarsTitle: "Univers & Savoir-Faire",
      pillars: [
        {
          number: "01",
          title: "Mariages & Célébrations",
          description: "Reportages sur le vif, portraits de mariée au crépuscule et réceptions chaleureuses capturés avec délicatesse.",
        },
        {
          number: "02",
          title: "Séances Destination",
          description: "Escapades poétiques en couple face aux falaises d'Étretat, sur la côte normande et à travers l'Europe.",
        },
        {
          number: "03",
          title: "Portraits & Art de Vivre",
          description: "Portraits fine art en lumière dorée, jardins secrets et charme authentique du patrimoine français.",
        },
        {
          number: "04",
          title: "Branding & Studio",
          description: "Portraits signatures, gestuelle haute précision et univers visuel sur-mesure pour maisons et entrepreneurs.",
        },
      ],
      languagesLabel: "Accompagnement trilingue · Français · Português · English",
      ctaLabel: "Échanger sur votre projet",
    },
    contact: {
      tagline: "COMMENCER VOTRE HISTOIRE",
      title: "Contact & Disponibilités",
      subtitle: "Afin d'offrir une attention sur mesure et une disponibilité absolue, nous acceptons un nombre limité de mariages chaque saison.",
      form: {
        fullName: "Vos Prénoms & Noms",
        fullNamePlaceholder: "ex: Claire Laurent & Julien Moreau",
        email: "Adresse E-mail",
        emailPlaceholder: "votre.email@exemple.com",
        phone: "Téléphone / WhatsApp",
        phonePlaceholder: "+33 6 12 34 56 78",
        eventDate: "Date du Mariage / Événement",
        eventDatePlaceholder: "JJ / MM / AAAA ou Saison",
        destination: "Lieu & Destination",
        destinationPlaceholder: "Sélectionnez votre destination",
        destinations: [
          "France — Paris & Île-de-France",
          "France — Provence & Côte d'Azur",
          "France — Châteaux de la Loire & Normandie",
          "Italie — Lac de Côme, Toscane & Amalfi",
          "Portugal — Lisbonne, Douro & Sintra",
          "Brésil — São Paulo, Rio ou Destination",
          "Autre destination internationale",
        ],
        guestCount: "Nombre d'Invités Estimé",
        guestCountOptions: [
          "Élégant & Intime (< 50 invités)",
          "Mariage Moyen (50 – 150 invités)",
          "Grand Mariage (> 150 invités)",
        ],
        message: "Votre Vision & Vos Souhaits",
        messagePlaceholder: "Racontez-nous votre rencontre, le style de votre célébration et les détails qui vous tiennent à cœur...",
        submit: "Envoyer Notre Demande",
        submitting: "Transmission en cours...",
        successTitle: "Demande Transmise avec Succès",
        successMessage: "Merci pour votre confiance. Kennedy Wanderson vous répondra personnellement sous 24 à 48 heures.",
        privacyNotice: "Conformément au RGPD et aux directives de la CNIL, vos informations sont exclusivement utilisées pour étudier votre projet et ne seront jamais transmises à des tiers.",
      },
      directContact: "Échange Direct",
      whatsappText: "Préférez-vous échanger directement via WhatsApp ?",
      whatsappButton: "Contacter sur WhatsApp",
      locationNote: "Studio & Résidence : France. Disponible dans le monde entier.",
    },
    footer: {
      rights: "Tous droits réservés.",
      curatedWithLove: "Fine Art Photography — France & Worldwide",
      mentionsLegales: "Mentions Légales & Confidentialité",
      privacy: "Politique de Données",
      top: "Retour en haut",
    },
    mentions: {
      title: "Mentions Légales & RGPD",
      subtitle: "Conformément aux dispositions de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'Économie Numérique (LCEN) et du RGPD.",
      editorTitle: "1. Éditeur du Site",
      editorContent: "Le présent site internet est édité et géré par Kennedy Wanderson, photographe professionnel indépendant. Activité domiciliée en France. Contact : contact@kennedywanderson.com.",
      hostingTitle: "2. Hébergement & Infrastructure",
      hostingContent: "Le site est hébergé sur des infrastructures situées au sein de l'Union Européenne (Région France / Paris). CDN Edge mondial assurant une haute sécurité et une latence minimale.",
      ipTitle: "3. Propriété Intellectuelle & Droits d'Auteur",
      ipContent: "L'ensemble des photographies, textes, visuels et éléments graphiques présentés sur ce site sont la propriété exclusive de Kennedy Wanderson et sont protégés par le Code de la Propriété Intellectuelle français et les traités internationaux. Toute reproduction, diffusion ou utilisation sans autorisation écrite préalable est strictement interdite.",
      privacyTitle: "4. Données Personnelles (RGPD & CNIL)",
      privacyContent: "Ce site respecte scrupuleusement la vie privée de ses visiteurs. Aucun cookie traceur publicitaire intrusif n'est déposé. Les informations recueillies via le formulaire de contact ont pour seule fin l'élaboration de propositions commerciales et sont conservées pendant une durée maximale de 2 ans. Vous bénéficiez d'un droit d'accès, de rectification et d'effacement de vos données sur simple demande par e-mail.",
      close: "Fermer",
    },
  },
  en: {
    nav: {
      home: "Home",
      portfolio: "Portfolio",
      about: "About",
      contact: "Inquire & Booking",
      mentions: "Legal Notice",
      inquireNow: "Reserve Your Date",
    },
    hero: {
      subtitle: "Fine Art Destination Wedding & Editorial Photographer",
      title: "Capturing timeless grace, luminous romance & authentic emotion.",
      description: "Based in France, documenting extraordinary weddings and luxury destination celebrations across Europe and worldwide.",
      explorePortfolio: "Explore The Portfolio",
      inquire: "Check Availability",
      scrollDown: "Scroll to discover",
      locationBadge: "France & Worldwide",
    },
    portfolio: {
      tagline: "CURATED GALLERY",
      title: "Featured Stories",
      subtitle: "A curated collection of heartfelt celebrations, Normandy sea-cliff sessions, golden-hour portraits, and luxury branding.",
      all: "All",
      weddings: "Weddings & Celebrations",
      editorials: "Destination Sessions",
      portraits: "Fine Art Portraits",
      details: "Branding & Details",
      viewProject: "View Full Story",
      closeModal: "Close Story",
      filmDetails: "Medium format film & digital hybrid capture",
      capturedAt: "Location",
    },
    about: {
      tagline: "THE ARTIST",
      title: "Kennedy Wanderson",
      subtitle: "A quiet devotion to golden light, unscripted emotion, and natural elegance.",
      locationLine: "France · Normandy · Worldwide",
      paragraph1: "Based in France, Kennedy Wanderson crafts luminous, timeless imagery where genuine human connection meets refined editorial composition. Guided by natural light, his photographs preserve fleeting moments as enduring visual poetry.",
      paragraph2: "His portfolio spans heartfelt wedding celebrations beneath twinkling garden lights, windswept couple sessions along the dramatic chalk cliffs of Étretat in Normandy, golden-hour portraits through historic French villages, and bespoke studio branding for wellness and creative ateliers.",
      paragraph3: "Balancing calm documentary discretion with gentle, thoughtful art direction, Kennedy offers couples, individuals, and brands an effortless, elevated experience—fluently in French, Portuguese, and English—from initial conversation to final gallery.",
      quote: "True elegance never relies on artifice; it lives in the sincerity of a glance and the quiet grace of light.",
      quoteAuthor: "Kennedy Wanderson",
      pillarsTitle: "Signature Universes",
      pillars: [
        {
          number: "01",
          title: "Weddings & Celebrations",
          description: "Heartfelt documentary storytelling, twilight bridal portraits, and joyful open-air receptions across France.",
        },
        {
          number: "02",
          title: "Destination Sessions",
          description: "Cinematic couple stories framed by the sea cliffs of Étretat, Normandy's coastline, and European landscapes.",
        },
        {
          number: "03",
          title: "Fine Art Portraits",
          description: "Golden-hour portraits, sunlit woodlands, and effortless French art de vivre in historic stone villages.",
        },
        {
          number: "04",
          title: "Studio & Branding",
          description: "Executive portraits, sensory rituals, and macro craftsmanship tailored for refined personal brands and ateliers.",
        },
      ],
      languagesLabel: "Trilingual guidance · Français · Português · English",
      ctaLabel: "Inquire about your date",
    },
    contact: {
      tagline: "BEGIN THE JOURNEY",
      title: "Inquire & Availability",
      subtitle: "To ensure thoughtful attention and complete dedication to each client, Kennedy accepts an exclusive collection of destination commissions each year.",
      form: {
        fullName: "Full Names of the Couple",
        fullNamePlaceholder: "e.g. Claire Laurent & Julien Moreau",
        email: "Email Address",
        emailPlaceholder: "your.email@example.com",
        phone: "Phone / WhatsApp",
        phonePlaceholder: "+33 6 12 34 56 78",
        eventDate: "Wedding / Event Date",
        eventDatePlaceholder: "DD / MM / YYYY or Anticipated Season",
        destination: "Destination & Venue",
        destinationPlaceholder: "Select your destination region",
        destinations: [
          "France — Paris & Île-de-France",
          "France — Provence & French Riviera",
          "France — Loire Valley Châteaux & Normandy",
          "Italy — Lake Como, Tuscany & Amalfi Coast",
          "Portugal — Lisbon, Douro & Sintra",
          "Brazil — Rio, São Paulo or Coastline",
          "Other International Destination",
        ],
        guestCount: "Estimated Guest Count",
        guestCountOptions: [
          "Intimate Gathering (< 50 guests)",
          "Mid-Sized Celebration (50 – 150 guests)",
          "Grand Destination Wedding (> 150 guests)",
        ],
        message: "Your Story & Aesthetic Vision",
        messagePlaceholder: "Share how you met, your venue plans, and the memories you hold dearest...",
        submit: "Submit Your Inquiry",
        submitting: "Sending Inquiry...",
        successTitle: "Inquiry Successfully Received",
        successMessage: "Thank you for reaching out. Kennedy Wanderson will personally review your date and respond within 24 to 48 hours.",
        privacyNotice: "Under European GDPR and CNIL standards, your information is protected with absolute confidentiality and used solely to prepare your bespoke proposal.",
      },
      directContact: "Direct Conversation",
      whatsappText: "Would you prefer a swift conversation via WhatsApp?",
      whatsappButton: "Chat on WhatsApp",
      locationNote: "Based in France — traveling worldwide for commissioned celebrations.",
    },
    footer: {
      rights: "All rights reserved.",
      curatedWithLove: "Fine Art Photography — France & Worldwide",
      mentionsLegales: "Legal Notice & Privacy",
      privacy: "Privacy Policy",
      top: "Back to top",
    },
    mentions: {
      title: "Legal Notice & GDPR",
      subtitle: "In accordance with French Law No. 2004-575 of June 21, 2004 (LCEN) and European GDPR regulations.",
      editorTitle: "1. Website Publisher",
      editorContent: "This website is published and managed by Kennedy Wanderson, independent professional photographer headquartered in France. Contact: contact@kennedywanderson.com.",
      hostingTitle: "2. Infrastructure & Hosting",
      hostingContent: "Hosted on secure European infrastructure located in Paris, France, paired with global edge acceleration to guarantee optimal response times worldwide.",
      ipTitle: "3. Intellectual Property & Copyright",
      ipContent: "All photographs, artworks, typography, and text published on this domain are the exclusive copyright of Kennedy Wanderson and protected by international intellectual property treaties. Unauthorized reproduction is strictly prohibited.",
      privacyTitle: "4. Data Privacy & CNIL Compliance",
      privacyContent: "We operate without intrusive third-party advertising cookies. Information submitted via inquiry forms is stored exclusively to address event bookings for up to two years. You retain full rights to request modification or deletion of your records anytime.",
      close: "Close",
    },
  },
  pt: {
    nav: {
      home: "Início",
      portfolio: "Portfólio",
      about: "Sobre",
      contact: "Contato & Orçamento",
      mentions: "Aviso Legal",
      inquireNow: "Reserve Sua Data",
    },
    hero: {
      subtitle: "Fotografia Fine Art de Casamentos & Editorial",
      title: "A arte de registrar o afeto com luz sublime & elegância atemporal.",
      description: "Radicado na França, registrando celebrações memoráveis e casamentos de destino na Europa, no Brasil e pelo mundo.",
      explorePortfolio: "Conhecer o Portfólio",
      inquire: "Consultar Disponibilidade",
      scrollDown: "Role para explorar",
      locationBadge: "França & Internacional",
    },
    portfolio: {
      tagline: "CURADORIA EXCLUSIVA",
      title: "Histórias Selecionadas",
      subtitle: "Uma seleção poética de celebrações inesquecíveis, ensaios nas falésias da Normandia, retratos na luz dourada e branding sensorial.",
      all: "Todos",
      weddings: "Casamentos & Celebrações",
      editorials: "Ensaios Destination",
      portraits: "Retratos Autorais",
      details: "Branding & Detalhes",
      viewProject: "Ver História Completa",
      closeModal: "Fechar História",
      filmDetails: "Fotografia em filme de médio formato e digital híbrido",
      capturedAt: "Localização",
    },
    about: {
      tagline: "O ARTISTA",
      title: "Kennedy Wanderson",
      subtitle: "Sensibilidade luminosa, olhar sereno e devoção permanente à beleza autêntica.",
      locationLine: "França · Normandia · Internacional",
      paragraph1: "Radicado na França, Kennedy Wanderson constrói uma fotografia luminosa e atemporal onde a emoção espontânea encontra o rigor da composição editorial. Guiado pela luz natural, seu olhar transforma instantes reais em memórias poéticas que atravessam o tempo.",
      paragraph2: "Seu trabalho transita com naturalidade entre celebrações de casamento sob luzes acolhedoras ao entardecer, ensaios de casal nas monumentais falésias de Étretat na Normandia, retratos na luz dourada em vilarejos históricos franceses e projetos de branding pessoal e estúdio de alta precisão.",
      paragraph3: "Unindo a discrição do registro documental a uma direção de arte leve e acolhedora, Kennedy oferece a cada casal, retratado ou marca uma experiência tranquila e personalizada — com atendimento fluente em português, francês e inglês — do primeiro contato à entrega final.",
      quote: "A verdadeira elegância dispensa excessos: ela nasce da verdade de um gesto e da delicadeza da luz.",
      quoteAuthor: "Kennedy Wanderson",
      pillarsTitle: "Universo & Especialidades",
      pillars: [
        {
          number: "01",
          title: "Casamentos & Celebrações",
          description: "Registro documental sensível, retratos de noiva ao crepúsculo e a emoção genuína de cada abraço.",
        },
        {
          number: "02",
          title: "Ensaios Destination",
          description: "Histórias cinematográficas de casais nas falésias de Étretat, na costa da Normandia e pela Europa.",
        },
        {
          number: "03",
          title: "Retratos & Art de Vivre",
          description: "Retratos autorais na luz dourada, jardins históricos e a atmosfera encantadora dos vilarejos franceses.",
        },
        {
          number: "04",
          title: "Branding & Estúdio",
          description: "Retratos profissionais, gestos de precisão e narrativa visual refinada para especialistas e marcas.",
        },
      ],
      languagesLabel: "Atendimento trilíngue · Português · Français · English",
      ctaLabel: "Conversar sobre o seu projeto",
    },
    contact: {
      tagline: "COMECE SUA JORNADA",
      title: "Contato & Disponibilidade",
      subtitle: "Para garantir atenção exclusiva e cuidado integral com cada casal, aceitamos um número limitado de celebrações a cada temporada.",
      form: {
        fullName: "Nomes dos Noivos",
        fullNamePlaceholder: "ex: Claire Laurent & Julien Moreau",
        email: "E-mail de Contato",
        emailPlaceholder: "seu.email@exemplo.com",
        phone: "Telefone / WhatsApp",
        phonePlaceholder: "+33 6 12 34 56 78 ou (11) 98765-4321",
        eventDate: "Data do Evento",
        eventDatePlaceholder: "DD / MM / AAAA ou Época do Ano",
        destination: "Destino & Espaço",
        destinationPlaceholder: "Selecione o destino do seu casamento",
        destinations: [
          "França — Paris & Île-de-France",
          "França — Provence & Côte d'Azur",
          "França — Châteaux do Loire & Normandia",
          "Itália — Lago de Como, Toscana & Costa Amalfitana",
          "Portugal — Lisboa, Douro & Sintra",
          "Brasil — São Paulo, Rio ou Destinos Litorâneos",
          "Outro Destino Internacional",
        ],
        guestCount: "Número Estimado de Convidados",
        guestCountOptions: [
          "Casamento Íntimo (< 50 convidados)",
          "Médio Porte (50 – 150 convidados)",
          "Grande Celebração (> 150 convidados)",
        ],
        message: "Sua História & Expectativas",
        messagePlaceholder: "Conte-nos como se conheceram, os detalhes do espaço e o que sonham para as memórias desse dia...",
        submit: "Enviar Solicitação",
        submitting: "Enviando Mensagem...",
        successTitle: "Mensagem Enviada com Sucesso",
        successMessage: "Muito obrigado por entrar em contato. Kennedy Wanderson responderá pessoalmente em até 24 a 48 horas.",
        privacyNotice: "Em total conformidade com o RGPD europeu e diretrizes da CNIL, seus dados são mantidos em absoluto sigilo e utilizados exclusivamente para sua proposta.",
      },
      directContact: "Atendimento Rápido",
      whatsappText: "Prefere tirar dúvidas ou conversar diretamente pelo WhatsApp?",
      whatsappButton: "Conversar no WhatsApp",
      locationNote: "Baseado na França — disponível em toda a Europa, Brasil e destinos internacionais.",
    },
    footer: {
      rights: "Todos os direitos reservados.",
      curatedWithLove: "Fotografia Fine Art — França & Mundo",
      mentionsLegales: "Aviso Legal & Privacidade",
      privacy: "Política de Privacidade",
      top: "Voltar ao topo",
    },
    mentions: {
      title: "Mentions Légales & Privacidade (RGPD/CNIL)",
      subtitle: "Em conformidade com a legislação francesa LCEN (Loi n° 2004-575) e o Regulamento Geral sobre a Proteção de Dados (RGPD).",
      editorTitle: "1. Editor Responsável pelo Site",
      editorContent: "Este site é publicado por Kennedy Wanderson, fotógrafo profissional independente radicado na França. Contato direto: contact@kennedywanderson.com.",
      hostingTitle: "2. Hospedagem & Infraestrutura",
      hostingContent: "Hospedagem em servidores com datacenter sediado na França (Paris / Roubaix), com rede de distribuição CDN global para máxima velocidade no Brasil e no mundo.",
      ipTitle: "3. Direitos Autorais & Propriedade Intelectual",
      ipContent: "Todas as fotografias, composições e textos são de autoria e propriedade exclusiva de Kennedy Wanderson. Protegidos pelo Código de Propriedade Intelectual francês e convenções internacionais de direitos autorais.",
      privacyTitle: "4. Tratamento de Dados Pessoais (CNIL)",
      privacyContent: "Este site respeita integralmente a privacidade dos visitantes, operando sem cookies invasivos de rastreamento. As mensagens enviadas pelo formulário são arquivadas pelo prazo máximo de 2 anos estritamente para formulação de propostas de serviço. Você tem direito de exclusão e alteração de seus dados a qualquer momento.",
      close: "Fechar",
    },
  },
};
