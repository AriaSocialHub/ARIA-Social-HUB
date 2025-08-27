

import React from 'react';
import {
  Cat, Dog, Fish, Rabbit, Turtle, Bird, Bot, Ghost, User,
  Gamepad2, Rocket, Telescope, Orbit, Bug, Carrot, Rat, Heart, PawPrint, Origami,
  Sprout, Gem, Crown, Anchor, Lollipop, Pizza, Cookie, Grape
} from 'lucide-react';

const Owl: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
    React.createElement('ellipse', { cx: "12", cy: "9", rx: "8", ry: "7" }),
    React.createElement('path', { d: "M12 9a4 4 0 1 1 8 0v12h-4C9.4 21 4 15.6 4 9a4 4 0 1 1 8 0v1" }),
    React.createElement('path', { d: "M8 9h.01" }),
    React.createElement('path', { d: "M16 9h.01" }),
    React.createElement('path', { d: "M20 21a3.9 3.9 0 1 1 0-7.8" }),
    React.createElement('path', { d: "M10 19.4V22" }),
    React.createElement('path', { d: "M14 20.85V22" }))
);

const Cocktail: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
    React.createElement('path', { d: "M9 6 6.6 2.8C6.3 2.4 5.6 2 5 2H2" }),
    React.createElement('path', { d: "m18 6-7 8-7-8Z" }),
    React.createElement('path', { d: "M15.4 9.1A4 4 0 1 0 14 6" }),
    React.createElement('path', { d: "M11 14v8" }),
    React.createElement('path', { d: "M7 22h8" }))
);

const Ufo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
    React.createElement('path', { d: "M18 8c0 1-3 2-6 2S6 9 6 8a6 6 0 0 1 12 0" }),
    React.createElement('path', { d: "M7 13h.01" }),
    React.createElement('path', { d: "M12 14h.01" }),
    React.createElement('path', { d: "M17 13h.01" }),
    React.createElement('path', { d: "M6 8.1c-2.4 1-4 2.6-4 4.4 0 3 4.5 5.5 10 5.5s10-2.5 10-5.5c0-1.8-1.6-3.4-4-4.4" }),
    React.createElement('path', { d: "m7 22 2-4" }),
    React.createElement('path', { d: "m17 22-2-4" }))
);

const Shark: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
    React.createElement('path', { d: "M3.6 15a9.07 9.07 0 0 0 11.7 5.3S19 22 22 22c0 0-1-3-3-4.5 1.1-1.5 1.9-3.3 2-5.3l-8 4.6a1.94 1.94 0 1 1-2-3.4l6-3.5s5-2.8 5-6.8c0-.6-.4-1-1-1h-9c-1.8 0-3.4.5-4.8 1.5C5.7 2.5 3.9 2 2 2c0 0 1.4 2.1 2.3 4.5A10.63 10.63 0 0 0 3.1 13" }),
    React.createElement('path', { d: "M13.8 7 13 6" }),
    React.createElement('path', { d: "M21.12 6h-3.5c-1.1 0-2.8.5-3.82 1L9 9.8C3 11 2 15 2 15h4" }))
);

const Spider: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
    React.createElement('path', { d: "M10 5v1" }),
    React.createElement('path', { d: "M14 6V5" }),
    React.createElement('path', { d: "M10 10.4V8a2 2 0 1 1 4 0v2.4" }),
    React.createElement('path', { d: "M7 15H4l-2 2.5" }),
    React.createElement('path', { d: "M7.42 17 5 20l1 2" }),
    React.createElement('path', { d: "m8 12-4-1-2-3" }),
    React.createElement('path', { d: "M9 11 5.5 6 7 2" }),
    React.createElement('path', { d: "M8 18a5 5 0 1 1 8 0s-2 3-4 4c-2-1-4-4-4-4" }),
    React.createElement('path', { d: "m15 11 3.5-5L17 2" }),
    React.createElement('path', { d: "m16 12 4-1 2-3" }),
    React.createElement('path', { d: "M17 15h3l2 2.5" }),
    React.createElement('path', { d: "M16.57 17 19 20l-1 2" }))
);

