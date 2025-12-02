# 🧟 Zombie Defense Command

**Zombie Defense Command** is a feature-rich, browser-based strategy tower defense game built using vanilla JavaScript and HTML5 Canvas. Defend your base across three unique environments, manage your economy, and upgrade an arsenal of specialized towers to stop the undead horde.

## 🎮 Game Features

* **3 Unique Maps:** Each map introduces new enemies, specific towers, and unique mechanics (like Teleporters).
* **Save & Load System:** Progress is auto-saved after every wave. Close the browser and resume right where you left off.
* **Dynamic Wave Logic:** Waves get progressively harder, featuring distinct phases, boss fights, and swarm events.
* **Tower Synergy:** Use support units like the **Trumpeter** or **Chemist** to buff your towers or debuff enemies.
* **Complex Enemy AI:** Enemies feature regeneration, summoning abilities, shield mechanics, and buffing auras.
* **Patch Notes System:** In-game changelog alerts players to new updates upon loading.

---

## 🗺️ Maps & Mechanics

### Map 1: Grasslands 🌿
* **Difficulty:** Normal
* **Theme:** Open field warfare.
* **Unique Enemies:** Carriers (spawn smaller units on death).
* **Strategy:** Good for learning the basics of fire rates and armor piercing.

### Map 2: Haunted Cemetery 🪦
* **Difficulty:** Hard
* **Theme:** Dark, spooky graveyard.
* **Unique Enemies:**
    * **Vampires:** Regenerate health rapidly.
    * **Necromancers:** Summon additional zombies while moving.
* **Economy:** Starts with $600.

### Map 3: Secret Lab 🧪
* **Difficulty:** Expert
* **Theme:** High-tech facility with **Teleporters**.
* **Unique Mechanics:**
    * **Shields:** Enemies gain energy shields (absorb 5-10 hits) in later waves.
    * **Teleporters:** Enemies jump across the map instantly.
* **Unique Enemies:**
    * **Scientists:** Buff nearby enemies (Speed, Health, +Armor).
    * **Mutants:** Massive health regeneration tanks.

---

## 🏰 Towers

Different maps provide access to different technology tiers.

### Standard Issue (Map 1)
| Tower | Role | Description |
| :--- | :--- | :--- |
| **Rifleman** | Basic | Cheap, reliable single-target damage. |
| **Sniper** | Long Range | High damage, slow fire rate. Upgrades to **Thermal Optics**. |
| **Gunner** | Rapid Fire | High fire rate, low damage. Great against unarmored swarms. |
| **Bombardier** | Splash | Deals Area of Effect (AoE) explosive damage. |

### Elemental Tech (Map 2)
| Tower | Role | Description |
| :--- | :--- | :--- |
| **Pyro** | DoT | Sprays fire that ignores armor. Short range. |
| **Tesla** | Crowd Control | Chains lightning attacks between multiple targets. |
| **Laser Trooper** | Single Target | Ramps up damage the longer it hits the same target. |
| **Mortar** | Heavy Splash | Long-range explosive shells. Can upgrade to **Nuke**. |

### Experimental Tech (Map 3)
| Tower | Role | Description |
| :--- | :--- | :--- |
| **Chemist** | Support/Slow | Throws acid flasks that create **poison puddles**, slowing and damaging enemies. |
| **Trumpeter** | Buffer | Does not shoot. Buffs nearby towers with **Damage**, **Range**, and **Armor Pierce**. |
| **Railgun** | Heavy Dmg | Fires a massive beam that pierces through *all* enemies in a line. |
| **Lab Laser** | Single Target | A specialized laser trooper. Costly, but essential for shields. |

---

## 🕹️ Controls

* **Select Tower:** Click a card in the bottom-right palette.
* **Place Tower:** Click on a valid spot on the map.
* **Upgrade/Sell:** Click on an existing tower to open the upgrade panel.
* **Start Wave:** Click the green button in the top-right.
* **Speed Up:** Toggle between 1x and 2x game speed.
* **Mute:** Toggle sound effects in the top-right.

## 🚀 How to Run

1.  Download the project files (`index.html`, `styles.css`, `script.js`).
2.  Open `index.html` in any modern web browser (Chrome, Firefox, Edge).
3.  No server or installation required!

**OR**

The link `https://dommakarov1.github.io/ZombieDefence/` will always have the latest version available for play online!

## 📝 Version History

**Current Version: v3.3**
* Added Save/Load functionality.
* Added Scientist buff abilities (Visual blue arrow indicator).
* Added visual Wave Progress Bar.
* Rebalanced Map 3 and Map 2 difficulty curves.
* Enhanced blood splatters and puddle rendering.
