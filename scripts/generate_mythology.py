import anthropic
import json
import time
import os
import sys
from dotenv import load_dotenv

# Load .env from project root (parent of scripts/)
_project_root = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(_project_root, ".env"))

OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "mythology_data.json")

CONSTELLATIONS = [
    {"iau_abbr": "AND", "name": "Andromeda"},
    {"iau_abbr": "ANT", "name": "Antlia"},
    {"iau_abbr": "APS", "name": "Apus"},
    {"iau_abbr": "AQR", "name": "Aquarius"},
    {"iau_abbr": "AQL", "name": "Aquila"},
    {"iau_abbr": "ARA", "name": "Ara"},
    {"iau_abbr": "ARI", "name": "Aries"},
    {"iau_abbr": "AUR", "name": "Auriga"},
    {"iau_abbr": "BOO", "name": "Boötes"},
    {"iau_abbr": "CAE", "name": "Caelum"},
    {"iau_abbr": "CAM", "name": "Camelopardalis"},
    {"iau_abbr": "CNC", "name": "Cancer"},
    {"iau_abbr": "CVN", "name": "Canes Venatici"},
    {"iau_abbr": "CMA", "name": "Canis Major"},
    {"iau_abbr": "CMI", "name": "Canis Minor"},
    {"iau_abbr": "CAP", "name": "Capricornus"},
    {"iau_abbr": "CAR", "name": "Carina"},
    {"iau_abbr": "CAS", "name": "Cassiopeia"},
    {"iau_abbr": "CEN", "name": "Centaurus"},
    {"iau_abbr": "CEP", "name": "Cepheus"},
    {"iau_abbr": "CET", "name": "Cetus"},
    {"iau_abbr": "CHA", "name": "Chamaeleon"},
    {"iau_abbr": "CIR", "name": "Circinus"},
    {"iau_abbr": "COL", "name": "Columba"},
    {"iau_abbr": "COM", "name": "Coma Berenices"},
    {"iau_abbr": "CRA", "name": "Corona Australis"},
    {"iau_abbr": "CRB", "name": "Corona Borealis"},
    {"iau_abbr": "CRV", "name": "Corvus"},
    {"iau_abbr": "CRT", "name": "Crater"},
    {"iau_abbr": "CRU", "name": "Crux"},
    {"iau_abbr": "CYG", "name": "Cygnus"},
    {"iau_abbr": "DEL", "name": "Delphinus"},
    {"iau_abbr": "DOR", "name": "Dorado"},
    {"iau_abbr": "DRA", "name": "Draco"},
    {"iau_abbr": "EQU", "name": "Equuleus"},
    {"iau_abbr": "ERI", "name": "Eridanus"},
    {"iau_abbr": "FOR", "name": "Fornax"},
    {"iau_abbr": "GEM", "name": "Gemini"},
    {"iau_abbr": "GRU", "name": "Grus"},
    {"iau_abbr": "HER", "name": "Hercules"},
    {"iau_abbr": "HOR", "name": "Horologium"},
    {"iau_abbr": "HYA", "name": "Hydra"},
    {"iau_abbr": "HYI", "name": "Hydrus"},
    {"iau_abbr": "IND", "name": "Indus"},
    {"iau_abbr": "LAC", "name": "Lacerta"},
    {"iau_abbr": "LEO", "name": "Leo"},
    {"iau_abbr": "LMI", "name": "Leo Minor"},
    {"iau_abbr": "LEP", "name": "Lepus"},
    {"iau_abbr": "LIB", "name": "Libra"},
    {"iau_abbr": "LUP", "name": "Lupus"},
    {"iau_abbr": "LYN", "name": "Lynx"},
    {"iau_abbr": "LYR", "name": "Lyra"},
    {"iau_abbr": "MEN", "name": "Mensa"},
    {"iau_abbr": "MIC", "name": "Microscopium"},
    {"iau_abbr": "MON", "name": "Monoceros"},
    {"iau_abbr": "MUS", "name": "Musca"},
    {"iau_abbr": "NOR", "name": "Norma"},
    {"iau_abbr": "OCT", "name": "Octans"},
    {"iau_abbr": "OPH", "name": "Ophiuchus"},
    {"iau_abbr": "ORI", "name": "Orion"},
    {"iau_abbr": "PAV", "name": "Pavo"},
    {"iau_abbr": "PEG", "name": "Pegasus"},
    {"iau_abbr": "PER", "name": "Perseus"},
    {"iau_abbr": "PHE", "name": "Phoenix"},
    {"iau_abbr": "PIC", "name": "Pictor"},
    {"iau_abbr": "PSC", "name": "Pisces"},
    {"iau_abbr": "PSA", "name": "Piscis Austrinus"},
    {"iau_abbr": "PUP", "name": "Puppis"},
    {"iau_abbr": "PYX", "name": "Pyxis"},
    {"iau_abbr": "RET", "name": "Reticulum"},
    {"iau_abbr": "SGE", "name": "Sagitta"},
    {"iau_abbr": "SGR", "name": "Sagittarius"},
    {"iau_abbr": "SCO", "name": "Scorpius"},
    {"iau_abbr": "SCL", "name": "Sculptor"},
    {"iau_abbr": "SCT", "name": "Scutum"},
    {"iau_abbr": "SER", "name": "Serpens"},
    {"iau_abbr": "SEX", "name": "Sextans"},
    {"iau_abbr": "TAU", "name": "Taurus"},
    {"iau_abbr": "TEL", "name": "Telescopium"},
    {"iau_abbr": "TRI", "name": "Triangulum"},
    {"iau_abbr": "TRA", "name": "Triangulum Australe"},
    {"iau_abbr": "TUC", "name": "Tucana"},
    {"iau_abbr": "UMA", "name": "Ursa Major"},
    {"iau_abbr": "UMI", "name": "Ursa Minor"},
    {"iau_abbr": "VEL", "name": "Vela"},
    {"iau_abbr": "VIR", "name": "Virgo"},
    {"iau_abbr": "VOL", "name": "Volans"},
    {"iau_abbr": "VUL", "name": "Vulpecula"},
]