const Fox: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
    React.createElement('path', { d: "M19.9 8.3C20.6 7 21 5.6 21 4c0-.6-.4-1-1-1-2.3 0-4.3.8-5.9 2.2a14.92 14.92 0 0 0-4.2 0A8.78 8.78 0 0 0 4 3c-.6 0-1 .4-1 1 0 1.6.4 3 1.1 4.3-.6.7-1.1 1.4-1.4 2.2C4 13 11 16 12 16s8-3 9.3-5.5c-.3-.8-.8-1.5-1.4-2.2" }),
    React.createElement('path', { d: "M9 9v.5" }),
    React.createElement('path', { d: "M13 13h-2" }),
    React.createElement('path', { d: "M12 16v-3" }),
    React.createElement('path', { d: "M15 9v.5" }),
    React.createElement('path', { d: "M6.3 20.5A6.87 6.87 0 0 0 9 15H2.2c.8 4 4.9 7 9.8 7 5.5 0 10-3.8 10-8.5 0-1.1-.2-2.1-.7-3" }))
);

const Crab: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
    React.createElement('path', { d: "M7.5 14A6 6 0 1 1 10 2.36L8 5l2 2S7 8 2 8" }),
    React.createElement('path', { d: "M16.5 14A6 6 0 1 0 14 2.36L16 5l-2 2s3 1 8 1" }),
    React.createElement('path', { d: "M10 13v-2" }),
    React.createElement('path', { d: "M14 13v-2" }),
    React.createElement('ellipse', { cx: "12", cy: "17.5", rx: "7", ry: "4.5" }),
    React.createElement('path', { d: "M2 16c2 0 3 1 3 1" }),
    React.createElement('path', { d: "M2 22c0-1.7 1.3-3 3-3" }),
    React.createElement('path', { d: "M19 17s1-1 3-1" }),
    React.createElement('path', { d: "M19 19c1.7 0 3 1.3 3 3" }))
);

const Cow: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
    React.createElement('path', { d: "M17.8 15.1a10 10 0 0 0 .9-7.1h.3c1.7 0 3-1.3 3-3V3h-3c-1.3 0-2.4.8-2.8 1.9a10 10 0 0 0-8.4 0C7.4 3.8 6.3 3 5 3H2v2c0 1.7 1.3 3 3 3h.3a10 10 0 0 0 .9 7.1" }),
    React.createElement('path', { d: "M9 9.5v.5" }),
    React.createElement('path', { d: "M15 9.5v.5" }),
    React.createElement('path', { d: "M15 22a4 4 0 1 0-3-6.6A4 4 0 1 0 9 22Z" }),
    React.createElement('path', { d: "M9 18h.01" }),
    React.createElement('path', { d: "M15 18h.01" }))
);

const Bull: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
    React.createElement('path', { d: "M7 10a5 5 0 0 1-4-8 4 4 0 0 0 4 4h10a4 4 0 0 0 4-4 5 5 0 0 1-4 8" }),
    React.createElement('path', { d: "M6.4 15c-.3-.6-.4-1.3-.4-2 0-4 3-3 3-7" }),
    React.createElement('path', { d: "M10 12.5v1.6" }),
    React.createElement('path', { d: "M17.6 15c.3-.6.4-1.3.4-2 0-4-3-3-3-7" }),
    React.createElement('path', { d: "M14 12.5v1.6" }),
    React.createElement('path', { d: "M15 22a4 4 0 1 0-3-6.7A4 4 0 1 0 9 22Z" }),
    React.createElement('path', { d: "M9 18h.01" }),
    React.createElement('path', { d: "M15 18h.01" }))
);

