/** Build a readable place label from OSM address parts. */
export function formatPlaceLabel(parts: {
  name?: string;
  street?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
}): { label: string; subtitle: string } {
  if (parts.name?.trim()) {
    const subtitle = [parts.street, parts.district, parts.city, parts.state, parts.country]
      .filter(Boolean)
      .filter((part, index, arr) => arr.indexOf(part) === index)
      .slice(0, 3)
      .join(", ");

    return {
      label: parts.name.trim(),
      subtitle,
    };
  }

  const primary = [parts.street, parts.district, parts.city].filter(Boolean);
  const uniquePrimary = [...new Set(primary)];
  const label =
    uniquePrimary.slice(0, 2).join(", ") ||
    parts.city ||
    parts.state ||
    "Selected place";

  const subtitle = [parts.city, parts.state, parts.country].filter(Boolean).join(", ");

  return { label, subtitle };
}

function dedupePlaces(places: Array<{ lat: number; lng: number; label: string }>) {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = `${place.label.toLowerCase()}|${place.lat.toFixed(3)}|${place.lng.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { dedupePlaces };
