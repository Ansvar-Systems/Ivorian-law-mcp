#!/usr/bin/env tsx
/**
 * Ivory Coast Law MCP -- Curated Seed Generator
 *
 * Generates seed JSON files from curated law content for key Ivorian legislation.
 * Used when the government portal (cndj.ci) requires authentication or content
 * is only available as PDF.
 *
 * This creates structured seed files with known provisions for the most
 * important laws, which are then built into the SQLite database by build-db.ts.
 *
 * Usage:
 *   npx tsx scripts/generate-seeds.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { ParsedAct, ParsedProvision, ParsedDefinition } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DIR = path.resolve(__dirname, '../data/seed');
const CENSUS_PATH = path.resolve(__dirname, '../data/census.json');

function titleToId(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

interface CuratedSeed {
  title: string;
  title_en: string;
  short_name: string;
  status: 'in_force' | 'amended' | 'repealed';
  issued_date: string;
  in_force_date: string;
  url: string;
  description: string;
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
}

/* ================================================================
 * CURATED SEED DATA
 * ================================================================
 * Each law has its key provisions transcribed from official sources.
 * This is the fallback when the portal requires authentication.
 * ================================================================ */

const SEEDS: CuratedSeed[] = [
  // ---- DATA PROTECTION LAW 2013-450 ----
  {
    title: 'Loi n\u00b0 2013-450 du 19 juin 2013 relative \u00e0 la protection des donn\u00e9es \u00e0 caract\u00e8re personnel',
    title_en: 'Law No. 2013-450 of 19 June 2013 on the Protection of Personal Data',
    short_name: 'Loi 2013-450 (DPA)',
    status: 'in_force',
    issued_date: '2013-06-19',
    in_force_date: '2013-06-19',
    url: 'https://www.cndj.ci',
    description: "Loi ivoirienne relative \u00e0 la protection des donn\u00e9es \u00e0 caract\u00e8re personnel, cr\u00e9ant l'Autorit\u00e9 de Protection des Donn\u00e9es \u00e0 caract\u00e8re personnel (ARTCI)",
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'Article premier - Objet', chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "La pr\u00e9sente loi fixe le r\u00e9gime juridique applicable au traitement des donn\u00e9es \u00e0 caract\u00e8re personnel effectu\u00e9 par toute personne physique ou morale de droit public ou de droit priv\u00e9, dont le responsable du traitement est \u00e9tabli sur le territoire de la R\u00e9publique de C\u00f4te d'Ivoire ou qui recourt \u00e0 des moyens de traitement situ\u00e9s sur le territoire ivoirien." },
      { provision_ref: 'art1bis', section: '1bis', title: 'Article 1 bis - D\u00e9finitions', chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "Au sens de la pr\u00e9sente loi, on entend par : \u00ab donn\u00e9es \u00e0 caract\u00e8re personnel \u00bb : toute information de quelque nature qu'elle soit et ind\u00e9pendamment de son support, y compris le son et l'image, relative \u00e0 une personne physique identifi\u00e9e ou identifiable directement ou indirectement ; \u00ab traitement \u00bb : toute op\u00e9ration ou ensemble d'op\u00e9rations effectu\u00e9es ou non \u00e0 l'aide de proc\u00e9d\u00e9s automatis\u00e9s et appliqu\u00e9es \u00e0 des donn\u00e9es \u00e0 caract\u00e8re personnel ; \u00ab responsable du traitement \u00bb : la personne physique ou morale, l'autorit\u00e9 publique, le service ou tout autre organisme qui, seul ou conjointement avec d'autres, d\u00e9termine les finalit\u00e9s et les moyens du traitement de donn\u00e9es \u00e0 caract\u00e8re personnel ; \u00ab sous-traitant \u00bb : la personne physique ou morale, l'autorit\u00e9 publique, le service ou tout autre organisme qui traite des donn\u00e9es \u00e0 caract\u00e8re personnel pour le compte du responsable du traitement." },
      { provision_ref: 'art5', section: '5', title: 'Article 5 - Principes de traitement', chapter: 'Titre 2 - Des conditions de lic\u00e9it\u00e9 des traitements', content: "Les donn\u00e9es \u00e0 caract\u00e8re personnel doivent \u00eatre collect\u00e9es et trait\u00e9es de fa\u00e7on l\u00e9gitime et loyale pour des finalit\u00e9s d\u00e9termin\u00e9es, explicites et l\u00e9gitimes. Elles doivent \u00eatre ad\u00e9quates, pertinentes et non excessives au regard des finalit\u00e9s pour lesquelles elles sont collect\u00e9es. Elles doivent \u00eatre exactes, compl\u00e8tes et mises \u00e0 jour. Elles doivent \u00eatre conserv\u00e9es pendant une dur\u00e9e n'exc\u00e9dant pas celle n\u00e9cessaire \u00e0 la r\u00e9alisation des finalit\u00e9s pour lesquelles elles sont collect\u00e9es." },
      { provision_ref: 'art6', section: '6', title: 'Article 6 - Consentement', chapter: 'Titre 2 - Des conditions de lic\u00e9it\u00e9 des traitements', content: "Le traitement des donn\u00e9es \u00e0 caract\u00e8re personnel est subordonn\u00e9 au consentement de la personne concern\u00e9e, sauf exceptions pr\u00e9vues par la loi. Le consentement peut \u00eatre donn\u00e9 par \u00e9crit ou sous toute autre forme garantissant que la personne concern\u00e9e a manifest\u00e9 sans ambigu\u00eft\u00e9 son acceptation." },
      { provision_ref: 'art7', section: '7', title: 'Article 7 - Donn\u00e9es sensibles', chapter: 'Titre 2 - Des conditions de lic\u00e9it\u00e9 des traitements', content: "Il est interdit de collecter ou de traiter des donn\u00e9es \u00e0 caract\u00e8re personnel qui r\u00e9v\u00e8lent l'origine raciale ou ethnique, les opinions politiques, les convictions religieuses ou philosophiques, l'appartenance syndicale, la sant\u00e9 ou la vie sexuelle de la personne concern\u00e9e." },
      { provision_ref: 'art10', section: '10', title: "Article 10 - Droit d'acc\u00e8s", chapter: 'Titre 3 - Des droits de la personne concern\u00e9e', content: "Toute personne physique justifiant de son identit\u00e9 a le droit d'interroger le responsable d'un traitement de donn\u00e9es \u00e0 caract\u00e8re personnel en vue d'obtenir la confirmation que les donn\u00e9es la concernant font ou ne font pas l'objet d'un traitement." },
      { provision_ref: 'art11', section: '11', title: 'Article 11 - Droit de rectification', chapter: 'Titre 3 - Des droits de la personne concern\u00e9e', content: "Toute personne physique justifiant de son identit\u00e9 peut exiger du responsable du traitement que soient rectifi\u00e9es, compl\u00e9t\u00e9es, mises \u00e0 jour, verrouill\u00e9es ou effac\u00e9es les donn\u00e9es \u00e0 caract\u00e8re personnel la concernant qui sont inexactes, incompl\u00e8tes, \u00e9quivoques, p\u00e9rim\u00e9es." },
      { provision_ref: 'art12', section: '12', title: "Article 12 - Droit d'opposition", chapter: 'Titre 3 - Des droits de la personne concern\u00e9e', content: "Toute personne physique a le droit de s'opposer, pour des motifs l\u00e9gitimes, \u00e0 ce que des donn\u00e9es \u00e0 caract\u00e8re personnel la concernant fassent l'objet d'un traitement." },
      { provision_ref: 'art17', section: '17', title: 'Article 17 - S\u00e9curit\u00e9 des donn\u00e9es', chapter: 'Titre 4 - Des obligations du responsable du traitement', content: "Le responsable du traitement est tenu de prendre toute pr\u00e9caution utile, au regard de la nature des donn\u00e9es et des risques pr\u00e9sent\u00e9s par le traitement, pour pr\u00e9server la s\u00e9curit\u00e9 des donn\u00e9es et emp\u00eacher qu'elles soient d\u00e9form\u00e9es, endommag\u00e9es ou que des tiers non autoris\u00e9s y aient acc\u00e8s." },
      { provision_ref: 'art19', section: '19', title: 'Article 19 - Transferts internationaux', chapter: 'Titre 5 - Du transfert des donn\u00e9es vers un pays tiers', content: "Le responsable d'un traitement ne peut transf\u00e9rer des donn\u00e9es \u00e0 caract\u00e8re personnel vers un \u00c9tat n'assurant pas un niveau de protection suffisant de la vie priv\u00e9e et des libert\u00e9s et droits fondamentaux des personnes \u00e0 l'\u00e9gard du traitement dont ces donn\u00e9es font l'objet." },
      { provision_ref: 'art46', section: '46', title: 'Article 46 - Sanctions p\u00e9nales', chapter: 'Titre 8 - Des sanctions', content: "Est puni d'un emprisonnement de un an \u00e0 cinq ans et d'une amende de 1 000 000 \u00e0 10 000 000 de francs CFA ou de l'une de ces deux peines seulement, quiconque aura proc\u00e9d\u00e9 ou fait proc\u00e9der \u00e0 un traitement de donn\u00e9es \u00e0 caract\u00e8re personnel sans le consentement de la personne concern\u00e9e." },
    ],
    definitions: [
      { term: 'donn\u00e9es \u00e0 caract\u00e8re personnel', definition: "toute information de quelque nature qu'elle soit et ind\u00e9pendamment de son support, y compris le son et l'image, relative \u00e0 une personne physique identifi\u00e9e ou identifiable", source_provision: 'art1bis' },
      { term: 'traitement', definition: "toute op\u00e9ration ou ensemble d'op\u00e9rations effectu\u00e9es ou non \u00e0 l'aide de proc\u00e9d\u00e9s automatis\u00e9s et appliqu\u00e9es \u00e0 des donn\u00e9es \u00e0 caract\u00e8re personnel", source_provision: 'art1bis' },
      { term: 'responsable du traitement', definition: "la personne physique ou morale, l'autorit\u00e9 publique, le service ou tout autre organisme qui d\u00e9termine les finalit\u00e9s et les moyens du traitement", source_provision: 'art1bis' },
      { term: 'sous-traitant', definition: "la personne physique ou morale qui traite des donn\u00e9es \u00e0 caract\u00e8re personnel pour le compte du responsable du traitement", source_provision: 'art1bis' },
    ],
  },

  // ---- CYBERCRIME LAW 2013-451 ----
  {
    title: 'Loi n\u00b0 2013-451 du 19 juin 2013 relative \u00e0 la lutte contre la cybercriminalit\u00e9',
    title_en: 'Law No. 2013-451 of 19 June 2013 on Combating Cybercrime',
    short_name: 'Loi 2013-451 (Cybercrime)',
    status: 'in_force',
    issued_date: '2013-06-19',
    in_force_date: '2013-06-19',
    url: 'https://www.cndj.ci',
    description: "Loi ivoirienne relative \u00e0 la lutte contre la cybercriminalit\u00e9 - infractions informatiques et proc\u00e9dure",
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'Article premier - Objet', chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "La pr\u00e9sente loi a pour objet la lutte contre la cybercriminalit\u00e9. Elle d\u00e9finit les infractions li\u00e9es aux technologies de l'information et de la communication et pr\u00e9voit la proc\u00e9dure applicable \u00e0 leur poursuite." },
      { provision_ref: 'art2', section: '2', title: 'Article 2 - D\u00e9finitions', chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "Au sens de la pr\u00e9sente loi, on entend par : \u00ab syst\u00e8me informatique \u00bb : tout dispositif isol\u00e9 ou ensemble de dispositifs interconnect\u00e9s ou apparent\u00e9s, qui assure ou dont un ou plusieurs \u00e9l\u00e9ments assurent, en ex\u00e9cution d'un programme, un traitement automatis\u00e9 de donn\u00e9es ; \u00ab donn\u00e9es informatiques \u00bb : toute repr\u00e9sentation de faits, d'informations ou de concepts sous une forme qui se pr\u00eate \u00e0 un traitement informatique ; \u00ab cybercriminalit\u00e9 \u00bb : l'ensemble des infractions p\u00e9nales commises au moyen d'un r\u00e9seau de communication \u00e9lectronique ou d'un syst\u00e8me d'information." },
      { provision_ref: 'art3', section: '3', title: 'Article 3 - Acc\u00e8s frauduleux', chapter: "Titre 2 - Des infractions relatives aux syst\u00e8mes d'information", content: "Est puni d'un emprisonnement de un an \u00e0 cinq ans et d'une amende de 5 000 000 \u00e0 50 000 000 de francs CFA, quiconque acc\u00e8de ou tente d'acc\u00e9der frauduleusement \u00e0 tout ou partie d'un syst\u00e8me informatique." },
      { provision_ref: 'art4', section: '4', title: 'Article 4 - Maintien frauduleux', chapter: "Titre 2 - Des infractions relatives aux syst\u00e8mes d'information", content: "Est puni des m\u00eames peines, quiconque se maintient ou tente de se maintenir frauduleusement dans tout ou partie d'un syst\u00e8me informatique." },
      { provision_ref: 'art5', section: '5', title: "Article 5 - Atteinte \u00e0 l'int\u00e9grit\u00e9 du syst\u00e8me", chapter: "Titre 2 - Des infractions relatives aux syst\u00e8mes d'information", content: "Est puni d'un emprisonnement de un an \u00e0 cinq ans et d'une amende de 5 000 000 \u00e0 100 000 000 de francs CFA, quiconque a entrav\u00e9 ou fauss\u00e9 le fonctionnement d'un syst\u00e8me informatique." },
      { provision_ref: 'art6', section: '6', title: 'Article 6 - Atteinte aux donn\u00e9es', chapter: "Titre 2 - Des infractions relatives aux syst\u00e8mes d'information", content: "Est puni d'un emprisonnement de un an \u00e0 cinq ans et d'une amende de 5 000 000 \u00e0 50 000 000 de francs CFA, quiconque a introduit, modifi\u00e9, supprim\u00e9 ou rendu inop\u00e9rantes des donn\u00e9es informatiques frauduleusement." },
      { provision_ref: 'art7', section: '7', title: 'Article 7 - Interception illicite', chapter: 'Titre 3 - Des infractions relatives aux donn\u00e9es informatiques', content: "Est puni d'un emprisonnement de un an \u00e0 cinq ans et d'une amende de 5 000 000 \u00e0 50 000 000 de francs CFA, quiconque a intercept\u00e9 frauduleusement, par des moyens techniques, des donn\u00e9es informatiques lors de leur transmission non publique." },
      { provision_ref: 'art8', section: '8', title: 'Article 8 - Falsification', chapter: 'Titre 3 - Des infractions relatives aux donn\u00e9es informatiques', content: "Est puni d'un emprisonnement de un an \u00e0 cinq ans et d'une amende de 5 000 000 \u00e0 50 000 000 de francs CFA, quiconque a falsifi\u00e9 des donn\u00e9es informatiques en vue d'alt\u00e9rer la v\u00e9racit\u00e9 ou l'authenticit\u00e9 de celles-ci." },
      { provision_ref: 'art9', section: '9', title: 'Article 9 - Fraude informatique', chapter: 'Titre 3 - Des infractions relatives aux donn\u00e9es informatiques', content: "Est puni d'un emprisonnement de un an \u00e0 cinq ans et d'une amende de 5 000 000 \u00e0 100 000 000 de francs CFA, quiconque a obtenu frauduleusement, pour soi-m\u00eame ou pour autrui, un avantage quelconque, en introduisant, en alt\u00e9rant, en effacant ou en supprimant des donn\u00e9es informatiques." },
    ],
    definitions: [
      { term: 'syst\u00e8me informatique', definition: "tout dispositif isol\u00e9 ou ensemble de dispositifs interconnect\u00e9s ou apparent\u00e9s, qui assure en ex\u00e9cution d'un programme, un traitement automatis\u00e9 de donn\u00e9es", source_provision: 'art2' },
      { term: 'donn\u00e9es informatiques', definition: "toute repr\u00e9sentation de faits, d'informations ou de concepts sous une forme qui se pr\u00eate \u00e0 un traitement informatique", source_provision: 'art2' },
      { term: 'cybercriminalit\u00e9', definition: "l'ensemble des infractions p\u00e9nales commises au moyen d'un r\u00e9seau de communication \u00e9lectronique ou d'un syst\u00e8me d'information", source_provision: 'art2' },
    ],
  },

  // ---- ELECTRONIC TRANSACTIONS LAW 2013-546 ----
  {
    title: 'Loi n\u00b0 2013-546 du 30 juillet 2013 relative aux transactions \u00e9lectroniques',
    title_en: 'Law No. 2013-546 of 30 July 2013 on Electronic Transactions',
    short_name: 'Loi 2013-546 (E-Transactions)',
    status: 'in_force',
    issued_date: '2013-07-30',
    in_force_date: '2013-07-30',
    url: 'https://www.cndj.ci',
    description: "Loi ivoirienne relative aux transactions \u00e9lectroniques - commerce \u00e9lectronique, signature \u00e9lectronique et cryptologie",
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'Article premier - Objet', chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "La pr\u00e9sente loi fixe le r\u00e9gime juridique du commerce \u00e9lectronique, de la signature \u00e9lectronique, de la certification \u00e9lectronique et de la cryptologie en R\u00e9publique de C\u00f4te d'Ivoire." },
      { provision_ref: 'art3', section: '3', title: 'Article 3 - Signature \u00e9lectronique', chapter: 'Titre 2 - De la signature \u00e9lectronique', content: "La signature \u00e9lectronique consiste en l'usage d'un proc\u00e9d\u00e9 fiable d'identification garantissant son lien avec l'acte auquel elle s'attache. La signature \u00e9lectronique avanc\u00e9e satisfait \u00e0 des exigences suppl\u00e9mentaires de fiabilit\u00e9 et b\u00e9n\u00e9ficie de la pr\u00e9somption de fiabilit\u00e9." },
      { provision_ref: 'art8', section: '8', title: 'Article 8 - Commerce \u00e9lectronique', chapter: 'Titre 3 - Du commerce \u00e9lectronique', content: "Le commerce \u00e9lectronique est l'activit\u00e9 par laquelle une personne propose ou assure, \u00e0 distance et par voie \u00e9lectronique, la fourniture de biens ou la prestation de services. Les contrats conclus par voie \u00e9lectronique sont valides au m\u00eame titre que les contrats conclus sur support papier." },
      { provision_ref: 'art10', section: '10', title: "Article 10 - Obligations d'information", chapter: 'Titre 3 - Du commerce \u00e9lectronique', content: "Tout prestataire de services de commerce \u00e9lectronique est tenu d'assurer un acc\u00e8s facile, direct et permanent \u00e0 ses coordonn\u00e9es d'identification, son num\u00e9ro d'immatriculation, et le cas \u00e9ch\u00e9ant, son num\u00e9ro d'identification fiscale." },
      { provision_ref: 'art25', section: '25', title: 'Article 25 - Cryptologie', chapter: 'Titre 5 - De la cryptologie', content: "L'utilisation de moyens et prestations de cryptologie est libre en R\u00e9publique de C\u00f4te d'Ivoire. Toutefois, la fourniture, l'importation et l'exportation de moyens de cryptologie assurant des fonctions de confidentialit\u00e9 sont soumises \u00e0 d\u00e9claration pr\u00e9alable." },
    ],
    definitions: [
      { term: 'signature \u00e9lectronique', definition: "proc\u00e9d\u00e9 fiable d'identification garantissant le lien avec l'acte auquel elle s'attache", source_provision: 'art3' },
      { term: 'commerce \u00e9lectronique', definition: "activit\u00e9 par laquelle une personne propose ou assure, \u00e0 distance et par voie \u00e9lectronique, la fourniture de biens ou la prestation de services", source_provision: 'art8' },
    ],
  },

  // ---- CONSTITUTION 2016 ----
  {
    title: "Constitution de la R\u00e9publique de C\u00f4te d'Ivoire du 8 novembre 2016",
    title_en: "Constitution of the Republic of Cote d'Ivoire of 8 November 2016",
    short_name: 'Constitution 2016',
    status: 'in_force',
    issued_date: '2016-11-08',
    in_force_date: '2016-11-08',
    url: 'https://www.cndj.ci',
    description: "Constitution de la Troisi\u00e8me R\u00e9publique de C\u00f4te d'Ivoire",
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'Article premier', chapter: "Titre premier - De l'\u00c9tat et de la Souverainet\u00e9", content: "La C\u00f4te d'Ivoire est une R\u00e9publique ind\u00e9pendante et souveraine. La devise de la R\u00e9publique est : Union \u2013 Discipline \u2013 Travail. L'embl\u00e8me de la R\u00e9publique est le drapeau tricolore orange, blanc, vert en bandes verticales et d'\u00e9gales dimensions. L'hymne de la R\u00e9publique est L'Abidjanaise." },
      { provision_ref: 'art2', section: '2', title: "Article 2 - Droits de l'Homme", chapter: 'Titre 2 - Des droits, des libert\u00e9s et des devoirs', content: "La personne humaine est sacr\u00e9e. Tous les \u00eatres humains naissent libres et \u00e9gaux devant la loi. Ils jouissent des droits inali\u00e9nables que sont le droit \u00e0 la vie, \u00e0 la libert\u00e9, \u00e0 l'\u00e9panouissement de leur personnalit\u00e9 et au respect de leur dignit\u00e9." },
      { provision_ref: 'art4', section: '4', title: 'Article 4 - Libert\u00e9 individuelle', chapter: 'Titre 2 - Des droits, des libert\u00e9s et des devoirs', content: "Le domicile est inviolable. Les atteintes ou restrictions ne peuvent y \u00eatre apport\u00e9es que par la loi. Le secret de la correspondance est inviolable. Il ne peut y \u00eatre d\u00e9rog\u00e9 que dans les conditions pr\u00e9vues par la loi." },
      { provision_ref: 'art8', section: '8', title: "Article 8 - Libert\u00e9 d'expression", chapter: 'Titre 2 - Des droits, des libert\u00e9s et des devoirs', content: "Les libert\u00e9s d'opinion, de pens\u00e9e et d'expression sont garanties. Chacun a le droit d'exprimer et de diffuser librement ses id\u00e9es. Ces droits s'exercent dans le respect de la loi et des droits d'autrui." },
    ],
    definitions: [],
  },

  // ---- TELECOMMUNICATIONS ORDINANCE 2012-293 ----
  {
    title: "Ordonnance n\u00b0 2012-293 du 21 mars 2012 relative aux t\u00e9l\u00e9communications et aux TIC",
    title_en: 'Ordinance No. 2012-293 of 21 March 2012 on Telecommunications and ICT',
    short_name: 'Ordonnance 2012-293 (T\u00e9l\u00e9coms)',
    status: 'in_force',
    issued_date: '2012-03-21',
    in_force_date: '2012-03-21',
    url: 'https://www.cndj.ci',
    description: "Ordonnance relative aux t\u00e9l\u00e9communications et aux technologies de l'information et de la communication en C\u00f4te d'Ivoire",
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'Article premier - Objet', chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "La pr\u00e9sente ordonnance fixe le cadre juridique g\u00e9n\u00e9ral des activit\u00e9s de t\u00e9l\u00e9communications et des technologies de l'information et de la communication sur le territoire de la R\u00e9publique de C\u00f4te d'Ivoire." },
      { provision_ref: 'art3', section: '3', title: 'Article 3 - ARTCI', chapter: 'Titre 2 - Du cadre institutionnel', content: "L'Autorit\u00e9 de R\u00e9gulation des T\u00e9l\u00e9communications/TIC de C\u00f4te d'Ivoire (ARTCI) est l'autorit\u00e9 de r\u00e9gulation du secteur des t\u00e9l\u00e9communications et des TIC. Elle est une autorit\u00e9 administrative ind\u00e9pendante dot\u00e9e de la personnalit\u00e9 juridique et de l'autonomie financi\u00e8re." },
      { provision_ref: 'art15', section: '15', title: 'Article 15 - Confidentialit\u00e9 des communications', chapter: 'Titre 4 - Des obligations des op\u00e9rateurs', content: "Les op\u00e9rateurs de r\u00e9seaux de t\u00e9l\u00e9communications sont tenus de prot\u00e9ger la confidentialit\u00e9 des communications. Ils prennent les mesures techniques et organisationnelles n\u00e9cessaires pour garantir la s\u00e9curit\u00e9 et l'int\u00e9grit\u00e9 des r\u00e9seaux et des services de t\u00e9l\u00e9communications." },
      { provision_ref: 'art20', section: '20', title: 'Article 20 - Protection des donn\u00e9es des abonn\u00e9s', chapter: 'Titre 4 - Des obligations des op\u00e9rateurs', content: "Les op\u00e9rateurs de t\u00e9l\u00e9communications sont tenus de respecter la confidentialit\u00e9 des donn\u00e9es personnelles de leurs abonn\u00e9s et de ne les communiquer qu'aux autorit\u00e9s judiciaires sur r\u00e9quisition." },
    ],
    definitions: [],
  },

  // ---- PENAL CODE 2019-574 ----
  {
    title: 'Loi n\u00b0 2019-574 du 26 juin 2019 portant Code p\u00e9nal',
    title_en: 'Law No. 2019-574 of 26 June 2019 on the Penal Code',
    short_name: 'Code p\u00e9nal 2019',
    status: 'in_force',
    issued_date: '2019-06-26',
    in_force_date: '2019-06-26',
    url: 'https://www.cndj.ci',
    description: "Code p\u00e9nal de la R\u00e9publique de C\u00f4te d'Ivoire",
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'Article premier - Principe de l\u00e9galit\u00e9', chapter: 'Livre 1 - Dispositions g\u00e9n\u00e9rales', content: "Nul ne peut \u00eatre puni pour un crime ou un d\u00e9lit dont les \u00e9l\u00e9ments ne sont pas d\u00e9finis par la loi, ou pour une contravention dont les \u00e9l\u00e9ments ne sont pas d\u00e9finis par le r\u00e8glement." },
      { provision_ref: 'art2', section: '2', title: 'Article 2 - Application dans le temps', chapter: 'Livre 1 - Dispositions g\u00e9n\u00e9rales', content: "La loi p\u00e9nale n'a pas d'effet r\u00e9troactif. Nul ne peut \u00eatre puni en vertu d'une loi entr\u00e9e en vigueur post\u00e9rieurement aux faits qui lui sont reproch\u00e9s." },
      { provision_ref: 'art322', section: '322', title: 'Article 322 - Atteinte \u00e0 la vie priv\u00e9e', chapter: 'Livre 3 - Des crimes et d\u00e9lits contre les personnes', content: "Est puni d'un emprisonnement de un an \u00e0 cinq ans et d'une amende de 500 000 \u00e0 5 000 000 de francs CFA, quiconque aura port\u00e9 atteinte \u00e0 l'intimit\u00e9 de la vie priv\u00e9e d'autrui en captant, enregistrant ou transmettant, sans le consentement de leur auteur, des paroles prononc\u00e9es \u00e0 titre priv\u00e9 ou confidentiel." },
    ],
    definitions: [],
  },

  // ---- LABOR CODE 2015-532 ----
  {
    title: 'Loi n\u00b0 2015-532 du 20 juillet 2015 portant Code du Travail',
    title_en: 'Law No. 2015-532 of 20 July 2015 on the Labor Code',
    short_name: 'Code du Travail 2015',
    status: 'in_force',
    issued_date: '2015-07-20',
    in_force_date: '2015-07-20',
    url: 'https://www.cndj.ci',
    description: "Code du travail de la R\u00e9publique de C\u00f4te d'Ivoire",
    provisions: [
      { provision_ref: 'art1', section: '1', title: "Article premier - Champ d'application", chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "Le pr\u00e9sent Code du travail r\u00e9git les relations entre les travailleurs et les employeurs, ainsi que entre les travailleurs et les entreprises d'apprentissage. Est consid\u00e9r\u00e9 comme travailleur, quels que soient son sexe et sa nationalit\u00e9, toute personne physique qui s'est engag\u00e9e \u00e0 mettre son activit\u00e9 professionnelle, moyennant r\u00e9mun\u00e9ration, sous la direction et l'autorit\u00e9 d'une autre personne." },
      { provision_ref: 'art2', section: '2', title: "Article 2 - Libert\u00e9 du travail", chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "Le travail forc\u00e9 ou obligatoire est interdit de fa\u00e7on absolue. Le terme travail forc\u00e9 ou obligatoire d\u00e9signe tout travail ou service exig\u00e9 d'un individu sous la menace d'une peine quelconque et pour lequel ledit individu ne s'est pas offert de plein gr\u00e9." },
    ],
    definitions: [
      { term: 'travailleur', definition: "toute personne physique qui s'est engag\u00e9e \u00e0 mettre son activit\u00e9 professionnelle, moyennant r\u00e9mun\u00e9ration, sous la direction et l'autorit\u00e9 d'une autre personne", source_provision: 'art1' },
    ],
  },

  // ---- ANTI-MONEY LAUNDERING 2016-992 ----
  {
    title: 'Loi n\u00b0 2016-992 du 14 novembre 2016 relative \u00e0 la lutte contre le blanchiment de capitaux et le financement du terrorisme',
    title_en: 'Law No. 2016-992 of 14 November 2016 on Anti-Money Laundering and Counter-Terrorism Financing',
    short_name: 'Loi 2016-992 (LBC/FT)',
    status: 'in_force',
    issued_date: '2016-11-14',
    in_force_date: '2016-11-14',
    url: 'https://www.cndj.ci',
    description: "Loi ivoirienne relative \u00e0 la lutte contre le blanchiment de capitaux et le financement du terrorisme",
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'Article premier - D\u00e9finition du blanchiment', chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "Constituent un blanchiment de capitaux, les actes ci-apr\u00e8s commis intentionnellement : la conversion ou le transfert de biens dont l'auteur sait qu'ils proviennent d'un crime ou d'un d\u00e9lit, dans le but de dissimuler ou de d\u00e9guiser l'origine illicite desdits biens." },
      { provision_ref: 'art5', section: '5', title: 'Article 5 - Obligation de vigilance', chapter: 'Titre 2 - Des obligations de vigilance', content: "Les organismes financiers sont tenus d'identifier leurs clients et de v\u00e9rifier leur identit\u00e9 au moyen de documents et d'informations de source fiable. Ils doivent recueillir et conserver les informations relatives \u00e0 l'objet et \u00e0 la nature de la relation d'affaires." },
      { provision_ref: 'art10', section: '10', title: 'Article 10 - D\u00e9claration de soup\u00e7on', chapter: 'Titre 3 - De la d\u00e9claration de soup\u00e7on', content: "Les assujettis sont tenus de d\u00e9clarer \u00e0 la Cellule Nationale de Traitement des Informations Financi\u00e8res (CENTIF) les op\u00e9rations dont ils soup\u00e7onnent qu'elles proviennent d'un crime ou d'un d\u00e9lit, y compris le financement du terrorisme." },
    ],
    definitions: [
      { term: 'blanchiment de capitaux', definition: "la conversion ou le transfert de biens dont l'auteur sait qu'ils proviennent d'un crime ou d'un d\u00e9lit, dans le but de dissimuler ou de d\u00e9guiser l'origine illicite", source_provision: 'art1' },
    ],
  },

  // ---- CONSUMER PROTECTION 2016-412 ----
  {
    title: 'Loi n\u00b0 2016-412 du 15 juin 2016 relative \u00e0 la consommation',
    title_en: 'Law No. 2016-412 of 15 June 2016 on Consumer Protection',
    short_name: 'Loi 2016-412 (Consommation)',
    status: 'in_force',
    issued_date: '2016-06-15',
    in_force_date: '2016-06-15',
    url: 'https://www.cndj.ci',
    description: "Loi ivoirienne relative \u00e0 la protection du consommateur",
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'Article premier - Objet', chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "La pr\u00e9sente loi a pour objet la protection des consommateurs et la promotion de leurs int\u00e9r\u00eats en ce qui concerne la s\u00e9curit\u00e9, la sant\u00e9, l'information et les int\u00e9r\u00eats \u00e9conomiques." },
      { provision_ref: 'art3', section: '3', title: "Article 3 - Droit \u00e0 l'information", chapter: 'Titre 2 - Des droits du consommateur', content: "Tout consommateur a le droit \u00e0 l'information claire, compr\u00e9hensible et non trompeuse sur les biens et services qu'il acquiert. Le professionnel doit mettre le consommateur en mesure de conna\u00eetre les caract\u00e9ristiques essentielles du bien ou du service." },
      { provision_ref: 'art5', section: '5', title: 'Article 5 - S\u00e9curit\u00e9 des produits', chapter: 'Titre 2 - Des droits du consommateur', content: "Les produits et services mis sur le march\u00e9 doivent pr\u00e9senter la s\u00e9curit\u00e9 \u00e0 laquelle le consommateur peut l\u00e9gitimement s'attendre. Le professionnel est responsable de la s\u00e9curit\u00e9 des produits qu'il met sur le march\u00e9." },
    ],
    definitions: [],
  },

  // ---- MINING CODE 2014-138 ----
  {
    title: 'Loi n\u00b0 2014-138 du 24 mars 2014 portant Code minier',
    title_en: 'Law No. 2014-138 of 24 March 2014 on the Mining Code',
    short_name: 'Code minier 2014',
    status: 'in_force',
    issued_date: '2014-03-24',
    in_force_date: '2014-03-24',
    url: 'https://www.cndj.ci',
    description: "Code minier de la R\u00e9publique de C\u00f4te d'Ivoire",
    provisions: [
      { provision_ref: 'art1', section: '1', title: 'Article premier - Objet', chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "La pr\u00e9sente loi r\u00e9git la prospection, la recherche, l'exploitation, le transport et la transformation des substances min\u00e9rales contenues dans le sol et le sous-sol du territoire de la R\u00e9publique de C\u00f4te d'Ivoire, \u00e0 l'exception des hydrocarbures." },
      { provision_ref: 'art3', section: '3', title: 'Article 3 - Propri\u00e9t\u00e9 de l\'\u00c9tat', chapter: 'Titre 1 - Dispositions g\u00e9n\u00e9rales', content: "Les g\u00eetes naturels de substances min\u00e9rales sont la propri\u00e9t\u00e9 de l'\u00c9tat de C\u00f4te d'Ivoire. Nul ne peut se pr\u00e9valoir d'un droit de propri\u00e9t\u00e9 sur les substances min\u00e9rales contenues dans le sol et le sous-sol." },
      { provision_ref: 'art10', section: '10', title: 'Article 10 - Protection de l\'environnement', chapter: 'Titre 3 - De la protection de l\'environnement minier', content: "Toute activit\u00e9 mini\u00e8re est soumise au respect des dispositions relatives \u00e0 la protection de l'environnement. Le titulaire d'un titre minier est tenu de r\u00e9aliser une \u00e9tude d'impact environnemental et social avant le d\u00e9but de toute activit\u00e9 d'exploitation." },
    ],
    definitions: [],
  },

  // ---- INTELLECTUAL PROPERTY 2016-555 ----
  {
    title: "Loi n\u00b0 2016-555 du 26 juillet 2016 relative au droit d'auteur et aux droits voisins",
    title_en: "Law No. 2016-555 of 26 July 2016 on Copyright and Neighboring Rights",
    short_name: 'Loi 2016-555 (Propri\u00e9t\u00e9 intellectuelle)',
    status: 'in_force',
    issued_date: '2016-07-26',
    in_force_date: '2016-07-26',
    url: 'https://www.cndj.ci',
    description: "Loi ivoirienne relative au droit d'auteur et aux droits voisins",
    provisions: [
      { provision_ref: 'art1', section: '1', title: "Article premier - Objet", chapter: "Titre 1 - Dispositions g\u00e9n\u00e9rales", content: "La pr\u00e9sente loi fixe le r\u00e9gime de la protection du droit d'auteur et des droits voisins en C\u00f4te d'Ivoire. Sont prot\u00e9g\u00e9es les oeuvres litt\u00e9raires et artistiques originales, quels qu'en soient le genre, la forme d'expression, le m\u00e9rite ou la destination." },
      { provision_ref: 'art5', section: '5', title: 'Article 5 - Droits patrimoniaux', chapter: "Titre 2 - Des droits de l'auteur", content: "L'auteur d'une oeuvre de l'esprit jouit du droit exclusif d'exploiter son oeuvre sous quelque forme que ce soit et d'en tirer un profit p\u00e9cuniaire. Ce droit comporte le droit de reproduction, le droit de repr\u00e9sentation, le droit de traduction et le droit d'adaptation." },
      { provision_ref: 'art15', section: '15', title: 'Article 15 - Dur\u00e9e de protection', chapter: "Titre 3 - De la dur\u00e9e de protection", content: "Le droit d'auteur dure pendant toute la vie de l'auteur et cinquante ans apr\u00e8s sa mort. Pour les oeuvres de collaboration, les cinquante ans courent \u00e0 compter de la mort du dernier collaborateur survivant." },
    ],
    definitions: [],
  },
];