const Bear: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
    React.createElement('path', { d: "m6 7 .5.5" }),
    React.createElement('path', { d: "m18 7-.5.5" }),
    React.createElement('path', { d: "M20.8 4.2c-1.6-1.6-4.1-1.6-5.7 0l-1 1a13.6 13.6 0 0 0-4.2 0l-1-1a4 4 0 0 0-5.8 5.55A7 7 0 0 0 2 13.5C2 18.2 6.5 22 12 22s10-3.8 10-8.5a7 7 0 0 0-1.1-3.8c1.5-1.6 1.5-4-.1-5.5" }),
    React.createElement('path', { d: "M10 12v-.5" }),
    React.createElement('path', { d: "M14 12v-.5" }),
    React.createElement('path', { d: "M14 16h-4" }),
    React.createElement('path', { d: "M12 16v2" }))
);

export const avatarList = [
  'Cat', 'Dog', 'Fish', 'Rabbit', 'Turtle', 'Bird', 'Bot', 'Ghost',
  'Gamepad2', 'Rocket', 'Telescope', 'Orbit', 'Bug', 'Carrot', 'Rat', 'Heart', 'PawPrint', 'Origami',
  'Sprout', 'Gem', 'Crown', 'Anchor', 'Lollipop', 'Pizza', 'Cookie', 'Grape', 'Owl',
  'Cocktail', 'Ufo', 'Shark', 'Spider', 'Fox', 'Crab', 'Cow', 'Bull', 'Bear'
];

export const avatarColors: Record<string, string> = {
    Cat: '#EF4444',      // red-500
    Dog: '#F97316',      // orange-500
    Fish: '#6366F1',      // indigo-500
    Rabbit: '#EC4899',    // pink-500
    Turtle: '#22C55E',    // green-500
    Bird: '#3B82F6',      // blue-500
    Bot: '#8B5CF6',      // violet-500
    Ghost: '#EAB308',     // yellow-500
    Gamepad2: '#0EA5E9',  // sky-500
    Rocket: '#EA580C',    // orange-600
    Telescope: '#3B82F6', // blue-500
    Orbit: '#A855F7',     // purple-500
    Bug: '#DC2626',      // red-600
    Carrot: '#EA580C',    // orange-600
    Rat: '#4F46E5',      // slate-600 changed to indigo-600
    Heart: '#F43F5E',      // rose-500
    PawPrint: '#84CC16',  // lime-500
    Origami: '#06B6D4',   // cyan-500
    Sprout: '#10B981',    // emerald-500
    Gem: '#0EA5E9',      // sky-500
    Crown: '#F59E0B',     // amber-500
    Anchor: '#0D9488',    // teal-600
    Lollipop: '#EF4444',  // red-500
    Pizza: '#EAB308',     // yellow-500
    Cookie: '#D97706',    // amber-600
    Grape: '#A855F7',     // purple-500
    Owl: '#14B8A6',       // teal-500 for a bright, wise look
    // New Icons
    Cocktail: '#EC4899',  // pink-500
    Ufo: '#84CC16',      // lime-500
    Shark: '#0EA5E9',    // sky-500
    Spider: '#EF4444',   // red-500
    Fox: '#F97316',      // orange-500
    Crab: '#DC2626',     // red-600
    Cow: '#A855F7',      // purple-500
    Bull: '#EA580C',     // orange-600
    Bear: '#D97706',     // amber-600
};

export const avatarComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Cat, Dog, Fish, Rabbit, Turtle, Bird, Bot, Ghost, User, // User for fallback
  Gamepad2, Rocket, Telescope, Orbit, Bug, Carrot, Rat, Heart, PawPrint, Origami,
  Sprout, Gem, Crown, Anchor, Lollipop, Pizza, Cookie, Grape, Owl,
  // New Icons
  Cocktail, Ufo, Shark, Spider, Fox, Crab, Cow, Bull, Bear
};

export const getAvatar = (name?: string | null): React.FC<React.SVGProps<SVGSVGElement>> => {
    if (name && avatarComponents[name]) {
        return avatarComponents[name];
    }
    return User;
};

export const getAvatarColor = (name?: string | null): string => {
    if (name && avatarColors[name]) {
        return avatarColors[name];
    }
    return '#6B7280'; // gray-500 as fallback
};