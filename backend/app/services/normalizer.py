import re
from typing import Dict, List, Tuple, Optional


class MaterialNormalizer:
    """
    Normalises material names, aliases, and units across messy documents,
    supplier quotations, and internal master records.
    """

    # Alias mapping dictionary
    CANONICAL_ALIASES: Dict[str, List[str]] = {
        "Hot Rolled Carbon Steel (IS 2062)": [
            "is 2062", "is2062", "carbon steel", "hr coil", "hrc", "hot rolled coil",
            "ms plate", "mild steel", "hr sheet", "structural steel", "carbon steel plate"
        ],
        "Cold Rolled Sheet Metal (CRCA)": [
            "crca", "cold rolled", "cr sheet", "crca sheet", "cr coil", "cold rolled close annealed"
        ],
        "Stainless Steel (SS-304/SS-316)": [
            "ss 304", "ss-304", "ss304", "stainless steel 304", "ss 316", "ss-316", "ss316",
            "stainless steel", "inox 304", "a2 stainless", "stainless steel sheet"
        ],
        "Aluminium Alloy Billet (6061-T6)": [
            "aluminium 6061", "aluminum 6061", "6061-t6", "6061 t6", "al 6061", "al-6061",
            "aluminium alloy", "aluminum alloy", "6061 billet", "al billet"
        ],
        "Cast Aluminium Ingot (A380)": [
            "a380", "aluminium ingot", "aluminum ingot", "cast aluminium", "cast aluminum", "a380.0", "die cast alloy"
        ],
        "Copper & Brass Alloys": [
            "copper", "cu busbar", "c11000", "brass", "c36000", "copper rod", "copper strip"
        ],
        "Welding Wire & Gas Consumables": [
            "welding wire", "er70s-6", "mig wire", "welding rod", "co2 gas", "argon mix", "welding consumable"
        ],
        "Combed Cotton Yarn": [
            "cotton yarn", "combed cotton", "cotton 30s", "cotton 40s", "cotton candy", "shankar-6",
            "cotton", "yarn", "spinning yarn", "cotton thread"
        ],
        "Polyester Filament Yarn": [
            "polyester yarn", "pfy", "dty", "polyester filament", "spun polyester", "polyester"
        ],
        "Denim & Woven Fabric": [
            "denim fabric", "denim", "raw denim", "twill", "indigo cloth", "jeans fabric", "woven fabric", "cloth"
        ],
        "Cotton Grey Fabric (Greige)": [
            "grey fabric", "greige", "greige fabric", "cotton greige", "unbleached fabric"
        ],
        "Dyed Cotton & Shirting Fabric": [
            "shirting fabric", "cotton shirting", "dyed cloth", "poplin", "cambric", "fabric", "cloth fabric"
        ],
        "Viscose & Rayon Yarn": [
            "viscose", "rayon", "modal", "viscose fabric", "rayon cloth"
        ],
        "Apparel Trims, Buttons & Zippers": [
            "buttons", "zippers", "trims", "sewing thread", "labels", "elastic", "interlining"
        ],
        "Bare Multilayer FR-4 PCB": [
            "fr4 pcb", "fr-4", "bare pcb", "printed circuit board", "pcb board", "multilayer pcb"
        ],
        "Microcontroller & SoC": [
            "mcu", "microcontroller", "arm cortex", "soc", "stm32", "esp32", "processor chip"
        ],
        "Passive SMD Components": [
            "smd resistors", "smd capacitors", "passive components", "0603", "0805", "ceramic capacitor"
        ],
        "Refined Palm Oil": [
            "palm oil", "cpo", "refined palm", "rbd palm olein", "palmolein"
        ],
        "Food Grade Packaging & Pouches": [
            "pouch", "corrugated box", "packaging pouch", "laminated pouch", "food packaging"
        ]
    }

    UNIT_NORMALIZATION: Dict[str, str] = {
        "kg": "kg", "kgs": "kg", "kilogram": "kg", "kilograms": "kg",
        "mt": "metric_ton", "ton": "metric_ton", "tonne": "metric_ton", "tons": "metric_ton",
        "sheet": "sheet", "sheets": "sheet",
        "mtr": "metre", "meter": "metre", "meters": "metre", "m": "metre",
        "pc": "piece", "pcs": "piece", "nos": "piece", "no": "piece", "pieces": "piece",
        "ltr": "litre", "liter": "litre", "litres": "litre", "l": "litre"
    }

    @classmethod
    def normalize_material_name(cls, raw_name: str) -> Tuple[str, float]:
        """
        Matches raw input string against canonical aliases.
        Returns: (canonical_name, confidence_score 0.0 to 1.0)
        """
        if not raw_name:
            return "Uncategorized Material", 0.0

        cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", raw_name.lower())
        tokens = set(cleaned.split())

        best_canonical = raw_name.strip()
        best_score = 0.0

        for canonical, aliases in cls.CANONICAL_ALIASES.items():
            for alias in aliases:
                alias_clean = re.sub(r"[^a-zA-Z0-9\s]", " ", alias.lower()).strip()
                if alias_clean in cleaned:
                    score = len(alias_clean) / max(len(cleaned), 1)
                    score = min(0.95, 0.70 + (0.25 * score))
                    if score > best_score:
                        best_score = score
                        best_canonical = canonical

        if best_score < 0.65:
            # Fallback to direct raw title provided in document with high confidence
            return raw_name.strip(), 0.88

        return best_canonical, round(best_score, 2)

    @classmethod
    def normalize_unit(cls, raw_unit: str) -> str:
        """
        Normalises unit string.
        """
        if not raw_unit:
            return "kg"
        cleaned = raw_unit.lower().strip()
        return cls.UNIT_NORMALIZATION.get(cleaned, cleaned)
