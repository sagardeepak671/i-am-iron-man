import type { Armor, Citation, Specs } from "./types";

/* Citation helpers — keep locators specific enough to re-check. */
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

const UNKNOWN = { status: "unknown" } as const;

/** All-unknown baseline; override only what a film actually states. */
const unknownSpecs = (): Specs => ({
  powerSource: UNKNOWN,
  powerOutput: UNKNOWN,
  shellMaterial: UNKNOWN,
  flightCeiling: UNKNOWN,
  topSpeed: UNKNOWN,
  mass: UNKNOWN,
});

export const ARMORS: Armor[] = [
  // ---------------------------------------------------------------------------
  {
    id: "mark-i",
    designation: "Mark I",
    markNumber: 1,
    alias: null,
    designationBasis: "official-materials",
    summary:
      "The first armor, improvised from missile components by Tony Stark and Ho Yinsen while held captive in Afghanistan, and used to escape.",
    firstAppearanceFilmId: "iron-man-2008",
    appearanceFilmIds: ["iron-man-2008"],
    facts: [
      {
        id: "mark-i-built-in-captivity",
        text: "Built by Tony Stark with Ho Yinsen in a cave workshop while held captive by the Ten Rings, under the pretence of assembling a Jericho missile.",
        basis: "on-screen",
        citations: [IM1("Captivity sequence: cave workshop, construction of the armor.")],
      },
      {
        id: "mark-i-powered-by-mini-arc-reactor",
        text: "Powered by the miniaturized arc reactor Stark built in the cave, the same unit that keeps shrapnel away from his heart.",
        basis: "dialogue",
        citations: [
          IM1("Cave workshop: Stark explains the miniaturized arc reactor to Yinsen."),
        ],
      },
      {
        id: "mark-i-escape-and-crash",
        text: "Used to fight out of the cave with flame projectors and a brief rocket-assisted flight; the armor broke apart on landing in the desert and Stark walked away from the wreck.",
        basis: "on-screen",
        citations: [IM1("Escape sequence and desert crash.")],
      },
      {
        id: "mark-i-recovered-by-ten-rings",
        text: "The wreckage was collected by the Ten Rings and later studied by Obadiah Stane's engineers for the Iron Monger project.",
        basis: "on-screen",
        citations: [
          IM1("Ten Rings recover the pieces in the desert; Stane's lab scenes with the reassembled Mark I."),
        ],
      },
      {
        id: "mark-i-designation-source",
        text: "The designation \"Mark I\" is the name used in Marvel's official materials; it is not spoken in the film.",
        basis: "official-materials",
        citations: [MARVEL_BIO("Armor history section.")],
      },
    ],
    specs: {
      ...unknownSpecs(),
      powerSource: {
        status: "stated",
        value: "Miniaturized arc reactor (palladium core)",
        basis: "dialogue",
        citations: [
          IM1("Cave workshop: Stark identifies the device as a miniaturized arc reactor; palladium is salvaged from the missiles for its core."),
        ],
      },
      powerOutput: {
        status: "stated",
        value: "\u201cThree gigajoules per second\u201d \u2014 Stark's figure for the cave-built reactor, not a suit measurement",
        basis: "dialogue",
        citations: [
          IM1("Cave workshop: Stark to Yinsen, \u201cIf my math is right, and it always is, three gigajoules per second.\u201d"),
        ],
      },
    },
    design: {
      id: "mark-i-design",
      approach: "improvised",
      text: "Improvised in captivity from missile components and scrap, assembled by hand and booted from a cave terminal.",
      basis: "on-screen",
      citations: [IM1("Cave workshop construction; escape sequence boot-up.")],
    },
    capabilities: [
      {
        id: "mark-i-cap-flame-projectors",
        tags: ["flame-projectors"],
        text: "Arm-mounted flame projectors used to clear the Ten Rings fighters during the escape.",
        basis: "on-screen",
        citations: [IM1("Escape sequence: flame projectors in the cave corridors.")],
      },
      {
        id: "mark-i-cap-rocket-flight",
        tags: ["rocket-flight"],
        text: "Rocket-assisted flight of short duration, enough to clear the camp.",
        basis: "on-screen",
        citations: [IM1("Escape sequence: launch from the camp.")],
      },
      {
        id: "mark-i-cap-armour-protection",
        tags: ["armor-protection"],
        text: "Shrugged off small-arms fire from the guards.",
        basis: "on-screen",
        citations: [IM1("Escape sequence: guards fire on the armor at close range.")],
      },
    ],
    limitations: [
      {
        id: "mark-i-lim-reactor-runtime",
        tags: ["limited-runtime"],
        text: "Stark framed the reactor's budget in minutes: enough to run \u201csomething big for fifteen minutes.\u201d",
        basis: "dialogue",
        citations: [IM1("Cave workshop: Stark to Yinsen on the reactor's output.")],
      },
      {
        id: "mark-i-lim-crash",
        tags: ["crash"],
        text: "No controlled landing: the armor disintegrated on impact in the desert.",
        basis: "on-screen",
        citations: [IM1("Desert crash after the escape.")],
      },
      {
        id: "mark-i-lim-manual-boot",
        tags: ["slow-boot"],
        text: "Required a lengthy boot sequence that Yinsen had to buy time for, at the cost of his life.",
        basis: "on-screen",
        citations: [IM1("Escape sequence: progress bar on the cave terminal; Yinsen's diversion.")],
      },
    ],
    image: null,
    technologyIds: ["arc-reactor", "flight-stabilization"],
  },

  // ---------------------------------------------------------------------------
  {
    id: "mark-ii",
    designation: "Mark II",
    markNumber: 2,
    alias: null,
    designationBasis: "dialogue",
    summary:
      "Stark's first workshop-built armor: an unpainted flight prototype whose high-altitude test exposed an icing problem.",
    firstAppearanceFilmId: "iron-man-2008",
    appearanceFilmIds: ["iron-man-2008", "iron-man-2-2010"],
    facts: [
      {
        id: "mark-ii-project-file",
        text: "Stark opens a new project file with J.A.R.V.I.S. indexed as \"Mark II\" after returning to his Malibu workshop.",
        basis: "dialogue",
        citations: [
          IM1("Workshop: \u201cI'd like to open a new project file, index as Mark II.\u201d"),
        ],
      },
      {
        id: "mark-ii-flight-test",
        text: "First full flight test over Malibu, launched against J.A.R.V.I.S.'s advice that terabytes of calculations were still needed.",
        basis: "dialogue",
        citations: [
          IM1("Workshop and first flight: \u201cSometimes you gotta run before you can walk.\u201d"),
        ],
      },
      {
        id: "mark-ii-icing",
        text: "During a high-altitude climb the armor iced over and lost power; Stark recovered it in free fall.",
        basis: "on-screen",
        citations: [
          IM1("First flight: J.A.R.V.I.S. warns of a potentially fatal build-up of ice; the suit loses power and recovers."),
        ],
      },
      {
        id: "mark-ii-becomes-war-machine",
        text: "Taken by James Rhodes during Stark's birthday party and handed to the U.S. Air Force; it was subsequently fitted with Hammer Industries weapons and used by Rhodes.",
        basis: "on-screen",
        citations: [
          IM2("Birthday party fight; Rhodes delivers the armor to the Air Force; Hammer Industries refit."),
        ],
      },
    ],
    specs: unknownSpecs(),
    design: {
      id: "mark-ii-design",
      approach: "workshop-built",
      text: "Machined plate armor built in Stark's Malibu workshop and put on there; left unpainted as a flight prototype.",
      basis: "on-screen",
      citations: [IM1("Workshop: Mark II assembly and first fitting.")],
    },
    capabilities: [
      {
        id: "mark-ii-cap-stable-hover",
        tags: ["flight"],
        text: "Stable hover and controlled flight using boot thrusters and hand stabilizers, first at low power in the workshop and then over Malibu.",
        basis: "on-screen",
        citations: [IM1("Workshop hover tests; first flight over Malibu.")],
      },
      {
        id: "mark-ii-cap-hud-ai",
        tags: ["hud-ai"],
        text: "Full heads-up display with J.A.R.V.I.S. uploaded into the suit to run diagnostics and flight checks.",
        basis: "dialogue",
        citations: [IM1("Workshop: \u201cEngage heads-up display\u201d; J.A.R.V.I.S. confirms upload.")],
      },
    ],
    limitations: [
      {
        id: "mark-ii-lim-icing",
        tags: ["icing", "power-loss"],
        text: "Iced over at high altitude, causing a total power loss until the ice broke away during the fall.",
        basis: "dialogue",
        citations: [IM1("First flight: J.A.R.V.I.S. warns of a potentially fatal build-up of ice.")],
      },
      {
        id: "mark-ii-lim-untested",
        tags: ["untested"],
        text: "Flown before J.A.R.V.I.S. considered the calculations complete.",
        basis: "dialogue",
        citations: [IM1("Workshop: \u201cthere are still terabytes of calculations needed before an actual flight.\u201d")],
      },
      {
        id: "mark-ii-lim-unarmed",
        tags: ["unarmed"],
        text: "No weapons are shown on the Mark II; the armament seen later was added by Hammer Industries for Rhodes.",
        basis: "on-screen",
        citations: [IM1("Mark II scenes show no weapons."), IM2("Hammer Industries refit of the armor.")],
      },
    ],
    image: null,
    technologyIds: [
      "arc-reactor",
      "repulsors",
      "flight-stabilization",
      "helmet-hud",
      "onboard-ai",
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: "mark-iii",
    designation: "Mark III",
    markNumber: 3,
    alias: null,
    designationBasis: "official-materials",
    summary:
      "The first red-and-gold armor, built to fix the Mark II's icing problem; used at Gulmira and against the Iron Monger.",
    firstAppearanceFilmId: "iron-man-2008",
    appearanceFilmIds: ["iron-man-2008"],
    facts: [
      {
        id: "mark-iii-alloy",
        text: "Shell metals reconfigured to a gold-titanium alloy to solve the icing problem found on the Mark II.",
        basis: "dialogue",
        citations: [
          IM1("Workshop after the first flight: Stark instructs J.A.R.V.I.S. to use the gold-titanium alloy and to add \u201ca little hot rod red.\u201d"),
        ],
      },
      {
        id: "mark-iii-gulmira",
        text: "Deployed to Gulmira, where it destroyed Ten Rings weapon stockpiles using repulsors, shoulder-mounted anti-personnel guns, a forearm missile, and flares against pursuing aircraft.",
        basis: "on-screen",
        citations: [IM1("Gulmira sequence and the pursuit by two F-22s.")],
      },
      {
        id: "mark-iii-iron-monger",
        text: "Fought Obadiah Stane's Iron Monger while running on the original cave-built reactor; the Iron Monger iced up at altitude because Stane had not solved the icing problem.",
        basis: "dialogue",
        citations: [
          IM1("Final battle: \u201cHow'd you solve the icing problem?\u201d"),
        ],
      },
      {
        id: "mark-iii-designation-source",
        text: "The designation \"Mark III\" is the name used in Marvel's official materials; it is not spoken in the film.",
        basis: "official-materials",
        citations: [MARVEL_BIO("Armor history section.")],
      },
    ],
    specs: {
      ...unknownSpecs(),
      shellMaterial: {
        status: "stated",
        value: "Gold-titanium alloy",
        basis: "dialogue",
        citations: [
          IM1("Workshop: \u201cUse the gold-titanium alloy from the Seraphim tactical satellite.\u201d"),
        ],
      },
    },
    design: {
      id: "mark-iii-design",
      approach: "workshop-built",
      text: "Workshop-built plate armor fitted by the workshop's robotic rig; the shell alloy and paint were changed from the Mark II.",
      basis: "on-screen",
      citations: [IM1("Workshop: the Mark III fitting rig before Gulmira.")],
    },
    capabilities: [
      {
        id: "mark-iii-cap-weapons",
        tags: ["ranged-weapons"],
        text: "Repulsor blasts, shoulder-mounted anti-personnel guns that select targets individually, and a forearm-launched missile that destroyed a tank.",
        basis: "on-screen",
        citations: [IM1("Gulmira: hostages freed with the shoulder guns; the tank.")],
      },
      {
        id: "mark-iii-cap-flares",
        tags: ["countermeasures"],
        text: "Flares deployed as countermeasures against an air-to-air missile.",
        basis: "on-screen",
        citations: [IM1("F-22 pursuit after Gulmira.")],
      },
      {
        id: "mark-iii-cap-high-altitude",
        tags: ["flight", "high-altitude"],
        text: "Able to climb past the altitude where the Iron Monger iced up and failed.",
        basis: "on-screen",
        citations: [IM1("Final battle: climb above the city.")],
      },
    ],
    limitations: [
      {
        id: "mark-iii-lim-old-reactor",
        tags: ["reactor-dependency", "power-loss"],
        text: "Fought the Iron Monger on the original cave-built reactor after Stane took the newer one, with J.A.R.V.I.S. reporting falling power.",
        basis: "dialogue",
        citations: [IM1("Stane removes Stark's reactor; final battle power warnings.")],
      },
      {
        id: "mark-iii-lim-f22-damage",
        tags: ["combat-damage"],
        text: "Treated as an unidentified hostile by the U.S. Air Force; the pursuit ended in a collision that tore the wing off an F-22 and forced Stark to free the ejected pilot's jammed parachute.",
        basis: "on-screen",
        citations: [IM1("F-22 pursuit after Gulmira.")],
      },
    ],
    image: null,
    technologyIds: [
      "arc-reactor",
      "repulsors",
      "flight-stabilization",
      "helmet-hud",
      "onboard-ai",
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: "mark-v",
    designation: "Mark V",
    markNumber: 5,
    alias: null,
    designationBasis: "official-materials",
    summary:
      "A compact armor carried in a suitcase and put on in the open at the Monaco circuit to stop Ivan Vanko.",
    firstAppearanceFilmId: "iron-man-2-2010",
    appearanceFilmIds: ["iron-man-2-2010"],
    facts: [
      {
        id: "mark-v-suitcase-deployment",
        text: "Carried in a suitcase by Happy Hogan and put on by Stark at the Monaco Historic Grand Prix after Ivan Vanko attacked the race.",
        basis: "on-screen",
        citations: [IM2("Monaco sequence: suitcase deployment.")],
      },
      {
        id: "mark-v-vs-vanko",
        text: "Withstood Vanko's energized whips and disabled him by tearing the reactor from his harness.",
        basis: "on-screen",
        citations: [IM2("Monaco sequence: fight with Vanko.")],
      },
      {
        id: "mark-v-designation-source",
        text: "The designation \"Mark V\" is the name used in Marvel's official materials; it is not spoken in the film.",
        basis: "official-materials",
        citations: [MARVEL_BIO("Armor history section.")],
      },
    ],
    specs: unknownSpecs(),
    design: {
      id: "mark-v-design",
      approach: "portable",
      text: "Folds into a carried case and is put on in the open in seconds.",
      basis: "on-screen",
      citations: [IM2("Monaco: suitcase deployment.")],
    },
    capabilities: [
      {
        id: "mark-v-cap-portable",
        tags: ["portable"],
        text: "Compact enough to be carried as a suitcase and donned in seconds on the racetrack.",
        basis: "on-screen",
        citations: [IM2("Monaco: suitcase deployment.")],
      },
      {
        id: "mark-v-cap-repulsors",
        tags: ["ranged-weapons"],
        text: "Repulsor blasts used against Vanko.",
        basis: "on-screen",
        citations: [IM2("Monaco: fight with Vanko.")],
      },
    ],
    limitations: [
      {
        id: "mark-v-lim-whips",
        tags: ["combat-damage"],
        text: "Vanko's energized whips cut into the armor's plating.",
        basis: "on-screen",
        citations: [IM2("Monaco: the whips score the armor.")],
      },
      {
        id: "mark-v-lim-no-flight",
        tags: ["no-flight"],
        text: "No flight is shown; Stark fought on foot for the whole engagement.",
        basis: "on-screen",
        citations: [IM2("Monaco sequence.")],
      },
    ],
    image: null,
    technologyIds: ["arc-reactor", "repulsors"],
  },

  // ---------------------------------------------------------------------------
  {
    id: "mark-vi",
    designation: "Mark VI",
    markNumber: 6,
    alias: null,
    designationBasis: "official-materials",
    summary:
      "The armor built around Stark's new-element reactor, used against the Hammer drones and Vanko and carried over into the early scenes of The Avengers.",
    firstAppearanceFilmId: "iron-man-2-2010",
    appearanceFilmIds: ["iron-man-2-2010", "the-avengers-2012"],
    facts: [
      {
        id: "mark-vi-new-element-reactor",
        text: "Fitted with the reactor built around the new element Stark synthesized from Howard Stark's Expo plans, ending the palladium poisoning.",
        basis: "on-screen",
        citations: [
          IM2("Synthesis of the new element and the new chest reactor; Stark Expo battle."),
        ],
      },
      {
        id: "mark-vi-expo-lasers",
        text: "Used single-use wrist lasers against the Hammer drones at the Stark Expo, which Stark described to Rhodes as a one-off.",
        basis: "dialogue",
        citations: [
          IM2("Stark Expo battle: Rhodes asks why Stark did not lead with the lasers; Stark replies they are a one-off."),
        ],
      },
      {
        id: "mark-vi-avengers",
        text: "Worn at Stark Tower, in Stuttgart, and on the Helicarrier until it was replaced by the Mark VII.",
        basis: "on-screen",
        citations: [
          AVENGERS("Stark Tower reactor scene, Stuttgart, the forest fight with Thor, and Helicarrier scenes."),
        ],
      },
      {
        id: "mark-vi-designation-source",
        text: "The designation \"Mark VI\" is the name used in Marvel's official materials; it is not spoken in the film.",
        basis: "official-materials",
        citations: [MARVEL_BIO("Armor history section.")],
      },
    ],
    specs: {
      ...unknownSpecs(),
      powerSource: {
        status: "stated",
        value: "Arc reactor with a new-element core (the element is not named in the film)",
        basis: "on-screen",
        citations: [
          IM2("J.A.R.V.I.S.: \u201cCongratulations, sir. You have created a new element.\u201d"),
        ],
      },
    },
    design: {
      id: "mark-vi-design",
      approach: "workshop-built",
      text: "Workshop-built plate armor around the new-element reactor; put on and removed by the workshop and Stark Tower rigs.",
      basis: "on-screen",
      citations: [IM2("Workshop after the new element."), AVENGERS("Stark Tower landing platform disassembly.")],
    },
    capabilities: [
      {
        id: "mark-vi-cap-lasers",
        tags: ["ranged-weapons"],
        text: "Wrist-mounted lasers that cut through a line of Hammer drones in one sweep.",
        basis: "on-screen",
        citations: [IM2("Stark Expo battle: laser sweep.")],
      },
      {
        id: "mark-vi-cap-sustained-flight",
        tags: ["flight"],
        text: "Sustained high-speed flight while leading the drones away from the Expo crowds, and later from Stuttgart back to the Quinjet.",
        basis: "on-screen",
        citations: [IM2("Stark Expo battle."), AVENGERS("Stuttgart and the forest fight.")],
      },
      {
        id: "mark-vi-cap-lightning",
        tags: ["energy-absorption"],
        text: "Absorbed a lightning strike from Thor, which J.A.R.V.I.S. reported as taking power to 400% capacity.",
        basis: "dialogue",
        citations: [AVENGERS("Forest fight: \u201cPower at 400% capacity.\u201d")],
      },
      {
        id: "mark-vi-cap-submersible",
        tags: ["underwater-operation"],
        text: "Operated underwater to install the Stark Tower reactor line.",
        basis: "on-screen",
        citations: [AVENGERS("Opening Stark Tower scene: Stark underwater.")],
      },
    ],
    limitations: [
      {
        id: "mark-vi-lim-one-off-lasers",
        tags: ["single-use"],
        text: "The lasers were single-use; Stark told Rhodes they were a one-off.",
        basis: "dialogue",
        citations: [IM2("Stark Expo battle: Rhodes asks why Stark did not lead with them.")],
      },
      {
        id: "mark-vi-lim-helicarrier-rotor",
        tags: ["combat-damage"],
        text: "Took heavy damage inside the Helicarrier's rotor while restarting the engine by hand.",
        basis: "on-screen",
        citations: [AVENGERS("Helicarrier attack: Stark inside the rotor housing.")],
      },
    ],
    image: null,
    technologyIds: [
      "arc-reactor",
      "repulsors",
      "flight-stabilization",
      "helmet-hud",
      "onboard-ai",
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: "mark-vii",
    designation: "Mark VII",
    markNumber: 7,
    alias: null,
    designationBasis: "dialogue",
    summary:
      "The remotely deployed armor that assembled around Stark mid-fall from Stark Tower and fought in the Battle of New York.",
    firstAppearanceFilmId: "the-avengers-2012",
    appearanceFilmIds: ["the-avengers-2012"],
    facts: [
      {
        id: "mark-vii-not-ready",
        text: "J.A.R.V.I.S. warned that the Mark VII was not ready for deployment; Stark ordered it deployed anyway.",
        basis: "dialogue",
        citations: [
          AVENGERS("Stark Tower: \u201cSir, the Mark VII is not ready for deployment.\u201d"),
        ],
      },
      {
        id: "mark-vii-pod-deployment",
        text: "Launched as a pod that homed on bracelets Stark was wearing and assembled around him in free fall after Loki threw him from the tower.",
        basis: "on-screen",
        citations: [AVENGERS("Stark Tower: Loki throws Stark out; the Mark VII assembles mid-fall.")],
      },
      {
        id: "mark-vii-nuke",
        text: "Carried the nuclear missile fired at Manhattan through the wormhole; the armor lost power in space and fell back through the closing portal.",
        basis: "on-screen",
        citations: [AVENGERS("Battle of New York climax.")],
      },
    ],
    specs: unknownSpecs(),
    design: {
      id: "mark-vii-design",
      approach: "remote-deployed",
      text: "Plate armor launched as a pod that homes on bracelets and assembles around Stark wherever he is.",
      basis: "on-screen",
      citations: [AVENGERS("Stark Tower: mid-air assembly.")],
    },
    capabilities: [
      {
        id: "mark-vii-cap-remote-deploy",
        tags: ["remote-deployment"],
        text: "Remote deployment as a pod that locks onto Stark's bracelets and assembles around him mid-fall.",
        basis: "on-screen",
        citations: [AVENGERS("Stark Tower: mid-air assembly.")],
      },
      {
        id: "mark-vii-cap-heavy-lift",
        tags: ["heavy-lift", "flight"],
        text: "Carried a nuclear missile from Manhattan through the wormhole.",
        basis: "on-screen",
        citations: [AVENGERS("Battle of New York climax.")],
      },
      {
        id: "mark-vii-cap-leviathan",
        tags: ["ranged-weapons"],
        text: "Brought down a Chitauri Leviathan by flying into its mouth and firing from within.",
        basis: "on-screen",
        citations: [AVENGERS("Battle of New York: the first Leviathan.")],
      },
    ],
    limitations: [
      {
        id: "mark-vii-lim-not-ready",
        tags: ["untested"],
        text: "Deployed before it was ready, by J.A.R.V.I.S.'s own assessment.",
        basis: "dialogue",
        citations: [AVENGERS("\u201cSir, the Mark VII is not ready for deployment.\u201d")],
      },
      {
        id: "mark-vii-lim-space",
        tags: ["power-loss"],
        text: "Lost power and communications once through the wormhole; Stark fell back through the portal unconscious.",
        basis: "on-screen",
        citations: [AVENGERS("Beyond the wormhole; the Hulk's catch and the wake-up.")],
      },
    ],
    image: null,
    technologyIds: [
      "arc-reactor",
      "repulsors",
      "flight-stabilization",
      "helmet-hud",
      "onboard-ai",
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: "mark-xliv",
    designation: "Mark XLIV",
    markNumber: 44,
    alias: "Hulkbuster",
    designationBasis: "official-materials",
    summary:
      "An oversized modular armor, delivered from orbit by the \"Veronica\" system and worn over Stark's regular suit to contain the Hulk in Johannesburg.",
    firstAppearanceFilmId: "avengers-age-of-ultron-2015",
    appearanceFilmIds: ["avengers-age-of-ultron-2015"],
    facts: [
      {
        id: "mark-xliv-veronica",
        text: "Delivered from an orbital platform Stark refers to as \"Veronica\" when the Hulk rampaged through Johannesburg.",
        basis: "dialogue",
        citations: [AOU("Johannesburg: Stark calls for Veronica; the Hulkbuster drops from orbit.")],
      },
      {
        id: "mark-xliv-worn-over-armor",
        text: "Worn over Stark's standard armor rather than replacing it.",
        basis: "on-screen",
        citations: [AOU("Johannesburg: Stark enters the Hulkbuster while already suited.")],
      },
      {
        id: "mark-xliv-modular-repair",
        text: "Modular: a damaged arm was replaced mid-fight with a spare component dropped from the platform.",
        basis: "on-screen",
        citations: [AOU("Johannesburg: replacement arm module.")],
      },
      {
        id: "mark-xliv-repeated-strike",
        text: "Used a rapid repeated-strike arm to pin the Hulk while Stark repeated \"go to sleep.\"",
        basis: "dialogue",
        citations: [AOU("Johannesburg: \u201cGo to sleep, go to sleep, go to sleep!\u201d")],
      },
      {
        id: "mark-xliv-designation-source",
        text: "The designation \"Mark XLIV\" is the name used in Marvel's official materials; in the film the armor is referred to as the Hulkbuster. A later Hulkbuster-type armor piloted by Bruce Banner in Avengers: Infinity War is a separate suit and is not catalogued here.",
        basis: "official-materials",
        citations: [MARVEL_BIO("Armor history section.")],
      },
    ],
    specs: unknownSpecs(),
    design: {
      id: "mark-xliv-design",
      approach: "modular-exosuit",
      text: "Oversized modular exo-armor dropped from orbit and worn over Stark's regular suit.",
      basis: "on-screen",
      citations: [AOU("Johannesburg: orbital delivery; Stark enters while suited.")],
    },
    capabilities: [
      {
        id: "mark-xliv-cap-contain-hulk",
        tags: ["strength"],
        text: "Strong enough to grapple with, restrain, and finally subdue the Hulk.",
        basis: "on-screen",
        citations: [AOU("Johannesburg fight.")],
      },
      {
        id: "mark-xliv-cap-modules",
        tags: ["modular-repair"],
        text: "Field-replaceable modules delivered from the Veronica platform mid-fight.",
        basis: "on-screen",
        citations: [AOU("Johannesburg: replacement arm module.")],
      },
      {
        id: "mark-xliv-cap-repeated-strike",
        tags: ["melee"],
        text: "A rapid-repeat striking arm used to pin the Hulk.",
        basis: "dialogue",
        citations: [AOU("\u201cGo to sleep, go to sleep, go to sleep!\u201d")],
      },
    ],
    limitations: [
      {
        id: "mark-xliv-lim-arm-torn",
        tags: ["combat-damage"],
        text: "The Hulk tore off an arm module, which had to be replaced before the fight could continue.",
        basis: "on-screen",
        citations: [AOU("Johannesburg: arm torn off and replaced.")],
      },
      {
        id: "mark-xliv-lim-needs-veronica",
        tags: ["deployment-dependency"],
        text: "Not carried on Stark's person; it depends on an orbital drop from the Veronica platform.",
        basis: "on-screen",
        citations: [AOU("Johannesburg: orbital delivery.")],
      },
    ],
    image: null,
    technologyIds: ["repulsors", "flight-stabilization", "helmet-hud"],
  },

  // ---------------------------------------------------------------------------
  {
    id: "mark-l",
    designation: "Mark L",
    markNumber: 50,
    alias: null,
    designationBasis: "official-materials",
    summary:
      "Stark's first nanotechnology armor, stored in a chest-mounted housing unit and worn from New York to Titan in the fight against Thanos.",
    firstAppearanceFilmId: "avengers-infinity-war-2018",
    appearanceFilmIds: ["avengers-infinity-war-2018"],
    facts: [
      {
        id: "mark-l-housing-unit",
        text: "Stored in a chest-mounted unit that Stark describes to Pepper Potts as a housing unit for nano-particles; the armor forms over his body from it.",
        basis: "dialogue",
        citations: [
          IW("Central Park: Stark tells Potts the chest piece is \u201cjust a housing unit for nano-particles\u201d; the suit forms in Greenwich Village."),
        ],
      },
      {
        id: "mark-l-reconfigurable",
        text: "Reshaped its nanoparticle mass on demand into blades, shields, additional thrusters, and larger energy projectors during the fights in New York and on Titan.",
        basis: "on-screen",
        citations: [IW("New York fight with Ebony Maw and Cull Obsidian; Titan fight with Thanos.")],
      },
      {
        id: "mark-l-thanos-blade",
        text: "Thanos broke off part of the armor's material and stabbed Stark with it on Titan.",
        basis: "on-screen",
        citations: [IW("Titan: Thanos wounds Stark with a fragment of his own armor.")],
      },
      {
        id: "mark-l-designation-source",
        text: "The designation \"Mark L\" is the name used in Marvel's official materials; it is not spoken in the film.",
        basis: "official-materials",
        citations: [MARVEL_BIO("Armor history section.")],
      },
    ],
    specs: unknownSpecs(),
    design: {
      id: "mark-l-design",
      approach: "nanotech",
      text: "Nanoparticles stored in a chest housing that form the armor over Stark's body on demand.",
      basis: "dialogue",
      citations: [IW("Central Park: \u201chousing unit for nano-particles\u201d; Greenwich Village suit-up.")],
    },
    capabilities: [
      {
        id: "mark-l-cap-instant-deploy",
        tags: ["instant-deployment"],
        text: "Forms over Stark's body from the chest housing in seconds, with no external pod or case.",
        basis: "on-screen",
        citations: [IW("Greenwich Village suit-up.")],
      },
      {
        id: "mark-l-cap-reconfigure",
        tags: ["reconfiguration", "ranged-weapons"],
        text: "Reshapes on demand into blades, shields, extra thrusters, and larger energy projectors.",
        basis: "on-screen",
        citations: [IW("New York and Titan fights.")],
      },
      {
        id: "mark-l-cap-space",
        tags: ["space-operation", "flight"],
        text: "Sealed and operated outside the atmosphere while Stark chased the Q-ship out of Earth orbit.",
        basis: "on-screen",
        citations: [IW("Q-ship pursuit into space.")],
      },
    ],
    limitations: [
      {
        id: "mark-l-lim-depletion",
        tags: ["material-depletion"],
        text: "Finite nanoparticle reserve: as Thanos tore material away the armor could no longer fully rebuild itself.",
        basis: "on-screen",
        citations: [IW("Titan: the armor's plating visibly thins over the fight.")],
      },
      {
        id: "mark-l-lim-own-blade",
        tags: ["combat-damage"],
        text: "Thanos broke off a piece of the armor and stabbed Stark with it.",
        basis: "on-screen",
        citations: [IW("Titan: Stark is wounded with his own armor.")],
      },
    ],
    image: null,
    technologyIds: [
      "repulsors",
      "flight-stabilization",
      "helmet-hud",
      "onboard-ai",
      "nanotechnology",
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: "mark-lxxxv",
    designation: "Mark LXXXV",
    markNumber: 85,
    alias: null,
    designationBasis: "official-materials",
    summary:
      "Stark's final armor, worn in the battle at the Avengers Compound and used to wield the Infinity Stones.",
    firstAppearanceFilmId: "avengers-endgame-2019",
    appearanceFilmIds: ["avengers-endgame-2019"],
    facts: [
      {
        id: "mark-lxxxv-final-battle",
        text: "Worn by Stark in the battle at the Avengers Compound against Thanos's forces.",
        basis: "on-screen",
        citations: [ENDGAME("Final battle at the Avengers Compound.")],
      },
      {
        id: "mark-lxxxv-stones",
        text: "Took the Infinity Stones from Thanos's gauntlet and formed a gauntlet housing around them so Stark could snap; the energy discharge killed him.",
        basis: "on-screen",
        citations: [
          ENDGAME("Final battle: the Stones transfer to Stark's hand; \u201cAnd I am Iron Man.\u201d"),
        ],
      },
      {
        id: "mark-lxxxv-designation-source",
        text: "The designation \"Mark LXXXV\" is the name used in Marvel's official materials; it is not spoken in the film.",
        basis: "official-materials",
        citations: [MARVEL_BIO("Armor history section.")],
      },
    ],
    specs: unknownSpecs(),
    design: {
      id: "mark-lxxxv-design",
      approach: "nanotech",
      text: "Nanoparticle armor of the same kind as the Mark L, forming from a chest housing.",
      basis: "on-screen",
      citations: [ENDGAME("Final battle: suit-up and gauntlet formation.")],
    },
    capabilities: [
      {
        id: "mark-lxxxv-cap-stone-gauntlet",
        tags: ["stone-handling", "reconfiguration"],
        text: "Able to pull the Infinity Stones from Thanos's gauntlet and build a gauntlet housing on Stark's hand.",
        basis: "on-screen",
        citations: [ENDGAME("Final battle: the Stones move to Stark's hand.")],
      },
      {
        id: "mark-lxxxv-cap-battle",
        tags: ["combat"],
        text: "Fought through the Compound battle against Thanos's army and Thanos himself alongside Rogers and Thor.",
        basis: "on-screen",
        citations: [ENDGAME("Final battle at the Avengers Compound.")],
      },
    ],
    limitations: [
      {
        id: "mark-lxxxv-lim-stones-fatal",
        tags: ["fatal-energy"],
        text: "The armor did not shield Stark from the energy of the Stones; the snap was fatal.",
        basis: "on-screen",
        citations: [ENDGAME("Final battle: Stark's death after the snap.")],
      },
    ],
    image: null,
    technologyIds: [
      "repulsors",
      "flight-stabilization",
      "helmet-hud",
      "onboard-ai",
      "nanotechnology",
    ],
  },
];
