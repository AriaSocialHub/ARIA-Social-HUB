

import React from 'react';

export interface Service<T> {
  id: string;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  description: string;
  parser?: (file: File) => Promise<Record<string, T[]>>;
  appComponent: React.FC<any>;
  category?: 'document' | 'utility' | 'core';
  detailViews?: Record<string, React.FC<any>>;
  itemNoun?: string;
  itemNounPlural?: string;
}

export interface Ticket {
  id: string;
  utente: string | null;
  nTicket: string | null;
  argomento: string;
  richiesta: string | null;
  risoluzione: string | null;
  data: string | null;
  canale: string | null;
  operatore: string | null;
}

export type CategorizedTickets = Record<string, Ticket[]>;

export interface Procedura {
  id: string;
  casistica: string;
  comeAgire: string | null;
  dataInserimento: string | null;
}

export type CategorizedProcedure = Record<string, Procedura[]>;

export interface Guideline {
  id: string;
  casistica: string;
  comeAgire: string | null;
  dataInserimento: string | null;
}

export type CategorizedGuidelines = Record<string, Guideline[]>;

export interface UsefulContent {
  id: string;
  casistica: string;
  comeAgire: string | null;
  dataInserimento: string | null;
}

export type CategorizedUsefulContent = Record<string, UsefulContent[]>;


// --- File Storage Types ---
export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // Changed from dataUrl to url
  createdAt: string; // ISO
  author: string;
  description?: string;
  category?: 'PDF' | 'Document' | 'Spreadsheet' | 'Presentation' | 'Other';
}

export type CategorizedFiles = Record<string, StoredFile[]>;

export interface ArchiveCategoryContent {
  textItems: UsefulContent[];
  files: StoredFile[];
}

export type CategorizedArchiveContent = Record<string, ArchiveCategoryContent>;
// --- End File Storage Types ---


export interface Campaign {
  id: string;
  title: string;
  image: string | null;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  type: string; // "campo jolly"
  channel: 'Facebook' | 'Instagram' | 'TikTok' | 'Linkedin' | 'X' | '';
  dark: boolean;
  link: string | null;
}

export type CampaignsData = Campaign[];

export interface PauseData {
  id:string;
  operatore: string;
  prima_pausa: string | null;
  seconda_pausa: string | null;
  pausa_pranzo: string | null;
  terza_pausa: string | null;
  actual_start_times: Record<string, string | null>;
  creatorAvatar: string;
  creatorName: string;
}

export type AllPauseData = PauseData[];

export interface UserProfile {
  name: string;
  avatar: string;
}

export interface OnlineUser extends UserProfile {
  accessLevel: 'admin' | 'view';
  sessionId: string;
  lastSeen: number; // Stored as timestamp
}

// User as stored in the persistent DB
export interface User extends UserProfile {
  accessLevel: 'admin' | 'view';
  password?: string;
  forcePasswordChange?: boolean;
}


export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string; // ISO string
  isFeatured: boolean;
  author: string; 
  isVisibleOnDashboard?: boolean;
}
export type NewsData = NewsArticle[];

export interface BannerItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
}
export type BannersData = BannerItem[];

// Types for new Comment Analysis App
export interface CommentDataPoint {
  timestamp: string; // ISO format string for datetime-local
  totalComments: number;
}

export interface CommentPost {
  id: string;
  name: string;
  platform: string;
  publicationDate: string; // ISO format string for datetime-local
  correlationTag: string | null;
  dataPoints: CommentDataPoint[];
}

export type CommentAnalysisData = CommentPost[];

// Types for new Shifts App
export interface Shift {
  id: string;
  employeeName: string;
  shiftTime: string;
  baseMode: '-' | 'Smart Working' | 'Sede';
  justification: '-' | 'Permesso' | 'Straordinario' | 'Riunione Sindacale' | 'Visita Medica' | 'Riposo' | 'Ferie' | 'Malattia' | 'Festivo';
  permStart?: string;
  permEnd?: string;
}

export type ShiftsData = Record<string, Shift[]>; // Key is YYYY-MM-DD

// Types for new Manual Ticket Management App
export interface ManualTicket {
  id: string;
  piattaforma: string;
  nome_utente: string;
  testo_contenuto: string;
  data_domanda: string; // Combined ISO format
  data_gestione: string | null; // Combined ISO format
  moderatore: string | null;
  soglia: 'OK' | 'KO' | '' | null;
  id_piattaforma: string | null;
  argomento: string | null;
  azione_principale: 'Risposto' | 'Nascosto' | 'Reaction' | 'Ignorato' | null;
  azione_inoltro: 'Inoltrato al BO' | 'Rilasciato al FO' | '';
}

export type ManualTicketsData = ManualTicket[];

// --- Notification System Types ---
export interface NotificationItem {
  id: string;
  message: string;
  timestamp: string; // ISO String
  serviceId: string; // e.g., 'tickets', 'procedures', 'news'
  categoryName?: string; // e.g., 'Sicurezza'
  itemId?: string; // e.g., 'ticket-123'
  readBy: string[]; // Array of user names who have read it
  author: string; // User who triggered the notification
}

export interface NavigationTarget {
  serviceId: string;
  categoryName?: string;
  itemId?: string;
}

// --- DB structure ---
interface ServiceData {
    data: any | null;
    fileName: string | null;
    metadata?: Record<string, { icon: string; color: string; type?: 'text' | 'file'; createdAt?: string; }>;
}

export interface AppData {
    services_data: Record<string, ServiceData>;
    notifications: NotificationItem[];
    users: Record<string, User>; // Central user database
}
