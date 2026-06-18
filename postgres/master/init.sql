CREATE TABLE IF NOT EXISTS incidents (
    id              BIGSERIAL PRIMARY KEY,
    stream_id       VARCHAR(64)     NOT NULL,
    device_id       VARCHAR(64)     NOT NULL,
    lat             DOUBLE PRECISION NOT NULL,
    lon             DOUBLE PRECISION NOT NULL,
    zone            VARCHAR(32)     NOT NULL,
    emergency_type  VARCHAR(32)     NOT NULL,
    description     TEXT,
    priority        VARCHAR(16)     NOT NULL,
    received_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents (created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_zone        ON incidents (zone);
CREATE INDEX IF NOT EXISTS idx_incidents_priority     ON incidents (priority);
CREATE UNIQUE INDEX IF NOT EXISTS idx_incidents_stream_id ON incidents (stream_id);
