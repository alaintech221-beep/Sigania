import rawPanneaux from './panneaux.json';
import { CategoryId, CategoryInfo, RoadSign } from '../types/signs';

export const ROAD_SIGNS: RoadSign[] = rawPanneaux as RoadSign[];

export function getWikimediaSignUrl(code: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/France%20road%20sign%20${encodeURIComponent(code)}.svg`;
}

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  danger: {
    id: 'danger',
    codePrefix: 'A',
    name: 'Danger (A)',
    description: 'Annonce un danger potentiel ou une configuration à risque sur la chaussée.',
    color: '#ef4444',
    bgColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    borderColor: 'border-red-500/30',
    iconType: 'triangle'
  },
  priorite: {
    id: 'priorite',
    codePrefix: 'AB',
    name: 'Priorité (AB)',
    description: 'Définit les règles de priorité aux carrefours et dans les passages étroits.',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderColor: 'border-amber-500/30',
    iconType: 'diamond'
  },
  interdiction: {
    id: 'interdiction',
    codePrefix: 'B',
    name: 'Interdiction (B)',
    description: 'Notifie une interdiction formelle ou restriction d\'usage aux conducteurs.',
    color: '#f43f5e',
    bgColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    borderColor: 'border-rose-500/30',
    iconType: 'circle-slash'
  },
  obligation: {
    id: 'obligation',
    codePrefix: 'B',
    name: 'Obligation (B)',
    description: 'Prescrit une manœuvre obligatoire ou réserve une voie à un type d\'usager.',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    borderColor: 'border-blue-500/30',
    iconType: 'circle-arrow'
  },
  indication: {
    id: 'indication',
    codePrefix: 'C',
    name: 'Indication (C)',
    description: 'Délivre des informations utiles sur la conduite, les services et installations.',
    color: '#06b6d4',
    bgColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    iconType: 'square'
  },
  direction: {
    id: 'direction',
    codePrefix: 'D',
    name: 'Direction (D)',
    description: 'Panneaux de guidage, signalisation de direction, localités et autoroutes.',
    color: '#10b981',
    bgColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    iconType: 'compass'
  },
  panonceau: {
    id: 'panonceau',
    codePrefix: 'M',
    name: 'Panonceaux (M)',
    description: 'Complètent les panneaux en précisant la distance, l\'étendue ou les catégories.',
    color: '#8b5cf6',
    bgColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    borderColor: 'border-purple-500/30',
    iconType: 'tag'
  },
  zone: {
    id: 'zone',
    codePrefix: 'B/C',
    name: 'Zones (Zone 30, Rencontre)',
    description: 'Aménagements et zones à vitesse ou priorité spécifique (zone 30, piétonne, etc.).',
    color: '#ec4899',
    bgColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    borderColor: 'border-pink-500/30',
    iconType: 'layers'
  },
  feu: {
    id: 'feu',
    codePrefix: 'R',
    name: 'Feux & Signaux Lumineux',
    description: 'Feux tricolores, feux clignotants, signaux d\'affectation de voies et passages piétons.',
    color: '#eab308',
    bgColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    iconType: 'traffic-cone'
  },
  marquage: {
    id: 'marquage',
    codePrefix: 'Marquage',
    name: 'Marquage au sol',
    description: 'Lignes continues, discontinues, flèches de rabattement, zébras et bandes cyclables.',
    color: '#64748b',
    bgColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    borderColor: 'border-slate-500/30',
    iconType: 'minus'
  },
  agent: {
    id: 'agent',
    codePrefix: 'Police',
    name: 'Gestes des Agents',
    description: 'Injonctions et gestes des agents de la circulation prioritaires sur toute signalisation.',
    color: '#6366f1',
    bgColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    borderColor: 'border-indigo-500/30',
    iconType: 'user-check'
  }
};
