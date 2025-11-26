


import { Service } from '../types.ts';
import { Archive, FileText, ClipboardCheck, CalendarDays, Clock, LayoutGrid, TrendingUp, Users, FilePenLine, BookMarked, Database, HeartPulse, Rss, Bird, Telescope, DatabaseZap, Search } from 'lucide-react';

// Parsers
import { parseXLSX } from './xlsxParser.ts';
import { parseProcedureXLSX } from './xlsxProcedureParser.ts';
import { parseGuidelineXLSX } from './xlsxGuidelineParser.ts';
import { parseFalcoPellegrinoXLSX } from './xlsxFalcoPellegrinoParser.ts';
import { parseVademecumXLSX } from './xlsxVademecumParser.ts';
import { parseBelvedereXLSX } from './xlsxBelvedereParser.ts';
import { parseSanitaXLSX } from './xlsxSanitaParser.ts';
import { parseNewsXLSX } from './xlsxNewsParser.ts';

// App Views
import DashboardApp from '../DashboardApp.tsx';
import ResourceApp from '../ResourceApp.tsx';
import CampaignsApp from '../CampaignsApp.tsx';
import TeamBreaksApp from '../TeamBreaksApp.tsx';
import CommentAnalysisApp from '../CommentAnalysisApp.tsx';
import ShiftsApp from '../ShiftsApp.tsx';
import ManualTicketApp from '../ManualTicketApp.tsx';
import NewsArchiveApp from '../NewsArchiveApp.tsx';
import RepositoryApp from '../RepositoryApp.tsx';
import UserManagementApp from '../UserManagementApp.tsx';
import ArchiveManagementApp from '../ArchiveManagementApp.tsx';
import ArchiveConsultationApp from '../ArchiveConsultationApp.tsx';


// Detail Views
import CategoryDetailView from '../components/CategoryDetailView.tsx';
import ProcedureDetailView from '../components/ProcedureDetailView.tsx';
import GuidelineDetailView from '../components/GuidelineDetailView.tsx';
import ArchiveDetailView from '../components/ArchiveDetailView.tsx';


export const services: Service<any>[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutGrid,
    description: "Panoramica generale dell'applicazione.",
    appComponent: DashboardApp,
    category: 'core',
  },
  {
    id: 'tickets',
    name: 'Ticket Utili',
    icon: Archive,
    description: 'File contenente i ticket di supporto esportati.',
    parser: parseXLSX,
    appComponent: ResourceApp,
    category: 'document',
    detailViews: { default: CategoryDetailView },
    itemNoun: 'voce',
    itemNounPlural: 'voci'
  },
  {
    id: 'procedures',
    name: 'Procedure',
    icon: FileText,
    description: 'File con le procedure operative standard.',
    parser: parseProcedureXLSX,
    appComponent: ResourceApp,
    category: 'document',
    detailViews: { default: ProcedureDetailView },
    itemNoun: 'procedura',
    itemNounPlural: 'procedure'
  },
  {
    id: 'guidelines',
    name: 'Linee Guida',
    icon: ClipboardCheck,
    description: 'File con le linee guida di comunicazione.',
    parser: parseGuidelineXLSX,
    appComponent: ResourceApp,
    category: 'document',
    detailViews: { default: GuidelineDetailView },
    itemNoun: 'linea guida',
    itemNounPlural: 'linee guida'
  },
  {
    id: 'sanita',
    name: 'Tematiche Sanitarie',
    icon: HeartPulse,
    description: 'File con le procedure per la gestione di tematiche sanitarie.',
    parser: parseSanitaXLSX,
    appComponent: ResourceApp,
    category: 'document',
    detailViews: { default: ArchiveDetailView },
    itemNoun: 'tematica',
    itemNounPlural: 'tematiche'
  },
  {
    id: 'documentArchive',
    name: 'Falco Pellegrino',
    icon: Bird,
    description: 'File di FAQ e informazioni sul progetto Falco Pellegrino.',
    parser: parseFalcoPellegrinoXLSX,
    appComponent: ResourceApp,
    category: 'document',
    detailViews: { default: ArchiveDetailView },
    itemNoun: 'contenuto',
    itemNounPlural: 'contenuti'
  },
  {
    id: 'vademecum',
    name: 'Vademecum',
    icon: BookMarked,
    description: 'File contenente il vademecum con casistiche e modalità di azione.',
    parser: parseVademecumXLSX,
    appComponent: ResourceApp,
    category: 'document',
    detailViews: { default: ArchiveDetailView },
    itemNoun: 'contenuto',
    itemNounPlural: 'contenuti'
  },
  {
    id: 'belvedere',
    name: 'Belvedere',
    icon: Telescope,
    description: 'Linee guida operative e ticket di supporto per il progetto Belvedere.',
    parser: parseBelvedereXLSX,
    appComponent: ResourceApp,
    category: 'document',
    detailViews: {
      'TICKET UTILI': CategoryDetailView,
      default: ArchiveDetailView,
    },
    itemNoun: 'voce',
    itemNounPlural: 'voci'
  },
  {
    id: 'newsArchive',
    name: 'Archivio News',
    icon: Rss,
    description: 'Archivio di tutte le news e gli aggiornamenti. Carica un file XLSX per aggiornare i post.',
    parser: parseNewsXLSX,
    appComponent: NewsArchiveApp,
    category: 'utility',
  },
  {
    id: 'repository',
    name: 'Archivio File',
    icon: Database,
    description: 'Archivio di file e documenti con ricerca semantica.',
    appComponent: RepositoryApp,
    category: 'utility',
  },
  {
    id: 'teamBreaks-primo-livello',
    name: 'Gestione Pause',
    icon: Clock,
    description: 'Gestione delle pause del team.',
    appComponent: TeamBreaksApp,
    category: 'utility',
  },
  {
    id: 'campaigns',
    name: 'Campagne',
    icon: CalendarDays,
    description: 'Gestione del calendario e archivio delle campagne social.',
    appComponent: CampaignsApp,
    category: 'utility',
  },
  {
    id: 'manualTickets',
    name: 'Ticket manuali',
    icon: FilePenLine,
    description: 'Inserimento e gestione manuale dei ticket di supporto.',
    appComponent: ManualTicketApp,
    category: 'utility',
  },
  {
    id: 'commentAnalysis',
    name: 'Trend commenti',
    icon: TrendingUp,
    description: 'Analizza la velocità e il trend dei commenti dei post social.',
    appComponent: CommentAnalysisApp,
    category: 'utility',
  },
  {
    id: 'userManagement',
    name: 'Gestione Utenze',
    icon: Users,
    description: "Gestisci gli account utente dell'applicazione.",
    appComponent: UserManagementApp,
    category: 'utility',
  },
  {
    id: 'archiveManagement',
    name: 'Gestione',
    icon: DatabaseZap,
    description: "Gestione dei database Archivio RL.",
    appComponent: ArchiveManagementApp,
    category: 'archive_rl',
  },
  {
    id: 'archiveConsultation',
    name: 'Consultazione',
    icon: Search,
    description: "Ricerca e consultazione Archivio RL.",
    appComponent: ArchiveConsultationApp,
    category: 'archive_rl',
  },
];

export const serviceMap = services.reduce((acc, service) => {
    acc[service.id] = service;
    return acc;
}, {} as Record<string, Service<any>>);