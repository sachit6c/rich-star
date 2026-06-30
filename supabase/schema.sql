CREATE TABLE IF NOT EXISTS constellations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    iau_abbr TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    ra_center FLOAT8,
    dec_center FLOAT8,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mythology (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    constellation_id uuid NOT NULL REFERENCES constellations(id) ON DELETE CASCADE,
    culture TEXT NOT NULL CHECK (culture IN ('greek', 'arabic', 'chinese', 'indigenous_australian', 'hindu')),
    title TEXT,
    body TEXT NOT NULL,
    deity TEXT,
    fun_fact TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (constellation_id, culture)
);

CREATE INDEX IF NOT EXISTS idx_mythology_constellation_id ON mythology(constellation_id);
