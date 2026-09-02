import { GOOGLE_MAPS_API_KEY } from "../../constants/googleMaps";
import { getActiveCountry } from "../../constants/countries";

const PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";
const PLACES_DETAILS_BASE_URL = "https://places.googleapis.com/v1/places";

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "addressComponents",
  "types",
].join(",");

export type PlacePrediction = {
  name: string;
  subtitle: string;
  placeId: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  types: string[];
};

type Coords = {
  latitude: number;
  longitude: number;
};

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

function getComponent(
  components: AddressComponent[],
  type: string,
): string | null {
  const match = components.find((component) =>
    component.types?.includes(type),
  );
  return match?.longText?.trim() || match?.shortText?.trim() || null;
}

function parseAddressParts(components: AddressComponent[] = []) {
  return {
    city:
      getComponent(components, "locality") ||
      getComponent(components, "postal_town") ||
      getComponent(components, "administrative_area_level_2"),
    state: getComponent(components, "administrative_area_level_1"),
    country: getComponent(components, "country"),
    postalCode: getComponent(components, "postal_code"),
  };
}

async function readPlacesError(res: Response): Promise<string> {
  try {
    const json = await res.json();
    return (
      json?.error?.message ||
      json?.error?.status ||
      `Places request failed (${res.status})`
    );
  } catch {
    return `Places request failed (${res.status})`;
  }
}

export async function autocompletePlaces(
  input: string,
  biasCoords?: Coords | null,
  radiusMeters: number = 50000,
): Promise<PlacePrediction[]> {
  const trimmed = input.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const market = getActiveCountry();
  const bias =
    biasCoords?.latitude != null && biasCoords?.longitude != null
      ? biasCoords
      : market.defaultCoords;

  const res = await fetch(PLACES_AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
    },
    body: JSON.stringify({
      input: trimmed,
      includedRegionCodes: [market.placesCountry],
      languageCode: market.languageCode,
      regionCode: market.placesCountry.toUpperCase(),
      locationBias: {
        circle: {
          center: {
            latitude: bias.latitude,
            longitude: bias.longitude,
          },
          radius: radiusMeters,
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(await readPlacesError(res));
  }

  const json = await res.json();
  const suggestions = Array.isArray(json?.suggestions) ? json.suggestions : [];

  return suggestions
    .map((suggestion: any) => suggestion?.placePrediction)
    .filter(Boolean)
    .map((prediction: any) => {
      const main =
        prediction?.structuredFormat?.mainText?.text ||
        prediction?.text?.text ||
        "";
      const secondary = prediction?.structuredFormat?.secondaryText?.text || "";

      return {
        name: main,
        subtitle: secondary,
        placeId: prediction.placeId,
      } as PlacePrediction;
    })
    .filter((item: PlacePrediction) => Boolean(item.placeId && item.name));
}

export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  if (!placeId) {
    return null;
  }

  const res = await fetch(
    `${PLACES_DETAILS_BASE_URL}/${encodeURIComponent(placeId)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": DETAILS_FIELD_MASK,
      },
    },
  );

  if (!res.ok) {
    throw new Error(await readPlacesError(res));
  }

  const place = await res.json();
  const latitude = place?.location?.latitude;
  const longitude = place?.location?.longitude;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  const parts = parseAddressParts(place?.addressComponents || []);

  return {
    placeId: place?.id || placeId,
    name: place?.displayName?.text || "",
    address: place?.formattedAddress || place?.displayName?.text || "",
    latitude,
    longitude,
    city: parts.city,
    state: parts.state,
    country: parts.country,
    postalCode: parts.postalCode,
    types: Array.isArray(place?.types) ? place.types : [],
  };
}
