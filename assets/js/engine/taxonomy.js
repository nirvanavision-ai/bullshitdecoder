/**
 * taxonomy.js — the analytical knowledge base.
 *
 * Each entry is a *tactic class*: a named pattern of interpersonal influence
 * documented in the clinical, forensic, or rhetorical literature. Everything the
 * engine can say about a message ultimately comes from this file, which makes it
 * the single place to audit, extend, or localize the app's claims.
 *
 * Field contract
 * ---------------
 *   id         stable slug (used in URLs, exports, tests — do not rename casually)
 *   label      human name shown in the UI
 *   family     grouping used for the index bars: reality | blame | coercion |
 *              obligation | escalation | rhetoric
 *   severity   1 concerning · 2 serious · 3 critical (drives colour + weighting)
 *   lineage    where the construct comes from — shown to the user verbatim so the
 *              app never asserts authority it hasn't earned
 *   mechanism  what the tactic *does* to the listener, in plain language
 *   patterns   RegExp signatures. Written to match a clause, not a whole sentence,
 *              so highlights stay tight. Always global + case-insensitive.
 *   scripts    non-reactive ("gray rock") replies — flat, brief, unarguable
 *   note       optional caveat surfaced in the drawer to prevent over-reading
 *
 * Extending: append an object. No other file needs to change — the analyzer,
 * scoring, and UI all iterate this array.
 */

export const FAMILIES = {
  reality:    { label: "Reality distortion", blurb: "Pressure on your memory, perception, and judgement." },
  blame:      { label: "Blame transfer",     blurb: "Responsibility relocated from speaker to listener." },
  coercion:   { label: "Coercive pressure",  blurb: "Compliance extracted by attaching a cost to refusal." },
  obligation: { label: "Manufactured debt",  blurb: "Obligation created from past acts, then called in." },
  boundary:   { label: "Boundary & consent", blurb: "Your limits, property, body, or privacy treated as negotiable." },
  escalation: { label: "Emotional escalation", blurb: "Contempt, absolutes, and intensity used as leverage." },
  rhetoric:   { label: "Argument distortion", blurb: "Logical structure bent so the point can't be reached." },
};