def build_prompt(name: str, iau_abbr: str) -> str:
    return f"""You are a mythology and astronomy researcher. For the constellation {name} ({iau_abbr}), write brief mythology entries (2-4 sentences each) for exactly these 5 cultures. Return ONLY valid JSON — no markdown fences, no explanation, just the JSON array:

[
  {{"culture": "greek", "title": "string", "body": "string", "deity": "string or null", "fun_fact": "string"}},
  {{"culture": "arabic", "title": "string", "body": "string", "deity": null, "fun_fact": "string"}},
  {{"culture": "chinese", "title": "string", "body": "string", "deity": "string or null", "fun_fact": "string"}},
  {{"culture": "indigenous_australian", "title": "string", "body": "string", "deity": null, "fun_fact": "string"}},
  {{"culture": "hindu", "title": "string", "body": "string", "deity": "string or null", "fun_fact": "string"}}
]

Rules:
- body: 2-4 sentences, substantive and specific
- title: the name this culture gave to these stars (translate if needed)
- deity: the primary associated divine figure, or null
- fun_fact: one surprising culturally-specific fact about this constellation
- For Hindu entries: reference Nakshatras (lunar mansions) where the constellation overlaps
- For Indigenous Australian: name a specific Aboriginal group's tradition
- Write real, accurate mythological content"""


def make_fallback_entries(name: str, iau_abbr: str) -> list:
    cultures = ["greek", "arabic", "chinese", "indigenous_australian", "hindu"]
    return [
        {
            "culture": culture,
            "title": name,
            "body": "[Content generation failed - please regenerate]",
            "deity": None,
            "fun_fact": "[Content generation failed - please regenerate]",
        }
        for culture in cultures
    ]


def load_existing_data() -> list:
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            print(f"Loaded {len(data)} existing entries from {OUTPUT_FILE}")
            return data
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not load existing output file: {e}")
    return []


def save_data(data: list) -> None:
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not found in environment or .env file.", file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    existing_data = load_existing_data()
    processed_abbrs = {entry["iau_abbr"] for entry in existing_data}

    results = list(existing_data)
    total = len(CONSTELLATIONS)

    for idx, constellation in enumerate(CONSTELLATIONS, start=1):
        iau_abbr = constellation["iau_abbr"]
        name = constellation["name"]

        if iau_abbr in processed_abbrs:
            print(f"[{idx}/{total}] Skipping {name} (already processed)")
            continue

        print(f"[{idx}/{total}] Processing {name}...")

        prompt = build_prompt(name, iau_abbr)
        entries = None

        try:
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )
            raw_text = message.content[0].text.strip()

            try:
                entries = json.loads(raw_text)
            except json.JSONDecodeError as parse_err:
                print(f"  JSON parse error for {name}: {parse_err}", file=sys.stderr)
                print(f"  Raw response (first 200 chars): {raw_text[:200]}", file=sys.stderr)
                entries = make_fallback_entries(name, iau_abbr)

        except Exception as api_err:
            print(f"  API error for {name}: {api_err}", file=sys.stderr)
            entries = make_fallback_entries(name, iau_abbr)

        record = {
            "iau_abbr": iau_abbr,
            "name": name,
            "entries": entries,
        }
        results.append(record)
        save_data(results)

        if idx < total:
            time.sleep(0.3)

    print(f"\nDone! {len(results)} constellations written to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
