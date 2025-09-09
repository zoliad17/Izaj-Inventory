/**
 * Utility functions for Google Maps integration
 */

export interface MapCoordinates {
    lat: number;
    lng: number;
}

/**
 * Generate a static map snapshot URL using Google Maps Static API
 * @param coordinates - The latitude and longitude coordinates
 * @param address - The address for the marker label
 * @param size - The size of the static map (default: 400x300)
 * @returns The static map URL
 */
export const generateStaticMapUrl = (
    coordinates: MapCoordinates,
    address: string,
    size: string = '400x300'
): string => {
    const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.warn('Google Maps API key not found. Static map generation will fail.');
        return '';
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
        center: `${coordinates.lat},${coordinates.lng}`,
        zoom: '15',
        size,
        markers: `color:red|label:B|${coordinates.lat},${coordinates.lng}`,
        key: apiKey,
    });

    // Use address for better map context (optional)
    if (address) {
        params.set('q', address);
    }

    const url = `${baseUrl}?${params.toString()}`;
    return url;
};

/**
 * Generate an embedded map URL for iframe embedding
 * @param coordinates - The latitude and longitude coordinates
 * @param address - The address for the map
 * @returns The embedded map URL
 */
export const generateEmbeddedMapUrl = (
    coordinates: MapCoordinates,
    address: string
): string => {
    const baseUrl = 'https://www.google.com/maps/embed/v1/place';
    const params = new URLSearchParams({
        key: import.meta.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
        q: address,
        center: `${coordinates.lat},${coordinates.lng}`,
        zoom: '15',
    });

    return `${baseUrl}?${params.toString()}`;
};

/**
 * Validate coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns True if coordinates are valid
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180 &&
        !isNaN(lat) &&
        !isNaN(lng)
    );
};

/**
 * Format coordinates for display
 * @param coordinates - The coordinates to format
 * @returns Formatted coordinate string
 */
export const formatCoordinates = (coordinates: MapCoordinates): string => {
    return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
};