export const TAXONOMY = [
  {
    id: "darvo",
    label: "DARVO",
    family: "blame",
    severity: 3,
    lineage: "Freyd (1997); Harsey & Freyd (2020) — Deny, Attack, Reverse Victim and Offender.",
    mechanism:
      "When confronted, the speaker denies the behaviour, attacks the credibility of the person raising it, " +
      "and re-casts themselves as the injured party. The conversation stops being about what happened and " +
      "becomes about your cruelty in mentioning it. Research finds exposure to DARVO increases the " +
      "confronter's self-blame.",
    patterns: [
      /you'?re (?:the one|actually the one|really the one)\b[^.!?\n]*/gi,
      /(?:how dare you|i can'?t believe you(?:'?d| would)?\s*(?:accuse|say|think))[^.!?\n]*/gi,
      /(?:i'?m the (?:real )?victim|you'?re attacking me|now i'?m the bad guy|so i'?m the villain)[^.!?\n]*/gi,
      /you'?re (?:the )?(?:abusive|toxic|controlling) one\b[^.!?\n]*/gi,
      /(?:this is|that'?s) why (?:i|nobody) (?:can'?t|don'?t) (?:talk to|trust) you\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I hear that you see it differently. The thing I raised still happened, and it still needs addressing.",
      "I'm not going to debate who the victim is. I'm telling you what I observed and what I need.",
      "We can talk about your feelings separately. Right now I'm talking about [the specific event].",
    ],
  },
  {
    id: "gaslighting",
    label: "Reality denial / gaslighting",
    family: "reality",
    severity: 3,
    lineage: "Sweet (2019), sociology of gaslighting; Stern (2007); Stark (2007) on 'crazy-making'.",
    mechanism:
      "Repeated assertion that documented events did not happen, or happened entirely differently, until you " +
      "outsource the question of what is real to the speaker. The damage isn't a single lie — it's the slow " +
      "transfer of epistemic authority away from your own memory.",
    patterns: [
      /that (?:never|literally never) happened\b[^.!?\n]*/gi,
      /you'?re (?:imagining|making (?:that|this|it) up|remembering (?:it|that) wrong|misremembering|inventing)[^.!?\n]*/gi,
      /(?:you'?re|you are|your) (?:being )?(?:crazy|insane|delusional|paranoid|unstable|unhinged|losing it)\b[^.!?\n]*/gi,
      /i never said (?:that|anything like that)\b[^.!?\n]*/gi,
      /(?:that'?s not what (?:i said|happened)|you (?:always )?twist (?:my words|everything))\b[^.!?\n]*/gi,
      /(?:you need help|you should see (?:a therapist|someone)|get help)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "My memory of it is clear, and I'm confident in it.",
      "We remember it differently. I'm going to trust my own record.",
      "I'm not willing to argue about whether it happened. It did.",
    ],
    note:
      "A single disagreement about facts is not gaslighting — people genuinely misremember. The pattern " +
      "matters: repetition over time, paired with attacks on your stability.",
  },
  {
    id: "blame-transfer",
    label: "Blame transfer",
    family: "blame",
    severity: 3,
    lineage: "Bancroft (2002) on entitlement and externalized responsibility.",
    mechanism:
      "The speaker's choices are re-described as involuntary reactions to you. Their actions become your " +
      "fault; the logical endpoint is a person who is never the author of anything they do.",
    patterns: [
      /(?:this is|it'?s|that'?s) (?:all |really )?your fault\b[^.!?\n]*/gi,
      /look what you (?:made me do|make me do)\b[^.!?\n]*/gi,
      /you (?:drove|pushed|forced) me to (?:this|it|do)\b[^.!?\n]*/gi,
      /if you (?:hadn'?t|didn'?t|weren'?t)[^.!?\n]{0,60}?(?:i wouldn'?t|i would never|none of this)[^.!?\n]*/gi,
      /you made me (?:do|say|feel|act)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "Your actions are your choices. Mine are mine.",
      "I'm responsible for what I did. I'm not responsible for what you did.",
      "We can discuss my part separately. It doesn't erase yours.",
    ],
  },
  {
    id: "threat",
    label: "Threat / intimidation",
    family: "coercion",
    severity: 3,
    lineage: "Stark (2007), coercive control; Duluth Model — 'Using Intimidation' and 'Using Coercion and Threats'.",
    mechanism:
      "Compliance is purchased with a stated cost for refusal: abandonment, exposure, escalation, financial " +
      "harm, or harm to people, pets, or property. Coercive control research treats credible threat as the " +
      "load-bearing structure of entrapment — the threat does not need to be carried out to work.",
    patterns: [
      /if you (?:leave|go|tell|call|report|don'?t)[^.!?\n]{0,70}?(?:i'?ll|i will|you'?ll (?:regret|be sorry|lose))[^.!?\n]*/gi,
      /you'?ll (?:regret|be sorry|never see|lose everything)\b[^.!?\n]*/gi,
      /i'?ll (?:make sure|see to it|tell everyone|ruin|destroy)\b[^.!?\n]*/gi,
      /(?:no one|nobody) (?:else )?(?:will|would) (?:ever )?(?:love|want|believe|put up with) you\b[^.!?\n]*/gi,
      /(?:you'?ll never|i'?ll take) (?:get|see|keep) the (?:kids|children|house|money)\b[^.!?\n]*/gi,
      /don'?t make me\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I've heard the threat. It doesn't change my decision.",
      "I won't negotiate under pressure. When it stops, we can talk.",
      "That statement is noted. I'm ending this conversation now.",
    ],
    note: "If any threat involves physical harm, weapons, or your children, please read the safety panel below.",
  },
  {
    id: "isolation",
    label: "Isolation pressure",
    family: "coercion",
    severity: 3,
    lineage: "Stark (2007); Duluth Model — 'Using Isolation'. A core, under-recognized control mechanism.",
    mechanism:
      "Contact with the people who could corroborate your account is restricted, discouraged, or poisoned. " +
      "Isolation is what makes every other tactic durable: with no outside reference points, the speaker " +
      "becomes the only available witness to reality.",
    patterns: [
      /(?:your|those) (?:friends?|family|mother|sister|brother)[^.!?\n]{0,40}?(?:toxic|bad for you|hate me|poison|turning you)[^.!?\n]*/gi,
      /(?:you (?:don'?t|shouldn'?t) need|why do you (?:even )?need) (?:them|anyone else|other (?:friends|people))\b[^.!?\n]*/gi,
      /(?:stop|quit) (?:talking to|seeing|texting)\b[^.!?\n]*/gi,
      /(?:it'?s|its) (?:just )?(?:me and you|us against)\b[^.!?\n]*/gi,
      /who (?:are you (?:talking|texting) to|were you with)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "My relationships aren't up for negotiation.",
      "I'm keeping the people in my life. That isn't a threat to us.",
      "I'll decide who I spend time with.",
    ],
  },
  {
    id: "monitoring",
    label: "Surveillance & rule-setting",
    family: "coercion",
    severity: 2,
    lineage: "Stark (2007) on micro-regulation of daily life; Duluth 'Using Male Privilege' / rule-making.",
    mechanism:
      "Ordinary autonomy is converted into something requiring permission, accounting, or proof. The content " +
      "of any single rule matters less than the accumulating principle that your day is subject to review.",
    patterns: [
      /(?:you (?:need|have) to (?:ask|check with|tell) me|ask me first)\b[^.!?\n]*/gi,
      /(?:send|show) me (?:a )?(?:proof|pic|screenshot|your location)\b[^.!?\n]*/gi,
      /(?:why (?:didn'?t|haven'?t) you (?:answer|reply|call))\b[^.!?\n]*/gi,
      /i (?:checked|saw|looked at) your (?:phone|messages|email|location)\b[^.!?\n]*/gi,
      /you'?re not (?:allowed|going) to\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I'm not going to account for my whereabouts.",
      "I'll share what I choose to share.",
      "Checking my phone isn't something I consent to.",
    ],
  },
  {
    id: "obligation",
    label: "Guilt leverage / manufactured debt",
    family: "obligation",
    severity: 2,
    lineage: "Braiker (2004) on emotional blackmail; Forward (1997), 'FOG' — fear, obligation, guilt.",
    mechanism:
      "Past favours, sacrifices, or suffering are converted into a ledger you are permanently behind on, and " +
      "payment is taken in compliance. Care is reframed as credit extended.",
    patterns: [
      /after (?:all|everything) (?:i'?ve|i have|i) (?:done|sacrificed|given|put up with)[^.!?\n]*/gi,
      /(?:i gave up|i sacrificed|i lost)[^.!?\n]{0,50}? for you\b[^.!?\n]*/gi,
      /you owe me\b[^.!?\n]*/gi,
      /if you (?:really |actually |truly )?(?:loved|cared about) me,? you'?d\b[^.!?\n]*/gi,
      /(?:a good|any (?:decent|real)) (?:partner|wife|husband|person|friend|mother|father) would\b[^.!?\n]*/gi,
      /after everything i'?ve been through\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I appreciate what you've done. It doesn't obligate me to agree to this.",
      "Care isn't a debt. I'm still saying no.",
      "I hear that you're disappointed. My answer stands.",
    ],
  },
  {
    id: "minimization",
    label: "Minimization",
    family: "reality",
    severity: 2,
    lineage: "Bancroft (2002); minimization/denial cluster in batterer-intervention literature.",
    mechanism:
      "The event stays exactly the same size; only your right to react to it is reduced. 'It was a joke' and " +
      "'you're too sensitive' relocate the problem from the act to your response to the act.",
    patterns: [
      /(?:it was|i was) (?:just|only) (?:a joke|joking|kidding|teasing|playing)\b[^.!?\n]*/gi,
      /you'?re (?:too|being|so) (?:sensitive|dramatic|emotional|defensive)\b[^.!?\n]*/gi,
      /(?:calm down|relax|chill out|settle down)\b[^.!?\n]*/gi,
      /you'?re (?:overreacting|blowing (?:this|it) (?:way )?out of proportion|making a big deal)\b[^.!?\n]*/gi,
      /it'?s not (?:that|a) big (?:of a )?deal\b[^.!?\n]*/gi,
      /(?:get over it|let it go|move on already)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "It mattered to me. I'm not debating the size of it.",
      "Jokes land as jokes. That didn't. I'm telling you how it landed.",
      "My reaction is proportionate to my experience of it.",
    ],
  },
  {
    id: "contempt",
    label: "Contempt & character attack",
    family: "escalation",
    severity: 2,
    lineage: "Gottman & Levenson (1992) — contempt is the single strongest predictor of relationship dissolution.",
    mechanism:
      "The disagreement is escalated from behaviour ('you did X') to identity ('you ARE X'). Character attacks " +
      "cannot be resolved by any change in behaviour, which is precisely what makes them useful for control.",
    patterns: [
      /you'?re (?:such )?(?:a |an )?(?:idiot|moron|stupid|pathetic|worthless|useless|disgusting|selfish|lazy)\b[^.!?\n]*/gi,
      /(?:what'?s wrong with you|grow up|act your age)\b[^.!?\n]*/gi,
      /you (?:always|never) [^.!?\n]{0,50}/gi,
      /(?:typical|classic) you\b[^.!?\n]*/gi,
      /(?:nobody|no one) else (?:has a problem with|would put up with)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I'm not going to continue a conversation with name-calling in it.",
      "Tell me the behaviour you want changed. I won't discuss my character.",
      "I'll come back to this when we can talk without insults.",
    ],
    note:
      "'Always/never' absolutes are flagged as escalation, not proof of intent — stressed people use them too. " +
      "Weight them by how often they appear.",
  },
  {
    id: "withdrawal",
    label: "Punitive withdrawal",
    family: "coercion",
    severity: 2,
    lineage: "Stonewalling in Gottman's 'Four Horsemen'; silent treatment as coercive discipline (Williams, 2001).",
    mechanism:
      "Connection itself becomes the currency: affection, communication, or basic acknowledgement is withdrawn " +
      "until you correct course. It teaches that disagreement costs the relationship.",
    patterns: [
      /(?:i'?m|im) done (?:talking|with this|with you)\b[^.!?\n]*/gi,
      /don'?t (?:bother|even) (?:talking|speaking|texting) (?:to )?me\b[^.!?\n]*/gi,
      /(?:fine|whatever)\.?\s*(?:do what you want|forget it|have it your way)\b[^.!?\n]*/gi,
      /(?:lose my number|we'?re done|forget i said anything)\b[^.!?\n]*/gi,
      /(?:i (?:guess|suppose) i'?ll just|maybe i should just) (?:leave|go|disappear)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I'm open to talking when you're ready to engage.",
      "Silence won't change my position, but I'm here when you want to discuss it.",
      "I'll take the space too. My point stands for when we resume.",
    ],
  },
  {
    id: "future-faking",
    label: "Future faking",
    family: "obligation",
    severity: 2,
    lineage: "Walker (1979), cycle-of-abuse 'reconciliation' phase; hoovering in coercive-control literature.",
    mechanism:
      "A vivid promise of change is issued to defuse the present consequence — with no mechanism, timeline, or " +
      "track record attached. The promise itself is the payment.",
    patterns: [
      /i (?:promise|swear)[^.!?\n]{0,40}?(?:i'?ll|i will|things will|it will|never again)[^.!?\n]*/gi,
      /(?:things|it) will be different (?:this time|now|from now on)\b[^.!?\n]*/gi,
      /i'?m (?:going to|gonna) change\b[^.!?\n]*/gi,
      /(?:just )?give me (?:one more|another) chance\b[^.!?\n]*/gi,
      /(?:this will )?never happen again\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I'll believe the change when I see it sustained, not when I hear it promised.",
      "What is the concrete plan, and what happens if it doesn't hold?",
      "Past promises are my data. I'm deciding on the data.",
    ],
  },
  {
    id: "triangulation",
    label: "Triangulation / manufactured consensus",
    family: "rhetoric",
    severity: 2,
    lineage: "Bowen family-systems theory; appeal to popularity (argumentum ad populum).",
    mechanism:
      "Absent third parties are recruited as a jury. 'Everyone thinks' converts an unverifiable claim into " +
      "social pressure and leaves you outnumbered inside your own conversation.",
    patterns: [
      /every(?:one|body) (?:thinks|says|agrees|knows|can see)\b[^.!?\n]*/gi,
      /even (?:your|my) (?:friends?|family|mom|mother|sister|brother|therapist) (?:thinks?|says?|agrees?)\b[^.!?\n]*/gi,
      /people are (?:talking|saying|noticing)\b[^.!?\n]*/gi,
      /(?:no one|nobody) else (?:thinks|has a problem)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I'm talking with you, not a committee. What do you say?",
      "If someone has a concern, they can raise it with me directly.",
      "Consensus isn't evidence. Let's stay on what actually happened.",
    ],
  },
  {
    id: "deflection",
    label: "Circular deflection / whataboutism",
    family: "rhetoric",
    severity: 1,
    lineage: "Tu quoque and red-herring fallacies; 'kitchen-sinking' in couples research.",
    mechanism:
      "The topic is never allowed to stabilize. Counter-accusations and ancient history rotate fast enough " +
      "that the original question dies of exhaustion rather than resolution.",
    patterns: [
      /(?:what about|whatabout) (?:you|the time|when you|that time)\b[^.!?\n]*/gi,
      /(?:this is|that'?s) just like (?:that time|when you)\b[^.!?\n]*/gi,
      /(?:oh )?so now (?:i'?m|you'?re|it'?s|suddenly)\b[^.!?\n]*/gi,
      /(?:you'?re one to talk|look who'?s talking|pot calling)\b[^.!?\n]*/gi,
      /why are we (?:even )?talking about this\b[^.!?\n]*/gi,
    ],
    scripts: [
      "That's a separate topic. I'll finish this one first.",
      "We can schedule that conversation. Today's question is still open.",
      "I notice we've changed subjects. Returning to my question: …",
    ],
  },
  {
    id: "conditional-love",
    label: "Conditional regard",
    family: "obligation",
    severity: 2,
    lineage: "Rogers (1959) on conditions of worth; Assor et al. (2004) on parental conditional regard.",
    mechanism:
      "Acceptance is made contingent and revocable — love arrives as a reward for compliance and is withdrawn " +
      "as a penalty. Over time this trains self-monitoring rather than self-knowledge.",
    patterns: [
      /i (?:could|would) love you (?:more |again )?if\b[^.!?\n]*/gi,
      /(?:i'?ll stay|we'?ll be fine|i'?ll forgive you) (?:if|as long as|once) you\b[^.!?\n]*/gi,
      /(?:you'?re lucky|be grateful) (?:i|that i)\b[^.!?\n]*/gi,
      /(?:this is )?your (?:last|final) chance\b[^.!?\n]*/gi,
    ],
    scripts: [
      "Love with conditions attached isn't something I can negotiate for.",
      "I'd rather know where I actually stand than earn my way back.",
      "I'm not going to perform to keep this.",
    ],
  },
  {
    id: "false-dilemma",
    label: "False dilemma",
    family: "rhetoric",
    severity: 1,
    lineage: "Classical informal fallacy; Walton (1992) on argumentation schemes.",
    mechanism:
      "A landscape of options is compressed into two, one of which is unacceptable. The narrowing is the " +
      "argument — it does the work before you get a chance to think.",
    patterns: [
      /(?:either|its either|it'?s either) [^.!?\n]{0,50}? or [^.!?\n]{0,50}/gi,
      /(?:if you'?re not|you'?re either) (?:with me|on my side)\b[^.!?\n]*/gi,
      /(?:you|we) (?:have|has) no (?:other )?choice\b[^.!?\n]*/gi,
      /(?:it'?s me or|choose:? me or)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "Those aren't the only two options. Here's a third.",
      "I'm not accepting the framing. Let me restate the problem.",
      "I need time to think rather than pick between two bad doors.",
    ],
  },

  /* ==========================================================================
     BOUNDARY & CONSENT
     Violations that arrive without heat — narrated as curiosity, affection, or
     practicality. These are the hardest to name in the moment precisely because
     nothing in the sentence sounds hostile.
     ========================================================================== */
  {
    id: "consent-bypass",
    label: "Boundary violation framed as innocence",
    family: "boundary",
    severity: 2,
    lineage: "Bancroft (2002) on entitlement; Herman (1992) on boundary erosion; Stark (2007) on micro-regulation.",
    mechanism:
      "A transgression is reported in the grammar of harmless curiosity: the act is stated plainly, the desire " +
      "behind it is offered as sufficient justification, and your consent is never mentioned — because it was " +
      "never treated as relevant. Nothing here sounds aggressive, which is exactly what makes it hard to name. " +
      "The tell is structural: an action taken on your property, body, space, or information, plus a reason " +
      "rooted entirely in the speaker's wants, minus any acknowledgement that permission was owed.",
    patterns: [
      /i (?:just |only )?(?:tried on|borrowed|took|used|wore|opened|moved|threw out|gave away) (?:your|his|her|their)\b[^.!?\n]*/gi,
      /i (?:just |only )?(?:read|went through|looked (?:at|through)|checked|searched) (?:your|his|her|their)\b[^.!?\n]*/gi,
      /because i wanted to\b[^.!?\n]*/gi,
      /i didn'?t think you'?d (?:mind|care|notice|be upset)\b[^.!?\n]*/gi,
      /i was (?:just |only )?curious\b[^.!?\n]*/gi,
      /i (?:didn'?t|did not) (?:think|realize) (?:it|that) (?:was|would be) a (?:big )?(?:deal|problem)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "Wanting to isn't the same as being allowed to. Ask me first next time.",
      "My things aren't available by default. That's the boundary, regardless of intent.",
      "I believe you didn't mean harm. I still need you to stop doing it.",
    ],
    note:
      "Intent and impact are separate questions. A person can genuinely mean no harm and still have crossed a " +
      "line — and 'I didn't mean anything by it' is an explanation, not permission granted after the fact.",
  },
  {
    id: "entitlement",
    label: "Entitlement claim",
    family: "boundary",
    severity: 2,
    lineage: "Bancroft (2002), 'Why Does He Do That?' — entitlement as the engine beneath abusive behaviour.",
    mechanism:
      "Ownership of your possessions, time, body, or attention is asserted as simply true. There is no request " +
      "because a request would imply you could decline.",
    patterns: [
      /what'?s yours is (?:mine|ours)\b[^.!?\n]*/gi,
      /i don'?t (?:need|have to ask for) (?:your )?permission\b[^.!?\n]*/gi,
      /i can do (?:what|whatever) i want\b[^.!?\n]*/gi,
      /you don'?t (?:get to|have the right to) (?:tell me|decide)\b[^.!?\n]*/gi,
      /(?:it'?s|its) not (?:really )?yours anyway\b[^.!?\n]*/gi,
      /i shouldn'?t have to ask\b[^.!?\n]*/gi,
    ],
    scripts: [
      "It is mine, and the answer is no.",
      "Asking isn't a formality — it's how I know this is consensual.",
      "I'm not negotiating ownership of my own things.",
    ],
  },
  {
    id: "sexual-coercion",
    label: "Sexual pressure",
    family: "boundary",
    severity: 3,
    lineage: "Basile (1999) on sexual coercion in intimate relationships; WHO intimate-partner violence typology.",
    mechanism:
      "Consent is treated as an obstacle to be worn down rather than a condition to be met — through obligation, " +
      "guilt, persistence, or the implication that refusal damages the relationship. Pressure that eventually " +
      "produces a yes has not produced consent.",
    patterns: [
      /if you (?:really )?loved me,? you'?d (?:have sex|sleep with me|do it|let me)\b[^.!?\n]*/gi,
      /you owe me (?:sex|this|that much)\b[^.!?\n]*/gi,
      /(?:it'?s|its) your (?:duty|job|responsibility) as (?:my|a) (?:wife|husband|girlfriend|boyfriend|partner)\b[^.!?\n]*/gi,
      /(?:i'?ll|i will) (?:get it|find it) (?:somewhere|from someone) else\b[^.!?\n]*/gi,
      /you (?:never|always) (?:say no|reject me)\b[^.!?\n]*/gi,
      /just this once,? (?:come on|please)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "No is a complete answer. It doesn't need a reason.",
      "Pressure doesn't turn a no into a yes.",
      "I'm not discussing this further tonight.",
    ],
  },
  {
    id: "reproductive-coercion",
    label: "Reproductive coercion",
    family: "boundary",
    severity: 3,
    lineage: "Miller et al. (2010); ACOG Committee Opinion 554 on reproductive and sexual coercion.",
    mechanism:
      "Control is exercised over contraception, pregnancy, or termination — sabotage, refusal, or threats tied to " +
      "reproductive decisions. Recognized in obstetric practice as a distinct and serious form of intimate-partner " +
      "violence, because it binds a person's body and future to another's will.",
    patterns: [
      /(?:i|we) (?:threw out|hid|stopped) (?:your|the) (?:pill|pills|birth control|iud)\b[^.!?\n]*/gi,
      /you'?re going to have (?:my|this) baby\b[^.!?\n]*/gi,
      /if you (?:get|have) an abortion\b[^.!?\n]*/gi,
      /i'?ll (?:leave|hurt) you if you don'?t (?:get pregnant|keep it)\b[^.!?\n]*/gi,
      /(?:stop|quit) taking (?:your|the) (?:pill|birth control)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "Decisions about my body are mine alone.",
      "This isn't a shared decision in the way you're describing it.",
      "I'm going to talk to a doctor about this privately.",
    ],
  },

  /* ==========================================================================
     ACCOUNTABILITY EVASION
     ========================================================================== */
  {
    id: "non-apology",
    label: "Non-apology",
    family: "blame",
    severity: 2,
    lineage: "Lazare (2004), 'On Apology'; Kampf (2009) on the linguistics of non-apologies.",
    mechanism:
      "The form of an apology is delivered without its content. 'I'm sorry you feel that way' apologizes for your " +
      "reaction; 'I'm sorry if' makes the harm hypothetical; 'I'm sorry, but' retracts itself mid-sentence. Each " +
      "closes the subject while conceding nothing — and leaves you looking unreasonable for not accepting it.",
    patterns: [
      /i'?m sorry (?:that )?you (?:feel|felt|think|took|got)\b[^.!?\n]*/gi,
      /i'?m sorry (?:if|but)\b[^.!?\n]*/gi,
      /i apologi[sz]e (?:if|but)\b[^.!?\n]*/gi,
      /sorry (?:you were|if you were|that you were) (?:offended|upset|hurt)\b[^.!?\n]*/gi,
      /i said i'?m sorry,? what (?:else|more) do you want\b[^.!?\n]*/gi,
    ],
    scripts: [
      "That's an apology for my reaction. I'm asking about the action.",
      "I'd rather hear what you'll do differently than hear sorry.",
      "I don't need an apology. I need it to stop.",
    ],
    note:
      "A real apology names the act, owns it without conditions, and says what changes. Anything shorter is worth " +
      "noticing — though tone matters, and some people simply apologize clumsily.",
  },
  {
    id: "moving-goalposts",
    label: "Moving goalposts",
    family: "rhetoric",
    severity: 2,
    lineage: "Informal fallacy of shifting the standard of proof; documented in coercive-control compliance cycles.",
    mechanism:
      "Each time you meet the stated condition, the condition changes. The point is not the standard — it is the " +
      "permanent state of being not-yet-enough, which keeps you working and keeps the speaker judging.",
    patterns: [
      /(?:that'?s|thats) (?:still )?not (?:good )?enough\b[^.!?\n]*/gi,
      /(?:now|and) i (?:also )?need you to\b[^.!?\n]*/gi,
      /i never said that was all\b[^.!?\n]*/gi,
      /(?:sure,? )?but you (?:still )?(?:didn'?t|haven'?t)\b[^.!?\n]*/gi,
      /that'?s the (?:bare )?minimum\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I met what you asked for. I'm not adding a new requirement to the same task.",
      "Let's agree on what 'done' means before I start.",
      "I notice the standard changed. I'm working to the original one.",
    ],
  },
  {
    id: "tone-policing",
    label: "Tone policing",
    family: "rhetoric",
    severity: 1,
    lineage: "Standard in discourse ethics; Sue (2010) on microaggression and the derailment of grievances.",
    mechanism:
      "The substance is set aside pending an unattainable standard of delivery. Because distress is a natural " +
      "response to the thing being raised, this reliably converts the complaint into evidence of unfitness to complain.",
    patterns: [
      /i'?ll talk to you when you'?re (?:calm|rational|reasonable|an adult)\b[^.!?\n]*/gi,
      /(?:watch|check) your tone\b[^.!?\n]*/gi,
      /you'?re being (?:hysterical|unhinged|irrational)\b[^.!?\n]*/gi,
      /no (?:need|reason) to (?:get|be) (?:upset|emotional|like that)\b[^.!?\n]*/gi,
      /if you could (?:just )?say it (?:nicely|without)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "My delivery isn't the topic. The thing I raised is.",
      "I can say it more calmly. The content won't change.",
      "I'd rather address the issue than my volume.",
    ],
  },
  {
    id: "mind-reading",
    label: "Assumed intent",
    family: "rhetoric",
    severity: 1,
    lineage: "Beck (1976) on mind-reading as a cognitive distortion; Gottman on negative sentiment override.",
    mechanism:
      "Your inner state is asserted rather than asked about, and usually assigned a motive worse than the one you " +
      "had. Since you cannot disprove a claim about your own mind, the accusation is unfalsifiable by design.",
    patterns: [
      /you did that on purpose\b[^.!?\n]*/gi,
      /(?:i know|we both know) (?:what|why) you (?:really )?(?:meant|wanted|did)\b[^.!?\n]*/gi,
      /don'?t (?:pretend|act like) you didn'?t\b[^.!?\n]*/gi,
      /you (?:only|just) (?:said|did) that to\b[^.!?\n]*/gi,
      /you'?re trying to make me (?:feel|look)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "That wasn't my intent. You can ask me what I meant.",
      "I'll tell you what I was thinking; I'd rather not have it assigned to me.",
      "We can discuss impact without deciding my motive.",
    ],
  },
  {
    id: "selective-memory",
    label: "Selective recall",
    family: "reality",
    severity: 1,
    lineage: "Adjacent to gaslighting (Sweet, 2019); distinguished by scope — episodic, not systematic.",
    mechanism:
      "Inconvenient specifics vanish while convenient ones stay vivid. Milder than full reality denial, but " +
      "cumulatively it teaches you that documentation is the only way to be believed.",
    patterns: [
      /i don'?t remember (?:that|saying|any of that|it that way)\b[^.!?\n]*/gi,
      /(?:that'?s|thats) not how i remember it\b[^.!?\n]*/gi,
      /(?:if|when) i said (?:that|it),? i didn'?t mean\b[^.!?\n]*/gi,
      /you must have (?:misheard|misunderstood)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I'm confident about what was said. I'll work from my own notes.",
      "Let's not relitigate the transcript. Here's what I need going forward.",
      "I'll put things in writing from now on so neither of us has to remember.",
    ],
    note: "People genuinely forget. Weight this by how often the forgetting favours the same person.",
  },

  /* ==========================================================================
     CONTROL OF RESOURCES, STATUS, AND STANDING
     ========================================================================== */
  {
    id: "financial-control",
    label: "Financial control",
    family: "coercion",
    severity: 3,
    lineage: "Adams et al. (2008), Scale of Economic Abuse; Stark (2007) on resource deprivation as control.",
    mechanism:
      "Access to money is converted into permission to exist independently. Economic abuse is among the strongest " +
      "predictors of whether someone can leave a relationship at all — which is precisely its function.",
    patterns: [
      /(?:it'?s|its) my money\b[^.!?\n]*/gi,
      /you don'?t (?:need|get) (?:your own )?(?:card|account|money|allowance)\b[^.!?\n]*/gi,
      /i pay for everything (?:around here|here)?\b[^.!?\n]*/gi,
      /you'?d have nothing without me\b[^.!?\n]*/gi,
      /i'?ll cut you off\b[^.!?\n]*/gi,
      /you don'?t need (?:a|that) job\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I need access to our finances. That isn't optional for me.",
      "I'm going to open an account in my own name.",
      "Money isn't a reward for agreement.",
    ],
  },
  {
    id: "status-threat",
    label: "Institutional threat",
    family: "coercion",
    severity: 3,
    lineage: "Documented in coercive-control literature as 'systems abuse' — legal, immigration, and employment leverage.",
    mechanism:
      "The threat is outsourced to an institution — police, immigration, employer, child services, courts — which " +
      "makes it feel both larger and deniable. Especially effective where the target's status is already precarious.",
    patterns: [
      /i'?ll (?:call|report you to) (?:ice|immigration|the irs|your boss|cps|child services|the police|the cops)\b[^.!?\n]*/gi,
      /you'?ll be deported\b[^.!?\n]*/gi,
      /i'?ll have you (?:fired|arrested|committed|evicted)\b[^.!?\n]*/gi,
      /i'?ll (?:take|get) (?:full )?custody\b[^.!?\n]*/gi,
      /(?:no|which) (?:judge|court) (?:will|would) believe you\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I'm noting that threat and I'm going to get advice about it.",
      "I won't make decisions under threat of a report.",
      "This conversation is over. I'll follow up in writing.",
    ],
    note: "If this appears, documenting it — dates, exact wording — matters. Consider speaking to an advocate or lawyer.",
  },
  {
    id: "smear-campaign",
    label: "Reputation leverage",
    family: "coercion",
    severity: 2,
    lineage: "Coercive-control literature on 'social abuse'; recruitment of third parties ('flying monkeys').",
    mechanism:
      "Your standing with other people is used as collateral. Pre-emptive framing of you to your own network means " +
      "any later account you give arrives sounding like a reaction rather than a report.",
    patterns: [
      /wait (?:until|till|til) (?:everyone|they|your family|he|she) (?:hears?|finds? out|knows?)\b[^.!?\n]*/gi,
      /i (?:already )?(?:told|talked to) (?:your|the) (?:family|boss|friends|mom|kids)\b[^.!?\n]*/gi,
      /i'?ll (?:tell|show) everyone what you (?:did|really)\b[^.!?\n]*/gi,
      /(?:everyone|they all) (?:know|knows) what you (?:did|are)\b[^.!?\n]*/gi,
      /i have (?:screenshots|receipts|proof) of\b[^.!?\n]*/gi,
    ],
    scripts: [
      "People can hear whatever version they like. I'll keep telling the truth.",
      "That's a threat about my reputation, and it doesn't change my answer.",
      "I'm going to talk to the people who matter to me directly.",
    ],
  },
  {
    id: "self-harm-leverage",
    label: "Self-harm as leverage",
    family: "coercion",
    severity: 3,
    lineage: "Recognized in coercive-control and crisis literature as suicide-threat coercion; requires a dual response.",
    mechanism:
      "Your compliance is tied to the speaker's survival, placing you in an impossible bind: leaving becomes " +
      "something you would have caused. The distress may be entirely genuine — and it still cannot be your " +
      "responsibility to manage by staying.",
    patterns: [
      /(?:maybe )?i should just (?:kill myself|end it|disappear|not be here)\b[^.!?\n]*/gi,
      /you'?d be better off without me\b[^.!?\n]*/gi,
      /if you leave,? i'?ll (?:kill myself|hurt myself|end it)\b[^.!?\n]*/gi,
      /i (?:have|have got) nothing (?:left )?to live for\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I take that seriously, which is why I'm calling a crisis line with you — not changing my decision.",
      "Your safety matters. It can't be my job to guarantee it by staying.",
      "I'm going to get someone qualified involved right now.",
    ],
    note:
      "Treat every such statement as potentially sincere: contact a crisis line. Taking it seriously and refusing " +
      "to be controlled by it are not in conflict.",
  },

  /* ==========================================================================
     ATTACHMENT MANIPULATION & LABOUR
     ========================================================================== */
  {
    id: "love-bombing",
    label: "Love bombing / idealization",
    family: "obligation",
    severity: 1,
    lineage: "Strutzenberg et al. (2017); idealization-devaluation cycle in the intimate-partner-violence literature.",
    mechanism:
      "Intensity is front-loaded far past the depth of the relationship — total certainty, instant future, " +
      "overwhelming attention. It builds a debt of devotion early that can be called in later, and makes any " +
      "future coldness feel like something you lost rather than something you were given.",
    patterns: [
      /i (?:can'?t|cannot) live without you\b[^.!?\n]*/gi,
      /you'?re my (?:everything|whole world|soulmate|other half)\b[^.!?\n]*/gi,
      /i knew (?:right away|immediately|the moment) you were the one\b[^.!?\n]*/gi,
      /no one (?:has ever|will ever) (?:love|understand) you like i do\b[^.!?\n]*/gi,
      /we'?re meant to be\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I'd like to move at a pace where we actually get to know each other.",
      "That's a lot of certainty this early. I'm still forming my view.",
      "I like you. I'm not ready for 'forever' language yet.",
    ],
    note:
      "Sincere early affection exists and is lovely. The signal is intensity that outruns knowledge — and how it's " +
      "invoked later.",
  },
  {
    id: "weaponized-incompetence",
    label: "Weaponized incompetence",
    family: "obligation",
    severity: 1,
    lineage: "Hochschild (1989), 'The Second Shift'; Daminger (2019) on the cognitive load of household labour.",
    mechanism:
      "Failure is performed until the task returns to you permanently. The result is that the labour, and the " +
      "management of the labour, both stay yours — while the refusal never has to be spoken aloud.",
    patterns: [
      /you'?re (?:just )?(?:so much )?better at (?:it|this|that) than me\b[^.!?\n]*/gi,
      /i (?:always|just) (?:mess|screw) (?:it|that) up\b[^.!?\n]*/gi,
      /you'?ll (?:just )?(?:redo|fix) it anyway\b[^.!?\n]*/gi,
      /i don'?t know how (?:you want it|to do it right)\b[^.!?\n]*/gi,
      /just (?:tell|remind) me what to do\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I'd like you to own this task end to end, including remembering it.",
      "Doing it imperfectly is fine. Not doing it isn't.",
      "I'm not going to manage this for you — it's yours now.",
    ],
  },
  {
    id: "infantilization",
    label: "Infantilization",
    family: "escalation",
    severity: 2,
    lineage: "Stark (2007) on the reduction of adult autonomy; documented in elder- and partner-abuse research.",
    mechanism:
      "You are addressed as someone not competent to run your own life — decisions pre-empted, capabilities " +
      "doubted aloud, autonomy framed as a risk. It manufactures the dependence it claims to have discovered.",
    patterns: [
      /you (?:can'?t|couldn'?t) (?:even )?(?:handle|manage|do) (?:that|this|it)(?: on your own| without me| by yourself)\b[^.!?\n]*/gi,
      /(?:let|leave it to) the adults\b[^.!?\n]*/gi,
      /you'?re (?:acting like|being) (?:a|such a) (?:child|baby|toddler)\b[^.!?\n]*/gi,
      /i'?ll (?:handle|decide) (?:it|that) (?:for you|since you can'?t)\b[^.!?\n]*/gi,
      /(?:good girl|good boy)\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I'm capable of deciding this myself.",
      "I'll ask if I want help. Please don't decide for me.",
      "Talk to me like an adult and we can continue.",
    ],
  },
  {
    id: "spiritual-leverage",
    label: "Moral or spiritual leverage",
    family: "obligation",
    severity: 2,
    lineage: "Oakley & Kinmond (2013) on spiritual abuse; Duluth model adaptations for faith communities.",
    mechanism:
      "A higher authority is invoked as the one issuing the instruction, so refusing the speaker becomes refusing " +
      "God, the family, or the culture. Disagreement is reframed as moral failure, which is far harder to hold a " +
      "boundary against than a mere demand.",
    patterns: [
      /god (?:wants|says|commands|expects) you to\b[^.!?\n]*/gi,
      /you'?re going to hell (?:if|for)\b[^.!?\n]*/gi,
      /(?:the )?bible says you (?:must|have to|should)\b[^.!?\n]*/gi,
      /(?:submit|be submissive) to (?:me|your husband)\b[^.!?\n]*/gi,
      /(?:a )?(?:real|good) (?:christian|muslim|jew|believer) would\b[^.!?\n]*/gi,
      /you'?re (?:shaming|dishonoring) (?:the|your) family\b[^.!?\n]*/gi,
    ],
    scripts: [
      "My faith is between me and God, not me and you.",
      "I'd like to talk to someone else in the community about this.",
      "Invoking that doesn't settle the question.",
    ],
  },
  {
    id: "score-keeping",
    label: "Score-keeping",
    family: "obligation",
    severity: 1,
    lineage: "Equity theory (Walster et al., 1978); Gottman on the 'ledger' pattern in distressed couples.",
    mechanism:
      "The relationship is run as an account with a running balance you are always overdrawn on. Every gift " +
      "retroactively becomes a loan, which quietly makes accepting anything expensive.",
    patterns: [
      /after all the times i\b[^.!?\n]*/gi,
      /i'?m always the one who\b[^.!?\n]*/gi,
      /(?:remember )?when i [^.!?\n]{0,40}? and you (?:didn'?t|never)\b[^.!?\n]*/gi,
      /i do everything (?:around here|for you|for this family)\b[^.!?\n]*/gi,
      /(?:when'?s|when is) the last time you\b[^.!?\n]*/gi,
    ],
    scripts: [
      "I don't want to keep a ledger. I want to talk about this week.",
      "If the balance feels off, let's rebalance going forward rather than back.",
      "I'm glad to do more. I'm not paying off a debt.",
    ],
  },
];

/**
 * Crisis-escalation signatures. Matching any of these surfaces the safety panel.
 *
 * Two categories are included, both grounded in danger-assessment research
 * (Campbell's Danger Assessment; Stark on separation violence):
 *   (a) explicit references to physical harm, weapons, or self-harm as leverage;
 *   (b) retaliation threats attached to leaving or telling — separation and
 *       disclosure are the documented peak-risk windows, so a threat conditioned
 *       on either is treated as safety-relevant rather than merely rhetorical.
 */
export const SAFETY_SIGNALS = [
  /\b(?:kill|hurt|beat|strangle|choke|stab|shoot|smash|break) (?:you|him|her|them|myself|the (?:kids|children|dog|cat))\b/gi,
  /\b(?:i(?:'?m| am)? ?(?:going to|gonna)|i'?ll|i will) [^.!?\n]{0,24}?\bmake (?:sure )?(?:you|him|her|them) (?:pay|regret|sorry|suffer)\b/gi,
  /\b(?:i(?:'?m| am)? ?(?:going to|gonna)|i'?ll|i will) end (?:it|you|this|myself)\b/gi,
  /\bif i can'?t have you\b/gi,
  /\b(?:gun|knife|weapon)\b[^.!?\n]{0,40}?\b(?:you|show|use|get)\b/gi,
  /\byou'?ll (?:be sorry|regret (?:it|this)|never (?:see|leave))\b/gi,
  // Separation/disclosure-conditioned retaliation. The consequence side is
  // constrained to harmful outcomes so benign conditionals ("if you go to the
  // party I'll stay home") do not trip the safety panel.
  /\bif you (?:ever )?(?:leave|walk out|tell (?:anyone|him|her|them)|call the (?:cops|police)|report me|go to the (?:cops|police))\b[^.!?\n]{0,70}?\b(?:i'?ll|i will|you'?ll)\s*(?:\w+\s+){0,3}?(?:regret|sorry|suffer|pay|destroy|ruin|end|hurt|kill|take the (?:kids|children)|never see|lose (?:everything|the kids))\b/gi,
  /\b(?:i(?:'?ll| will)) (?:hurt|kill) myself if you\b/gi,
];
