import type { Citation, Technology } from "./types";

const IM1 = (locator: string): Citation => ({
  sourceId: "film-iron-man-2008",
  locator,
});
const IM2 = (locator: string): Citation => ({
  sourceId: "film-iron-man-2-2010",
  locator,
});
const AVENGERS = (locator: string): Citation => ({
  sourceId: "film-the-avengers-2012",
  locator,
});
const IM3 = (locator: string): Citation => ({
  sourceId: "film-iron-man-3-2013",
  locator,
});
const AOU = (locator: string): Citation => ({
  sourceId: "film-avengers-age-of-ultron-2015",
  locator,
});
const IW = (locator: string): Citation => ({
  sourceId: "film-avengers-infinity-war-2018",
  locator,
});
const ENDGAME = (locator: string): Citation => ({
  sourceId: "film-avengers-endgame-2019",
  locator,
});
const MARVEL_BIO = (locator: string): Citation => ({
  sourceId: "marvel-iron-man-on-screen-bio",
  locator,
});

export const TECHNOLOGIES: Technology[] = [
  // ---------------------------------------------------------------------------
  {
    id: "arc-reactor",
    name: "Arc reactor",
    summary:
      "Stark Industries' power source: a full-size unit at the company's facility, miniaturized by Stark in captivity and carried in his chest until Iron Man 3.",
    facts: [
      {
        id: "arc-reactor-full-size-plant",
        text: "Stark Industries already operated a full-size arc reactor before Stark's captivity; Stark mentions the large one powering his factory.",
        basis: "dialogue",
        citations: [
          IM1("Cave workshop: \u201cI got a big one powering my factory at home.\u201d"),
        ],
      },
      {
        id: "arc-reactor-miniaturized",
        text: "Stark built a miniaturized arc reactor in the cave from palladium salvaged from Stark missiles; it powers the electromagnet holding shrapnel away from his heart and then the Mark I.",
        basis: "dialogue",
        citations: [
          IM1("Cave workshop: palladium salvage, reactor assembly, and the explanation to Yinsen."),
        ],
      },
      {
        id: "arc-reactor-three-gigajoules",
        text: "The only output figure given in the films is Stark's own: the cave-built reactor produces \u201cthree gigajoules per second,\u201d enough, per Yinsen, to run his heart for fifty lifetimes or, per Stark, \u201csomething big for fifteen minutes.\u201d",
        basis: "dialogue",
        citations: [
          IM1("Cave workshop: Stark\u2013Yinsen exchange about the reactor's output."),
        ],
      },
      {
        id: "arc-reactor-palladium-poisoning",
        text: "The palladium core was slowly poisoning Stark; he synthesized a new element from the Stark Expo plans left by Howard Stark and built a replacement core, which ended the poisoning. The film does not name the element.",
        basis: "on-screen",
        citations: [
          IM2("Blood-toxicity readings; the Expo model; synthesis of the new element; J.A.R.V.I.S.: \u201cYou have created a new element.\u201d"),
        ],
      },
      {
        id: "arc-reactor-stark-tower",
        text: "Stark Tower was powered by an arc reactor, which Loki's team used to run the Tesseract device that opened the wormhole over New York.",
        basis: "on-screen",
        citations: [
          AVENGERS("Stark Tower activation with Potts; Selvig's device on the tower roof."),
        ],
      },
      {
        id: "arc-reactor-removed",
        text: "Stark had the shrapnel surgically removed and discarded the chest reactor at the end of Iron Man 3.",
        basis: "on-screen",
        citations: [IM3("Epilogue: surgery and the reactor thrown into the sea.")],
      },
    ],
    connections: [
      {
        id: "arc-conn-flight",
        technologyId: "flight-stabilization",
        text: "The chest reactor is what runs the armor: after Stane removed Stark's reactor, Stark could not power the Mark III until he retrieved the original cave-built unit.",
        basis: "on-screen",
        citations: [IM1("Stane removes the reactor; Potts's framed original; Stark suits up on the old unit.")],
      },
      {
        id: "arc-conn-nano",
        technologyId: "nanotechnology",
        text: "From Infinity War the chest unit also stores the armor itself; Stark describes it only as a housing unit for nano-particles.",
        basis: "dialogue",
        citations: [IW("Central Park: \u201cIt's just a housing unit for nano-particles.\u201d")],
      },
    ],
    limitations: [
      {
        id: "arc-lim-runtime",
        text: "The cave-built unit's budget was measured in minutes: \u201csomething big for fifteen minutes.\u201d",
        basis: "dialogue",
        citations: [IM1("Cave workshop: Stark to Yinsen.")],
      },
      {
        id: "arc-lim-palladium",
        text: "The palladium core poisoned Stark over time, forcing the new-element replacement.",
        basis: "on-screen",
        citations: [IM2("Blood-toxicity readings; the new element.")],
      },
      {
        id: "arc-lim-removable",
        text: "Because it sat in Stark's chest, the reactor could be taken: Stane removed it and left Stark to die.",
        basis: "on-screen",
        citations: [IM1("Stane paralyses Stark and removes the reactor.")],
      },
    ],
    armorIds: ["mark-i", "mark-ii", "mark-iii", "mark-v", "mark-vi", "mark-vii"],
    knownUnknowns: [
      "Output of any reactor other than the cave-built unit.",
      "Composition of the new element introduced in Iron Man 2 (never named on-screen).",
      "Power source of the Hulkbuster, Mark L, and Mark LXXXV (not stated; the Mark L chest piece is described only as a housing unit for nano-particles).",
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: "repulsors",
    name: "Repulsors",
    summary:
      "Palm-mounted emitters first tested as flight stabilizers and then used as the armor's primary ranged weapon.",
    facts: [
      {
        id: "repulsors-flight-stabilizer-test",
        text: "Stark first tests a palm-mounted unit in his workshop and describes it to Pepper Potts as a flight stabilizer; the discharge throws him across the room.",
        basis: "dialogue",
        citations: [
          IM1("Workshop: \u201cIt's a flight stabilizer. It's completely harmless.\u201d"),
        ],
      },
      {
        id: "repulsors-as-weapon",
        text: "From the Gulmira raid onward the same palm emitters are used offensively.",
        basis: "on-screen",
        citations: [IM1("Gulmira sequence.")],
      },
      {
        id: "repulsors-name",
        text: "\"Repulsor\" is the name Marvel's official materials use for the system.",
        basis: "official-materials",
        citations: [MARVEL_BIO("Armor and abilities description.")],
      },
      {
        id: "repulsors-scaled-up",
        text: "The Mark L is shown forming larger energy projectors from its nanoparticle mass during the fight on Titan.",
        basis: "on-screen",
        citations: [IW("Titan: fight with Thanos.")],
      },
    ],
    connections: [
      {
        id: "repulsor-conn-flight",
        technologyId: "flight-stabilization",
        text: "The palm emitters were introduced as flight stabilizers; the workshop hover tests use the boots and palms together.",
        basis: "dialogue",
        citations: [IM1("Workshop: \u201cIt's a flight stabilizer\u201d; the hover tests.")],
      },
      {
        id: "repulsor-conn-nano",
        technologyId: "nanotechnology",
        text: "On the Mark L the same function is scaled up by reshaping nanoparticle mass into larger projectors.",
        basis: "on-screen",
        citations: [IW("Titan: fight with Thanos.")],
      },
    ],
    limitations: [
      {
        id: "repulsor-lim-recoil",
        text: "The first test threw Stark across his workshop; the second, demonstrated to Potts, did it again.",
        basis: "on-screen",
        citations: [IM1("Workshop: the two stabilizer tests.")],
      },
    ],
    armorIds: [
      "mark-ii",
      "mark-iii",
      "mark-v",
      "mark-vi",
      "mark-vii",
      "mark-xliv",
      "mark-l",
      "mark-lxxxv",
    ],
    knownUnknowns: [
      "Energy output, range, or rate of fire of any repulsor.",
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: "flight-stabilization",
    name: "Flight & stabilization",
    summary:
      "Boot thrusters plus hand-mounted stabilizers, refined after the Mark II's icing failure; no ceiling or speed figure is ever stated for an armor.",
    facts: [
      {
        id: "flight-mark-i-brief",
        text: "The Mark I managed only a short, uncontrolled rocket-assisted flight out of the cave before crashing in the desert.",
        basis: "on-screen",
        citations: [IM1("Escape sequence and desert crash.")],
      },
      {
        id: "flight-mark-ii-test",
        text: "The Mark II flight test used boot thrusters with hand stabilizers; J.A.R.V.I.S. reported the fixed-wing altitude record as 85,000 feet when Stark pushed the climb.",
        basis: "dialogue",
        citations: [
          IM1("First flight: \u201cThe altitude record for fixed-wing flight is 85,000 feet, sir.\u201d"),
        ],
      },
      {
        id: "flight-icing",
        text: "Ice build-up at altitude caused a power loss on the Mark II; the Mark III's gold-titanium alloy shell was the fix, and Stane's Iron Monger failed the same way because it lacked it.",
        basis: "dialogue",
        citations: [
          IM1("First flight icing; workshop alloy change; final battle: \u201cHow'd you solve the icing problem?\u201d"),
        ],
      },
      {
        id: "flight-mark-vii-space",
        text: "The Mark VII flew the nuclear missile through the wormhole and lost power outside the atmosphere.",
        basis: "on-screen",
        citations: [AVENGERS("Battle of New York climax.")],
      },
      {
        id: "flight-mark-l-booster",
        text: "The Mark L formed an additional back-mounted booster from its nanoparticles when Stark asked F.R.I.D.A.Y. for more power to catch the Q-ship.",
        basis: "on-screen",
        citations: [IW("New York: pursuit of the Q-ship.")],
      },
    ],
    connections: [
      {
        id: "flight-conn-repulsors",
        technologyId: "repulsors",
        text: "Hand-mounted stabilizers steer while the boots lift; they are the same emitters later used as weapons.",
        basis: "dialogue",
        citations: [IM1("Workshop: \u201cIt's a flight stabilizer\u201d; Gulmira.")],
      },
      {
        id: "flight-conn-ai",
        technologyId: "onboard-ai",
        text: "J.A.R.V.I.S. runs the pre-flight checks, calls the altitude record, and issues the icing warning.",
        basis: "dialogue",
        citations: [IM1("Workshop boot-up; first flight: altitude record and icing warning.")],
      },
      {
        id: "flight-conn-arc",
        technologyId: "arc-reactor",
        text: "No reactor, no flight: after Stane took Stark's reactor, the Mark III could not launch until Stark recovered the original unit.",
        basis: "on-screen",
        citations: [IM1("Stane removes the reactor; Stark suits up on the old unit.")],
      },
      {
        id: "flight-conn-hud",
        technologyId: "helmet-hud",
        text: "Altitude and icing calls reach the pilot through the helmet display during the climb.",
        basis: "dialogue",
        citations: [IM1("First flight: altitude record and icing warning.")],
      },
      {
        id: "flight-conn-nano",
        technologyId: "nanotechnology",
        text: "The Mark L grows an extra booster from its nanoparticles when Stark asks F.R.I.D.A.Y. for more power.",
        basis: "on-screen",
        citations: [IW("New York: pursuit of the Q-ship.")],
      },
    ],
    limitations: [
      {
        id: "flight-lim-icing",
        text: "Ice build-up at altitude caused a total power loss on the Mark II.",
        basis: "dialogue",
        citations: [IM1("First flight: J.A.R.V.I.S. warns of a potentially fatal build-up of ice.")],
      },
      {
        id: "flight-lim-space",
        text: "The Mark VII lost power beyond the wormhole.",
        basis: "on-screen",
        citations: [AVENGERS("Battle of New York climax.")],
      },
      {
        id: "flight-lim-mark-i",
        text: "The Mark I could only manage a short, uncontrolled flight that ended in a crash.",
        basis: "on-screen",
        citations: [IM1("Escape sequence and desert crash.")],
      },
    ],
    armorIds: [
      "mark-i",
      "mark-ii",
      "mark-iii",
      "mark-vi",
      "mark-vii",
      "mark-xliv",
      "mark-l",
      "mark-lxxxv",
    ],
    knownUnknowns: [
      "Maximum altitude of any armor (the 85,000 ft figure is an aircraft record J.A.R.V.I.S. cites, not a suit specification).",
      "Top speed or thrust of any armor.",
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: "helmet-hud",
    name: "Helmet & HUD",
    summary:
      "The helmet's heads-up display is the pilot's interface to the onboard AI; later helmets retract or assemble from nanoparticles.",
    facts: [
      {
        id: "hud-engage",
        text: "Stark orders the heads-up display engaged and his home-interface preferences imported during the Mark II's first boot-up.",
        basis: "dialogue",
        citations: [
          IM1("Workshop: \u201cEngage heads-up display.\u201d / \u201cImport all preferences from home interface.\u201d"),
        ],
      },
      {
        id: "hud-faceplate",
        text: "The Mark III's faceplate lifts independently of the helmet, shown after Gulmira and during the fight with Stane.",
        basis: "on-screen",
        citations: [IM1("Gulmira aftermath; final battle.")],
      },
      {
        id: "hud-nanotech-helmet",
        text: "The Mark L and Mark LXXXV helmets form and dissolve from nanoparticles rather than hinging open.",
        basis: "on-screen",
        citations: [
          IW("Greenwich Village suit-up and Titan scenes."),
          ENDGAME("Final battle."),
        ],
      },
      {
        id: "hud-recorded-message",
        text: "A Stark armor helmet plays back a holographic recording Stark left for his family at his memorial.",
        basis: "on-screen",
        citations: [ENDGAME("Memorial scene: holographic message.")],
      },
    ],
    connections: [
      {
        id: "hud-conn-ai",
        technologyId: "onboard-ai",
        text: "The HUD is where the AI lives for the pilot: Stark orders it engaged and J.A.R.V.I.S. confirms he has been uploaded.",
        basis: "dialogue",
        citations: [IM1("Workshop: \u201cEngage heads-up display\u201d; \u201cI have indeed been uploaded, sir.\u201d")],
      },
      {
        id: "hud-conn-flight",
        technologyId: "flight-stabilization",
        text: "Flight warnings reach the pilot through the helmet: the icing warning arrives mid-climb.",
        basis: "dialogue",
        citations: [IM1("First flight: icing warning.")],
      },
      {
        id: "hud-conn-nano",
        technologyId: "nanotechnology",
        text: "The Mark L and Mark LXXXV helmets form and dissolve from nanoparticles rather than hinging open.",
        basis: "on-screen",
        citations: [IW("Greenwich Village suit-up."), ENDGAME("Final battle.")],
      },
    ],
    limitations: [
      {
        id: "hud-lim-power",
        text: "The display dies with the suit's power: it goes dark during the Mark II icing failure and again beyond the wormhole.",
        basis: "on-screen",
        citations: [IM1("First flight: power loss."), AVENGERS("Beyond the wormhole.")],
      },
    ],
    armorIds: [
      "mark-ii",
      "mark-iii",
      "mark-vi",
      "mark-vii",
      "mark-xliv",
      "mark-l",
      "mark-lxxxv",
    ],
    knownUnknowns: [
      "Display resolution, field of view, or sensor suite of any helmet.",
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: "onboard-ai",
    name: "Onboard AI",
    summary:
      "J.A.R.V.I.S. runs the armors from the Mark II through Age of Ultron; F.R.I.D.A.Y. takes over from then until Endgame.",
    facts: [
      {
        id: "ai-jarvis-uploaded",
        text: "J.A.R.V.I.S., Stark's workshop AI, is uploaded into the Mark II and runs its diagnostics and flight checks.",
        basis: "dialogue",
        citations: [
          IM1("Workshop: \u201cI have indeed been uploaded, sir. We're online and ready.\u201d"),
        ],
      },
      {
        id: "ai-jarvis-to-vision",
        text: "J.A.R.V.I.S. was attacked by Ultron; what remained of him was later used in the creation of Vision.",
        basis: "on-screen",
        citations: [AOU("Ultron's emergence; the Vision's creation.")],
      },
      {
        id: "ai-friday-activated",
        text: "Stark activates F.R.I.D.A.Y. as his new assistant before the battle of Sokovia.",
        basis: "on-screen",
        citations: [AOU("Stark selects F.R.I.D.A.Y. from the AI backups.")],
      },
      {
        id: "ai-friday-through-endgame",
        text: "F.R.I.D.A.Y. is the armor's AI in Avengers: Infinity War and remains Stark's assistant through Avengers: Endgame.",
        basis: "dialogue",
        citations: [
          IW("New York: Stark addresses F.R.I.D.A.Y. during the Q-ship attack."),
          ENDGAME("Stark's lake house: F.R.I.D.A.Y. runs the time-travel model."),
        ],
      },
    ],
    connections: [
      {
        id: "ai-conn-hud",
        technologyId: "helmet-hud",
        text: "The AI's voice and readouts are delivered through the helmet display.",
        basis: "dialogue",
        citations: [IM1("Workshop boot-up of the Mark II.")],
      },
      {
        id: "ai-conn-flight",
        technologyId: "flight-stabilization",
        text: "J.A.R.V.I.S. handles diagnostics, the virtual walk-around, and control-surface checks before flight.",
        basis: "dialogue",
        citations: [IM1("Workshop: \u201cDo a check on control surfaces.\u201d")],
      },
      {
        id: "ai-conn-nano",
        technologyId: "nanotechnology",
        text: "F.R.I.D.A.Y. is the interface for the nanotech armors; Stark's request for more power is answered by the Mark L forming a booster.",
        basis: "on-screen",
        citations: [IW("New York: pursuit of the Q-ship.")],
      },
    ],
    limitations: [
      {
        id: "ai-lim-ultron",
        text: "J.A.R.V.I.S. could be attacked: Ultron tore him apart, and only a hidden remnant survived.",
        basis: "on-screen",
        citations: [AOU("Ultron's emergence; the remnant of J.A.R.V.I.S.")],
      },
      {
        id: "ai-lim-advisory",
        text: "The AI advises but does not decide: Stark overrode its warnings on the Mark II flight and the Mark VII deployment.",
        basis: "dialogue",
        citations: [IM1("\u201cSometimes you gotta run before you can walk.\u201d"), AVENGERS("\u201cSir, the Mark VII is not ready for deployment.\u201d")],
      },
    ],
    armorIds: [
      "mark-ii",
      "mark-iii",
      "mark-vi",
      "mark-vii",
      "mark-l",
      "mark-lxxxv",
    ],
    knownUnknowns: [
      "Any response-time or processing figure for either AI.",
      "Whether the Hulkbuster used J.A.R.V.I.S. or a separate control system (not specified on-screen).",
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: "nanotechnology",
    name: "Nanotechnology",
    summary:
      "From Infinity War, the armor is stored as nanoparticles in a chest-mounted housing and reshapes itself on demand.",
    facts: [
      {
        id: "nano-housing-unit",
        text: "Stark describes his chest piece as a housing unit for nano-particles; the Mark L forms over his body from it.",
        basis: "dialogue",
        citations: [
          IW("Central Park: \u201cIt's just a housing unit for nano-particles.\u201d"),
        ],
      },
      {
        id: "nano-reconfiguration",
        text: "The nanoparticle mass is reshaped into tools and weapons on demand and can be depleted: Thanos tore material away and used a fragment to stab Stark.",
        basis: "on-screen",
        citations: [IW("New York and Titan fights.")],
      },
      {
        id: "nano-stone-transfer",
        text: "The Mark LXXXV moved the Infinity Stones from Thanos's gauntlet into a gauntlet formed on Stark's own hand.",
        basis: "on-screen",
        citations: [ENDGAME("Final battle: the Stones transfer to Stark's hand.")],
      },
    ],
    connections: [
      {
        id: "nano-conn-arc",
        technologyId: "arc-reactor",
        text: "The particles are stored in the chest unit, in the place the reactor used to sit.",
        basis: "dialogue",
        citations: [IW("Central Park: \u201cIt's just a housing unit for nano-particles.\u201d")],
      },
      {
        id: "nano-conn-hud",
        technologyId: "helmet-hud",
        text: "The helmet is formed from the same particle mass.",
        basis: "on-screen",
        citations: [IW("Greenwich Village suit-up.")],
      },
      {
        id: "nano-conn-repulsors",
        technologyId: "repulsors",
        text: "Larger energy projectors are built on demand from the particle mass.",
        basis: "on-screen",
        citations: [IW("Titan: fight with Thanos.")],
      },
      {
        id: "nano-conn-flight",
        technologyId: "flight-stabilization",
        text: "Extra thrusters are formed in flight when needed.",
        basis: "on-screen",
        citations: [IW("New York: pursuit of the Q-ship.")],
      },
      {
        id: "nano-conn-ai",
        technologyId: "onboard-ai",
        text: "F.R.I.D.A.Y. remains the pilot's interface for the nanotech armors.",
        basis: "dialogue",
        citations: [IW("New York: Stark addresses F.R.I.D.A.Y. during the Q-ship attack.")],
      },
    ],
    limitations: [
      {
        id: "nano-lim-finite",
        text: "The reserve is finite: as Thanos tore material away, the Mark L could no longer fully rebuild itself.",
        basis: "on-screen",
        citations: [IW("Titan: the armor's plating visibly thins.")],
      },
      {
        id: "nano-lim-own-blade",
        text: "Broken-off material can be turned against the wearer; Thanos stabbed Stark with a fragment.",
        basis: "on-screen",
        citations: [IW("Titan: Stark is wounded with his own armor.")],
      },
    ],
    armorIds: ["mark-l", "mark-lxxxv"],
    knownUnknowns: [
      "Particle composition, quantity, or how the nanoparticles are powered.",
      "The storage capacity of the housing unit.",
    ],
  },
];
