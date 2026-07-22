// ============================================================
//  GAME CONTENT — edit this file to make the game your own.
// ------------------------------------------------------------
//  * Change GAME_TITLE for the name shown at the top.
//  * Change MANA_LIMIT for the total mana each player gets.
//  * Add / edit cards below. Each card needs:
//      id          unique text id (no spaces)
//      name        shown on the fallback card
//      mana        the mana cost (used for the maths)
//      image       path to your PNG, e.g. "cards/team1/fireball.png"
//      description short text (shown on the fallback card)
//
//  The PNG is the whole card art (image + name + text + cost).
//  Until you add the PNG, a styled placeholder card is shown,
//  so the game is fully playable right away.
// ============================================================

export const GAME_TITLE = "Mana Clash";
export const MANA_LIMIT = 10;

export const TEAMS = [
  { id: "team1", name: "Team 1 · Flame", color: "#e74c3c" },
  { id: "team2", name: "Team 2 · Tide",  color: "#3498db" },
  { id: "team3", name: "Team 3 · Grove", color: "#2ecc71" },
];

export const CARDS = {
  team1: [
    { id: "t1_ember",   name: "Ember Sprite",  mana: 1, image: "cards/team1/ember.png",   description: "A tiny spark that chips away at foes." },
    { id: "t1_spark",   name: "Spark Bolt",    mana: 2, image: "cards/team1/spark.png",   description: "Quick jolt of fire damage." },
    { id: "t1_wall",    name: "Flame Wall",    mana: 3, image: "cards/team1/wall.png",    description: "Burns anything that crosses it." },
    { id: "t1_fireball",name: "Fireball",      mana: 4, image: "cards/team1/fireball.png",description: "Big burst of fire to a target." },
    { id: "t1_golem",   name: "Lava Golem",    mana: 5, image: "cards/team1/golem.png",   description: "Slow, tough, and very hot." },
    { id: "t1_dragon",  name: "Inferno Dragon",mana: 6, image: "cards/team1/dragon.png",  description: "Your heaviest hitter." },
  ],
  team2: [
    { id: "t2_bubble",  name: "Bubble",        mana: 1, image: "cards/team2/bubble.png",  description: "Cheap little shield of water." },
    { id: "t2_frost",   name: "Frost Bolt",    mana: 2, image: "cards/team2/frost.png",   description: "Slows the enemy with ice." },
    { id: "t2_heal",    name: "Healing Spring",mana: 3, image: "cards/team2/heal.png",    description: "Restores an ally over time." },
    { id: "t2_elem",    name: "Water Elemental",mana: 4,image: "cards/team2/elemental.png",description: "Reliable all-round fighter." },
    { id: "t2_tidal",   name: "Tidal Wave",    mana: 5, image: "cards/team2/tidal.png",   description: "Sweeps a whole lane." },
    { id: "t2_kraken",  name: "Kraken",        mana: 6, image: "cards/team2/kraken.png",  description: "Monster of the deep." },
  ],
  team3: [
    { id: "t3_herb",    name: "Healing Herb",  mana: 1, image: "cards/team3/herb.png",    description: "A small restorative sprig." },
    { id: "t3_wolf",    name: "Forest Wolf",   mana: 2, image: "cards/team3/wolf.png",    description: "Fast and hits in a pack." },
    { id: "t3_vine",    name: "Thorn Vine",    mana: 3, image: "cards/team3/vine.png",    description: "Snares and pricks attackers." },
    { id: "t3_eagle",   name: "Eagle Scout",   mana: 4, image: "cards/team3/eagle.png",   description: "Strikes from above." },
    { id: "t3_bear",    name: "Stone Bear",    mana: 5, image: "cards/team3/bear.png",    description: "A wall of muscle and bark." },
    { id: "t3_treant",  name: "Ancient Treant",mana: 6, image: "cards/team3/treant.png",  description: "Towering guardian of the grove." },
  ],
};
