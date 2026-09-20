import {
  LayoutGrid, BookOpen, Globe, ChartColumn, User, CreditCard, Video, MapPin, type LucideIcon,
} from "lucide-react";

export interface FaqItem { q: string; a: string }

export interface FaqCategory {
  id: string;
  label: string;
  hint: string;
  intro: string;
  icon: LucideIcon;
  items: FaqItem[];
}

/* Contenu rédigé à partir des anciennes pages Tarifs, Comment ça marche, Devenir coach et
   de l'accueil. À faire relire par l'équipe avant diffusion large : les règles
   d'annulation et de report de cours notamment. Pas de tiret cadratin. */
export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "generalites",
    label: "Généralités",
    hint: "À propos de Care4Success",
    intro: "Les réponses aux questions les plus courantes sur Care4Success.",
    icon: LayoutGrid,
    items: [
      {
        q: "Qu'est-ce que Care4Success ?",
        a: "Care4Success est une plateforme de coaching panafricaine qui met en relation des apprenants avec des coachs qualifiés pour le soutien scolaire, les langues et le développement de compétences professionnelles. Notre mission est de révéler le potentiel de chaque apprenant grâce à un accompagnement personnalisé et de qualité.",
      },
      {
        q: "Comment fonctionne la plateforme ?",
        a: "Vous choisissez votre univers : soutien scolaire, langues ou compétences. Pour le soutien scolaire, nous évaluons le besoin de l'enfant puis nous vous proposons le coach le plus adapté. Pour les langues, vous parcourez les profils, comparez les tarifs et les avis, réservez un créneau et payez en ligne. Le suivi se fait ensuite depuis votre espace personnel.",
      },
      {
        q: "Quels niveaux sont concernés par le soutien scolaire ?",
        a: "Le soutien scolaire couvre le primaire, le collège, le lycée et la préparation aux examens, dans plusieurs systèmes scolaires : BAC et Brevet, Baccalauréat International, système américain et système britannique.",
      },
      {
        q: "Quelles langues puis-je apprendre sur Care4Success ?",
        a: "Vous pouvez apprendre l'anglais, le français, l'espagnol et plus de cinq autres langues, selon les coachs disponibles. La page Cours de langues présente tous les coachs et leurs spécialités.",
      },
      {
        q: "Qui sont les coachs ?",
        a: "Chaque coach est examiné par notre équipe avant de donner son premier cours : diplômes, expertise et pédagogie sont vérifiés. Sur son profil, vous retrouvez sa présentation, ses spécialités, ses formations, ses langues et les avis de ses apprenants.",
      },
      {
        q: "Les cours sont-ils uniquement en ligne ?",
        a: "Non. Les cours peuvent se donner en ligne, dans notre salle de classe virtuelle intégrée, ou en présentiel selon les coachs. Le ou les formats proposés (en ligne, présentiel, hybride) sont indiqués sur le profil de chaque coach.",
      },
      {
        q: "Comment se déroule le paiement ?",
        a: "Vous payez en ligne par Orange Money, MTN MoMo, MVola, Visa ou Mastercard, selon votre pays. Il n'y a ni frais d'inscription ni abonnement : vous ne payez que les cours.",
      },
      {
        q: "Puis-je annuler ou reporter un cours ?",
        a: "Oui, en prévenant votre coach le plus tôt possible. Les modalités précises de report sont convenues avec lui au moment de la réservation. En cas de difficulté, notre équipe vous accompagne : écrivez-nous via la page Contact.",
      },
      {
        q: "Comment devenir coach sur Care4Success ?",
        a: "Rendez-vous sur la page Devenir coach et remplissez le formulaire de candidature. Notre équipe étudie votre profil, puis vous accompagne dans vos premières missions.",
      },
    ],
  },
  {
    id: "soutien-scolaire",
    label: "Soutien scolaire",
    hint: "Cours et accompagnement",
    intro: "Tout savoir sur l'accompagnement scolaire proposé à votre enfant.",
    icon: BookOpen,
    items: [
      {
        q: "Comment obtenir un coach pour mon enfant ?",
        a: "Remplissez le formulaire d'évaluation gratuite en décrivant les besoins de votre enfant. Notre équipe analyse son profil et son programme sous 24 à 48 h, puis vous propose le coach le plus adapté. Vous décidez de le retenir ou non.",
      },
      {
        q: "L'évaluation est-elle payante ?",
        a: "Non, l'évaluation scolaire est gratuite et sans engagement.",
      },
      {
        q: "Puis-je suivre le travail de mon enfant ?",
        a: "Oui. Depuis votre espace parent, vous voyez en temps réel la présence, le contenu des séances, les devoirs, la progression et la facturation.",
      },
      {
        q: "Puis-je changer de coach si je ne suis pas satisfait ?",
        a: "Oui, sans frais ni délai. Votre conseiller organise le remplacement sous 48 heures ouvrées.",
      },
    ],
  },
  {
    id: "langues",
    label: "Langues",
    hint: "Cours de langues",
    intro: "Choisir votre coach, réserver et progresser dans la langue de votre choix.",
    icon: Globe,
    items: [
      {
        q: "Comment choisir mon coach de langue ?",
        a: "Parcourez les profils, comparez les tarifs, les spécialités et les avis, puis ouvrez la page du coach qui vous convient pour consulter ses créneaux disponibles.",
      },
      {
        q: "Comment réserver un cours ?",
        a: "Sélectionnez un créneau sur la page du coach, choisissez le format (en ligne ou présentiel) et réglez en ligne. La réservation prend environ deux minutes.",
      },
      {
        q: "Quelle est la durée d'une session ?",
        a: "Une session dure 60 minutes. Le tarif horaire est indiqué sur le profil de chaque coach.",
      },
      {
        q: "Je suis hors de la zone FCFA, quel tarif s'applique ?",
        a: "Nos tarifs de référence sont en FCFA pour la zone CFA. Pour Madagascar, les Comores, la Guinée ou tout autre pays, notre équipe établit un équivalent dans votre devise. Contactez-nous pour un devis adapté.",
      },
    ],
  },
  {
    id: "competences",
    label: "Compétences",
    hint: "Formations professionnelles",
    intro: "Développer une compétence professionnelle avec un expert.",
    icon: ChartColumn,
    items: [
      {
        q: "Quand l'univers Compétences et carrière sera-t-il disponible ?",
        a: "Il est bientôt disponible. Il permettra de développer une compétence avec un expert capable de vous accompagner vers un objectif concret.",
      },
      {
        q: "Quels domaines seront proposés ?",
        a: "Nous démarrerons avec la bureautique, la data et la communication, puis nous élargirons l'offre selon les besoins.",
      },
    ],
  },
  {
    id: "devenir-coach",
    label: "Devenir coach",
    hint: "Recrutement et collaboration",
    intro: "Rejoindre Care4Success et enseigner à votre rythme.",
    icon: User,
    items: [
      {
        q: "Dois-je avoir un diplôme d'enseignement pour postuler ?",
        a: "Non. Nous recrutons sur la compétence et la pédagogie. Un diplôme universitaire (licence ou plus) dans votre matière et une expérience d'enseignement ou de tutorat suffisent pour candidater.",
      },
      {
        q: "Dans quelle devise suis-je payé ?",
        a: "Selon votre pays : FCFA (XOF ou XAF), GHS, KES, NGN, MGA... Les paiements se font par Mobile Money, CinetPay ou virement bancaire local.",
      },
      {
        q: "Y a-t-il une période d'essai ?",
        a: "Oui, une période de 30 jours pendant laquelle nous suivons ensemble vos premières missions. C'est aussi l'occasion de bénéficier d'un coaching pédagogique personnalisé.",
      },
    ],
  },
  {
    id: "compte-paiement",
    label: "Compte et paiement",
    hint: "Inscription, abonnements",
    intro: "Créer votre compte et régler vos cours en toute simplicité.",
    icon: CreditCard,
    items: [
      {
        q: "Y a-t-il des frais d'inscription ou un abonnement ?",
        a: "Non. Il n'y a ni frais d'inscription, ni abonnement, ni frais cachés. Vous payez uniquement les heures de cours effectivement dispensées.",
      },
      {
        q: "Quels moyens de paiement acceptez-vous ?",
        a: "Orange Money, MTN MoMo, MVola, Visa et Mastercard. Vos paiements sont sécurisés et votre coach est payé automatiquement.",
      },
      {
        q: "Y a-t-il un engagement de durée ?",
        a: "Aucun. Vous pouvez arrêter à tout moment, sans préavis ni pénalité.",
      },
    ],
  },
  {
    id: "cours-en-ligne",
    label: "Cours en ligne",
    hint: "Fonctionnement et outils",
    intro: "Comment se passent les cours en visioconférence.",
    icon: Video,
    items: [
      {
        q: "Comment se déroule un cours en ligne ?",
        a: "Votre coach vous retrouve dans notre salle de classe virtuelle intégrée : visioconférence sécurisée, tableau interactif et partage de documents, sans installation de logiciel supplémentaire.",
      },
      {
        q: "De quoi ai-je besoin pour suivre un cours en ligne ?",
        a: "D'un ordinateur, d'une tablette ou d'un téléphone avec une connexion internet stable, d'une caméra et d'un micro.",
      },
    ],
  },
  {
    id: "cours-presentiel",
    label: "Cours en présentiel",
    hint: "Organisation et sécurité",
    intro: "Organisation des cours à domicile ou en présentiel.",
    icon: MapPin,
    items: [
      {
        q: "Où ont lieu les cours en présentiel ?",
        a: "En présentiel, le coach se déplace chez la famille, dans sa ville. Le lieu et l'horaire sont fixés avec lui au moment de la réservation.",
      },
      {
        q: "Les coachs qui se déplacent sont-ils vérifiés ?",
        a: "Oui. Tous les coachs sont examinés par notre équipe avant de donner leur premier cours, en ligne comme en présentiel.",
      },
    ],
  },
];