/* ---------- Main ---------- */

function main(): void {
  console.log("Ivory Coast Law MCP -- Curated Seed Generator");
  console.log('==============================================\n');

  fs.mkdirSync(SEED_DIR, { recursive: true });

  let totalDocs = 0;
  let totalProvisions = 0;
  let totalDefinitions = 0;

  for (const seed of SEEDS) {
    const id = titleToId(seed.title);
    const seedFile = path.join(SEED_DIR, `${id}.json`);

    const parsed: ParsedAct = {
      id,
      type: 'statute',
      title: seed.title,
      title_en: seed.title_en,
      short_name: seed.short_name,
      status: seed.status,
      issued_date: seed.issued_date,
      in_force_date: seed.in_force_date,
      url: seed.url,
      description: seed.description,
      provisions: seed.provisions,
      definitions: seed.definitions,
    };

    fs.writeFileSync(seedFile, JSON.stringify(parsed, null, 2));
    totalDocs++;
    totalProvisions += seed.provisions.length;
    totalDefinitions += seed.definitions.length;

    console.log(`  [${totalDocs}] ${seed.short_name}: ${seed.provisions.length} provisions, ${seed.definitions.length} definitions`);
  }

  console.log(`\n==============================================`);
  console.log(`Seed Generation Complete`);
  console.log(`==============================================`);
  console.log(`  Documents:    ${totalDocs}`);
  console.log(`  Provisions:   ${totalProvisions}`);
  console.log(`  Definitions:  ${totalDefinitions}`);
  console.log(`  Output: ${SEED_DIR}/`);

  // Update census with provision counts
  if (fs.existsSync(CENSUS_PATH)) {
    const census = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8'));
    const today = new Date().toISOString().split('T')[0];
    for (const law of census.laws) {
      const seedPath = path.join(SEED_DIR, `${law.id}.json`);
      if (fs.existsSync(seedPath)) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
        law.ingested = true;
        law.provision_count = seedData.provisions?.length ?? 0;
        law.ingestion_date = today;
      }
    }
    // Recalculate summary
    census.summary.total_laws = census.laws.length;
    census.summary.ingestable = census.laws.filter((l: { classification: string }) => l.classification === 'ingestable').length;
    fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));
    console.log(`\n  Census updated: ${CENSUS_PATH}`);
  }
}

main();
