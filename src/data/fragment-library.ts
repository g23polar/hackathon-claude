import type { Fragment } from '../types';

export interface FragmentCategory {
  name: string;
  emoji: string;
  fragments: string[];
}

export const FRAGMENT_LIBRARY: FragmentCategory[] = [
  {
    name: 'Sandwiches & Food',
    emoji: '🥪',
    fragments: [
      'Bread is architecture. The crust is load-bearing; the crumb is insulation.',
      'A bodega chopped cheese is a neighborhood\'s autobiography written in meat and oil.',
      'A hot dog is a sandwich only if you believe identity is determined by structure rather than intent.',
      'The best meals are the ones where you forget you\'re eating.',
      'Every culture\'s street food tells you what they value: speed, community, or spectacle.',
      'Sourdough is an act of patience in a world that rewards impatience.',
      'A recipe is a score. The cook is the performer.',
      'Salt doesn\'t add flavor. It reveals what was already there.',
    ],
  },
  {
    name: 'Philosophy & Wisdom',
    emoji: '🧠',
    fragments: [
      'Experience without theory is blind, but theory without experience is mere intellectual play.',
      'You have to learn to proceed without certainty.',
      'The map is not the territory, but without maps we don\'t move.',
      'We don\'t see things as they are. We see things as we are.',
      'The obstacle is the way.',
      'Between stimulus and response there is a space. In that space is our freedom.',
      'All models are wrong. Some models are useful.',
      'The only true wisdom is knowing you know nothing.',
      'To understand is to perceive patterns.',
      'Reality is that which, when you stop believing in it, doesn\'t go away.',
    ],
  },
  {
    name: 'Design & Making',
    emoji: '✏️',
    fragments: [
      'Design is not how it looks. Design is how it works.',
      'The details are not the details. They make the design.',
      'Every tool shapes the hand that uses it.',
      'Constraints are the mother of creativity.',
      'A building is a machine for living in.',
      'The best interface is no interface.',
      'Good design is as little design as possible.',
      'Form follows function — but function follows worldview.',
      'The medium is the message.',
      'Architecture is frozen music.',
    ],
  },
  {
    name: 'Music & Sound',
    emoji: '🎵',
    fragments: [
      'Music is the space between the notes.',
      'Every jazz solo is a conversation with the room.',
      'The wrong note played with conviction is more alive than the right note played with fear.',
      'Rhythm is the skeleton. Melody is the skin. Harmony is the nervous system.',
      'Silence is not empty. It is full of answers.',
      'A song you know by heart lives in your body, not your brain.',
      'Tuning is a negotiation between mathematics and the ear.',
      'The best musicians listen more than they play.',
    ],
  },
  {
    name: 'Human Connection',
    emoji: '💬',
    fragments: [
      'Hurt people hurt people.',
      'Nothing changes if nothing changes.',
      'The opposite of addiction is not sobriety. It\'s connection.',
      'People don\'t resist change. They resist being changed.',
      'You can\'t hate someone whose story you know.',
      'Loneliness is not the absence of people. It\'s the absence of meaning.',
      'Every person you meet knows something you don\'t.',
      'The conversation is the relationship.',
      'We teach people how to treat us.',
      'Trust is built in drops and lost in buckets.',
    ],
  },
  {
    name: 'Nature & Science',
    emoji: '🌿',
    fragments: [
      'There are cathedrals everywhere for those with eyes to see.',
      'A tree is a slow explosion.',
      'Entropy is not disorder. It is the universe forgetting where it put things.',
      'The universe is under no obligation to make sense to you.',
      'Evolution doesn\'t have a direction. It has a memory.',
      'Water always finds the path of least resistance — and carves canyons doing it.',
      'Every atom in your body was forged in a star that died.',
      'Emergence: the whole is not only greater than the parts — it is different from them.',
    ],
  },
  {
    name: 'Technology & AI',
    emoji: '🤖',
    fragments: [
      'We shape our tools, and thereafter our tools shape us.',
      'The computer is a bicycle for the mind.',
      'Any sufficiently advanced technology is indistinguishable from magic.',
      'Automation doesn\'t replace jobs. It replaces tasks.',
      'Data is not information. Information is not knowledge. Knowledge is not wisdom.',
      'The best technology disappears.',
      'AI doesn\'t think. It pattern-matches at scale. But then again, what is thinking?',
      'Code is poetry that happens to execute.',
    ],
  },
  {
    name: 'Space & Place',
    emoji: '🏙️',
    fragments: [
      'A city is a language spoken by buildings.',
      'Home is not where you\'re from. It\'s where you stop explaining yourself.',
      'Every room remembers what happened in it.',
      'The best public spaces make strangers feel like neighbors.',
      'A border is a story one group tells to keep another group out.',
      'You can know a culture by what it builds to last.',
      'Ruins are the architecture of memory.',
      'The map you carry in your head is more real than the ground beneath your feet.',
    ],
  },
  {
    name: 'Time & Memory',
    emoji: '⏳',
    fragments: [
      'Nostalgia is a dirty liar that insists things were better than they were.',
      'The future is already here — it\'s just not evenly distributed.',
      'Memory is not a recording. It\'s a reconstruction.',
      'Every photograph is a small death.',
      'We are what we repeatedly do.',
      'History doesn\'t repeat, but it rhymes.',
      'The present is the only time that exists, and it has no duration.',
      'Tradition is not the worship of ashes but the preservation of fire.',
    ],
  },
  {
    name: 'Body & Perception',
    emoji: '👁️',
    fragments: [
      'The body knows things the mind refuses to admit.',
      'You don\'t have a body. You are a body.',
      'Pain is inevitable. Suffering is optional.',
      'The eyes see only what the mind is prepared to comprehend.',
      'Dance is the hidden language of the soul.',
      'Breath is the bridge between the voluntary and the involuntary.',
      'Your posture is your autobiography.',
      'We feel before we think. Always.',
    ],
  },
];

export function getAllFragments(): string[] {
  return FRAGMENT_LIBRARY.flatMap((cat) => cat.fragments);
}

export function getRandomFragments(count: number): Fragment[] {
  const all = getAllFragments();
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, all.length)).map((text, i) => ({
    id: `frag-${Date.now()}-${i}`,
    text,
  }));
}

export function getRandomFromCategory(categoryName: string, count: number): Fragment[] {
  const cat = FRAGMENT_LIBRARY.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (!cat) return [];
  const shuffled = [...cat.fragments].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((text, i) => ({
    id: `frag-${Date.now()}-${i}`,
    text,
  }));
}

export function getRandomDiverse(count: number): Fragment[] {
  const shuffledCats = [...FRAGMENT_LIBRARY].sort(() => Math.random() - 0.5);
  const picks: Fragment[] = [];
  for (let i = 0; i < Math.min(count, shuffledCats.length); i++) {
    const cat = shuffledCats[i];
    const text = cat.fragments[Math.floor(Math.random() * cat.fragments.length)];
    picks.push({ id: `frag-${Date.now()}-${i}`, text });
  }
  return picks;
}
