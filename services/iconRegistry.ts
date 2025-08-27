import React from 'react';
import {
  // General & Default
  Folder, Archive, Briefcase, Package, FileText, Files,
  
  // Categories from user request
  Zap, Wind, // Energia
  Users, Heart, Baby, // Famiglia
  Home, // Casa
  Car, // Auto
  HeartPulse, Stethoscope, // Sanità
  Dumbbell, Bike, Trophy, Medal, // Sport, Olimpiadi
  Shirt, ShoppingBag, // Moda
  Plane, Map, Globe, Luggage, // Turismo
  School, GraduationCap, BookOpen, ToyBrick, // Asilo, Scuola
  Building2, Landmark, Construction, Factory, // Infrastrutture
  Palette, Drama, Calendar, Ticket, Music, // Cultura, Eventi
  Mountain, Trees, Leaf, Sprout, // Paesaggi, Ambiente
  Megaphone, // Bandi
  CircleDollarSign, Banknote, PiggyBank, // Soldi
  
  // Other useful icons
  Star, MessageSquare, Settings, Cloud, Key, Lock, Mail, User, AlertTriangle, Info, HelpCircle
} from 'lucide-react';

export const iconList: string[] = [
  'Folder', 'Archive', 'Briefcase', 'Package', 'FileText', 'Files', 'Zap', 'Wind', 'Users', 'Heart', 'Baby', 'Home', 'Car', 'HeartPulse', 'Stethoscope', 'Dumbbell', 'Bike', 'Trophy', 'Medal', 'Shirt', 'ShoppingBag', 'Plane', 'Map', 'Globe', 'Luggage', 'School', 'GraduationCap', 'BookOpen', 'ToyBrick', 'Building2', 'Landmark', 'Construction', 'Factory', 'Palette', 'Drama', 'Calendar', 'Ticket', 'Music', 'Mountain', 'Trees', 'Leaf', 'Sprout', 'Megaphone', 'CircleDollarSign', 'Banknote', 'PiggyBank',
  'Star', 'MessageSquare', 'Settings', 'Cloud', 'Key', 'Lock', 'Mail', 'User', 'AlertTriangle', 'Info', 'HelpCircle'
];

export const iconComponents: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  // General & Default
  Folder, Archive, Briefcase, Package, FileText, Files,
  
  // Categories from user request
  Zap, Wind, // Energia
  Users, Heart, Baby, // Famiglia
  Home, // Casa
  Car, // Auto
  HeartPulse, Stethoscope, // Sanità
  Dumbbell, Bike, Trophy, Medal, // Sport, Olimpiadi
  Shirt, ShoppingBag, // Moda
  Plane, Map, Globe, Luggage, // Turismo
  School, GraduationCap, BookOpen, ToyBrick, // Asilo, Scuola
  Building2, Landmark, Construction, Factory, // Infrastrutture
  Palette, Drama, Calendar, Ticket, Music, // Cultura, Eventi
  Mountain, Trees, Leaf, Sprout, // Paesaggi, Ambiente
  Megaphone, // Bandi
  CircleDollarSign, Banknote, PiggyBank, // Soldi
  
  // Other useful icons
  Star, MessageSquare, Settings, Cloud, Key, Lock, Mail, User, AlertTriangle, Info, HelpCircle,
};

export const getIcon = (name?: string | null): React.FC<React.SVGProps<SVGSVGElement>> => {
    if (name && iconComponents[name]) {
        return iconComponents[name];
    }
    return Folder; // Default icon
};
