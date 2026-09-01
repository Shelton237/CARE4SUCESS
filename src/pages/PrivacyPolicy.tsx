export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 text-sm text-gray-700 leading-relaxed">

      <h1 className="text-3xl font-black text-[#0D2D5A] mb-2 tracking-tight">Politique de Confidentialité</h1>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">Dernière mise à jour : 12 juin 2026</p>

      <Section title="1. Présentation">
        <p>
          La présente Politique de Confidentialité décrit la manière dont <strong>Care4Success</strong> (ci-après « nous », « notre »), plateforme éditée par <strong>Euréka</strong>, collecte, utilise, conserve et protège les données personnelles des utilisateurs de l'application mobile et du site web accessible à l'adresse <strong>care4success.usra-care.com</strong>.
        </p>
        <p className="mt-3">
          En utilisant notre service, vous acceptez les pratiques décrites dans cette politique. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p className="font-semibold text-[#0D2D5A] mb-2">2.1 Données fournies par l'utilisateur</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Nom et prénom</li>
          <li>Adresse e-mail</li>
          <li>Numéro de téléphone</li>
          <li>Localisation géographique (pays, région, département, arrondissement, quartier)</li>
          <li>Rôle sur la plateforme (parent, élève, enseignant, conseiller)</li>
          <li>Informations scolaires (niveau, matières suivies)</li>
          <li>Photo de profil (optionnel)</li>
          <li>Informations bancaires pour les enseignants (IBAN, titulaire du compte)</li>
          <li>Contenu des messages envoyés via la messagerie interne</li>
          <li>Devoirs et compte-rendus de sessions</li>
        </ul>

        <p className="font-semibold text-[#0D2D5A] mb-2 mt-5">2.2 Données collectées automatiquement</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Adresse IP</li>
          <li>Type d'appareil et système d'exploitation</li>
          <li>Données de navigation et pages visitées</li>
          <li>Jeton de notification push (pour les notifications en temps réel)</li>
          <li>Dates et heures de connexion</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <p>Nous utilisons vos données personnelles pour :</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
          <li>Créer et gérer votre compte utilisateur</li>
          <li>Vous mettre en relation avec des enseignants qualifiés dans votre zone géographique (système de matching)</li>
          <li>Planifier et suivre les sessions de cours</li>
          <li>Vous envoyer des notifications relatives à votre activité (cours confirmé, devoir assigné, message reçu)</li>
          <li>Assurer le suivi pédagogique de l'élève</li>
          <li>Traiter les candidatures des enseignants</li>
          <li>Améliorer et sécuriser notre service</li>
          <li>Respecter nos obligations légales</li>
        </ul>
      </Section>

      <Section title="4. Base légale du traitement">
        <p>Le traitement de vos données repose sur :</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
          <li><strong>L'exécution du contrat</strong> : pour vous fournir les services de la plateforme</li>
          <li><strong>Votre consentement</strong> : pour les notifications push et les communications marketing</li>
          <li><strong>L'intérêt légitime</strong> : pour la sécurité du service et la prévention des fraudes</li>
          <li><strong>L'obligation légale</strong> : pour répondre aux exigences réglementaires applicables</li>
        </ul>
      </Section>

      <Section title="5. Partage des données">
        <p>Nous ne vendons jamais vos données personnelles à des tiers. Vos données peuvent être partagées uniquement dans les cas suivants :</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
          <li><strong>Entre utilisateurs de la plateforme</strong> : nom, niveau scolaire et localisation partagés entre parent/élève et enseignant assigné, dans le cadre du suivi pédagogique</li>
          <li><strong>Prestataires techniques</strong> : hébergement (serveur dédié), service de notifications push (Firebase Cloud Messaging), envoi d'e-mails transactionnels</li>
          <li><strong>Autorités légales</strong> : si requis par la loi ou une décision judiciaire</li>
        </ul>
      </Section>

      <Section title="6. Conservation des données">
        <p>Vos données sont conservées aussi longtemps que votre compte est actif. En cas de suppression de compte :</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
          <li>Les données de profil sont supprimées dans un délai de <strong>30 jours</strong></li>
          <li>Les données de sessions et de suivi pédagogique sont conservées <strong>3 ans</strong> à des fins d'archivage légal</li>
          <li>Les données de facturation sont conservées <strong>10 ans</strong> conformément aux obligations comptables</li>
        </ul>
      </Section>

      <Section title="7. Sécurité des données">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou divulgation : chiffrement des communications (HTTPS/TLS), authentification par jeton (JWT), accès restreint aux données par rôle, et hébergement sur serveur sécurisé.
        </p>
      </Section>

      <Section title="8. Vos droits">
        <p>Conformément à la réglementation applicable sur la protection des données personnelles, vous disposez des droits suivants :</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
          <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
          <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
          <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition</strong> : vous opposer à certains traitements</li>
          <li><strong>Droit de retrait du consentement</strong> : à tout moment pour les traitements basés sur votre consentement</li>
        </ul>
        <p className="mt-3">
          Pour exercer ces droits, contactez-nous à l'adresse : <strong>privacy@care4success.cm</strong>. Nous nous engageons à répondre dans un délai de <strong>30 jours</strong>.
        </p>
      </Section>

      <Section title="9. Cookies et technologies similaires">
        <p>
          Notre application utilise le stockage local (<em>localStorage</em>) pour conserver votre session de connexion et vos préférences. Nous n'utilisons pas de cookies publicitaires ou de tracking tiers.
        </p>
      </Section>

      <Section title="10. Transferts internationaux de données">
        <p>
          Vos données sont hébergées sur un serveur situé en Europe (OVH Cloud). Dans le cadre des services de notification push, vos données transitent par les serveurs de Google Firebase, dont les centres de données sont situés aux États-Unis, dans le respect des mécanismes de transfert appropriés (clauses contractuelles types).
        </p>
      </Section>

      <Section title="11. Mineurs">
        <p>
          La plateforme est susceptible d'être utilisée par des élèves mineurs sous la responsabilité de leurs parents ou tuteurs légaux. Le parent ou tuteur est responsable de l'inscription de l'enfant et donne son consentement au traitement des données de celui-ci. Nous ne collectons pas sciemment de données personnelles de mineurs sans consentement parental.
        </p>
      </Section>

      <Section title="12. Modifications de cette politique">
        <p>
          Nous nous réservons le droit de modifier cette politique à tout moment. Toute modification substantielle vous sera notifiée par e-mail ou via une notification dans l'application au moins <strong>15 jours</strong> avant son entrée en vigueur. L'utilisation continue du service après cette date vaut acceptation de la nouvelle politique.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>Pour toute question relative à cette politique ou au traitement de vos données personnelles :</p>
        <div className="mt-3 bg-slate-50 border border-slate-200 p-4 space-y-1">
          <p><strong>Care4Success — Euréka</strong></p>
          <p>E-mail : <a href="mailto:privacy@care4success.cm" className="text-[#1A6CC8] font-semibold">privacy@care4success.cm</a></p>
          <p>Site web : <a href="https://care4success.usra-care.com" className="text-[#1A6CC8] font-semibold" target="_blank" rel="noreferrer">care4success.usra-care.com</a></p>
        </div>
      </Section>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-black text-[#0D2D5A] uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
        {title}
      </h2>
      <div className="space-y-2 text-gray-600">{children}</div>
    </section>
  );
}
