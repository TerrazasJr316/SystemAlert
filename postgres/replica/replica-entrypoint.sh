#!/bin/bash
set -e

if [ -z "$(ls -A "$PGDATA" 2>/dev/null)" ]; then
    echo "[replica-init] Directorio de datos vacío — clonando desde master..."

    until pg_isready -h "$MASTER_HOST" -p 5432 -U postgres; do
        echo "[replica-init] Esperando a que master esté listo..."
        sleep 2
    done

    pg_basebackup \
        -h "$MASTER_HOST" \
        -p 5432 \
        -U replicator \
        -D "$PGDATA" \
        -Fp \
        -Xs \
        -P \
        -R

    echo "[replica-init] Clonación completa. standby.signal generado por -R."
fi

exec docker-entrypoint.sh postgres
