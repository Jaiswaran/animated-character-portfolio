/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface StoryAct {
  roman: string;
  actTitle: string;
  sceneTitle: string;
  story: string;
  motto: string;
  badgeBg: string;
  badgeTextColor: string;
  badgeBorder: string;
}

const STORY_ACTS: StoryAct[] = [
  {
    roman: 'I',
    actTitle: 'Act One',
    sceneTitle: 'The Lost Falling Star',
    story:
      'Before Pip wore his star nightcap, he was just a little skull baby sitting by the open observatory sill. One night, an ember from a stray comet tumbled into his lap. Instead of letting it burn out, he cradled it in his nightcap, giving birth to the first everlasting bedtime glow.',
    motto: '“Warmth lives where you make room for it.”',
    badgeBg: 'bg-soft-blush',
    badgeTextColor: 'text-rich-berry',
    badgeBorder: 'border-rich-berry/20',
  },
  {
    roman: 'II',
    actTitle: 'Act Two',
    sceneTitle: 'The Wind-Up Discovery',
    story:
      'Tired of spooky nighttime whispers, Pip discovered an antique porcelain music box crowned with a miniature unicorn. With every crank of its brass key, spinning notes absorbed room chills, converting cold room shadows into soft lavender lullabies.',
    motto: '“One gentle melody can hush a thousand anxieties.”',
    badgeBg: 'bg-star-gold/40',
    badgeTextColor: 'text-warm-brown',
    badgeBorder: 'border-star-gold',
  },
  {
    roman: 'III',
    actTitle: 'Act Three',
    sceneTitle: 'The Junior Dream Engineer',
    story:
      'Commissioned by the Moon herself, Pip boarded his permanent floating cumulus cloud. With lantern in one hand and music box in the other, he floats through the twilight sky, ensuring no child or coder falls asleep without sweet, restful peace.',
    motto: '“Sleep tight, hacker. Tomorrow is full of light.”',
    badgeBg: 'bg-dream-lavender',
    badgeTextColor: 'text-plum',
    badgeBorder: 'border-plum/20',
  },
];

export const OriginStorySection: React.FC = () => {
  return (
    <section
      id="origin"
      className="py-16 md:py-20 bg-soft-blush/20 dark:bg-plum/40 border-y border-rich-berry/10 relative"
      aria-label="How Pip Found His Wings Origin Story"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <span className="font-bubbly text-xs tracking-widest uppercase text-rich-berry dark:text-star-gold bg-soft-blush dark:bg-plum px-3.5 py-1 rounded-full border border-rich-berry/20">
            Chronicles of the Midnight Nursery
          </span>
          <h2 className="font-serif-headline text-3xl sm:text-5xl font-bold text-plum dark:text-star-gold mt-3">
            How Pip Found His Wings
          </h2>
          <p className="font-bubbly text-warm-brown/80 dark:text-cream/70 text-sm sm:text-base mt-2">
            A three-chapter storybook scroll detailing the genesis of our skull baby sleep engineer.
          </p>
        </div>

        {/* 3 Story Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {STORY_ACTS.map((act) => (
            <article
              key={act.roman}
              className="bg-white dark:bg-plum rounded-3xl p-6 sm:p-7 border-2 border-rich-berry/20 shadow-lg relative flex flex-col justify-between group hover:-translate-y-1.5 transition-transform"
            >
              <div>
                {/* Roman Numeral Emblem */}
                <div
                  className={`w-12 h-12 rounded-2xl ${act.badgeBg} ${act.badgeTextColor} flex items-center justify-center font-serif-headline font-bold text-xl mb-4 border ${act.badgeBorder}`}
                  aria-hidden="true"
                >
                  {act.roman}
                </div>

                <span className="font-bubbly text-xs uppercase text-rich-berry dark:text-star-gold font-bold">
                  {act.actTitle}
                </span>

                <h3 className="font-serif-headline text-2xl font-bold text-plum dark:text-cream mt-1 mb-3">
                  {act.sceneTitle}
                </h3>

                <p className="font-body text-warm-brown/85 dark:text-cream/80 text-sm leading-relaxed">
                  {act.story}
                </p>
              </div>

              {/* Bottom Italic Motto */}
              <div className="mt-6 pt-4 border-t border-rich-berry/10 font-serif-headline italic text-xs text-rich-berry dark:text-star-gold">
                {act.motto}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
