# ─────────────────────────────────────────
# Mapeo de coordenadas a zona geográfica
# Simplificado para la demo: rangos de lat/lon
# por cuadrante alrededor de un punto central
# ─────────────────────────────────────────
#
# Ajusta CENTER_LAT y CENTER_LON a la ubicación real
# donde se hará la demo (tu ciudad/escuela)

CENTER_LAT = 20.0553
CENTER_LON = -99.3455


def get_zone(lat: float, lon: float) -> str:
    """
    Determina la zona geográfica según el cuadrante
    respecto al punto central.

    Norte/Sur: comparación de latitud
    Oriente/Centro: comparación de longitud

    Esto es un mapeo simplificado válido para la demo.
    En producción usarías un servicio de geocodificación
    real o polígonos con shapely/PostGIS.
    """
    lat_diff = lat - CENTER_LAT
    lon_diff = lon - CENTER_LON

    # Umbral pequeño = "Centro"
    if abs(lat_diff) < 0.005 and abs(lon_diff) < 0.005:
        return "Centro"

    if lat_diff > 0:
        return "Norte" if abs(lat_diff) >= abs(lon_diff) else "Oriente"
    else:
        return "Sur" if abs(lat_diff) >= abs(lon_diff) else "Poniente"
