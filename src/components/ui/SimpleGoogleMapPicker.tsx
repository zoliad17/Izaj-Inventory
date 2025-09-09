import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapIcon } from '@heroicons/react/outline';
import { MapCoordinates } from '../../types';

// Google Maps type declarations
declare global {
    interface Window {
        google: any;
    }
}

interface SimpleGoogleMapPickerProps {
    onLocationSelect: (coordinates: MapCoordinates, address: string) => void;
    initialLocation?: MapCoordinates;
    initialAddress?: string;
    className?: string;
    height?: string;
    externalAddress?: string; // Address from parent component
}

// Global state to track if Google Maps is loaded
let isGoogleMapsLoaded = false;
let googleMapsLoadCallbacks: (() => void)[] = [];

// Function to load Google Maps API
const loadGoogleMaps = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {

        if (isGoogleMapsLoaded) {
            resolve();
            return;
        }

        // Check if already loading
        if (googleMapsLoadCallbacks.length > 0) {
            googleMapsLoadCallbacks.push(resolve);
            return;
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
        if (existingScript) {
            googleMapsLoadCallbacks.push(resolve);
            return;
        }

        // Add to callbacks
        googleMapsLoadCallbacks.push(resolve);

        // Create script with new Places API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places,marker&loading=async`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            isGoogleMapsLoaded = true;
            googleMapsLoadCallbacks.forEach(callback => callback());
            googleMapsLoadCallbacks = [];
        };

        script.onerror = () => {
            console.error('❌ Google Maps script failed to load');
            googleMapsLoadCallbacks.forEach(callback => callback());
            googleMapsLoadCallbacks = [];
            reject(new Error('Failed to load Google Maps API'));
        };

        document.head.appendChild(script);
    });
};

const SimpleGoogleMapPicker: React.FC<SimpleGoogleMapPickerProps> = ({
    onLocationSelect,
    initialLocation,
    initialAddress = '',
    className = '',
    height = '400px',
    externalAddress
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [, setMap] = useState<any>(null);
    const [marker, setMarker] = useState<any>(null);
    const [, setAddress] = useState(externalAddress || initialAddress);
    const mapRef = useRef<HTMLDivElement>(null);
    const geocoderRef = useRef<any>(null);
    const mapInitializedRef = useRef<boolean>(false);

    // Get API key
    const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    // Use ref to store the callback to prevent infinite re-renders
    const onLocationSelectRef = useRef(onLocationSelect);
    onLocationSelectRef.current = onLocationSelect;

    const handleLocationSelect = useCallback((coordinates: MapCoordinates, address: string) => {
        onLocationSelectRef.current(coordinates, address);
    }, []);

    // Check for API key first
    useEffect(() => {
        if (!apiKey) {
            console.error('❌ No API key found');
            setError('Google Maps API key not found');
            setIsLoading(false);
        }
    }, [apiKey]);

    // Initialize map when ref is available
    useEffect(() => {
        if (!apiKey || !mapRef.current || mapInitializedRef.current) {
            return;
        }

        const initializeMap = async () => {
            try {
                await loadGoogleMaps(apiKey);

                // Wait a bit for Google Maps to fully initialize
                await new Promise(resolve => setTimeout(resolve, 100));

                if (!window.google || !window.google.maps) {
                    throw new Error('Google Maps not available');
                }

                const mapInstance = new window.google.maps.Map(mapRef.current, {
                    center: initialLocation || { lat: 14.5995, lng: 120.9842 },
                    zoom: initialLocation ? 15 : 10,
                    mapTypeControl: true,
                    streetViewControl: true,
                    fullscreenControl: true,
                    zoomControl: true,
                    mapId: 'DEMO_MAP_ID' // Required for Advanced Markers
                });

                setMap(mapInstance);
                geocoderRef.current = new window.google.maps.Geocoder();

                // Initialize Places services - using new API approach
                if (window.google.maps.places) {
                    // Note: AutocompleteService and PlacesService are deprecated as of March 1st, 2025
                    // We'll use geocoding for autocomplete instead to avoid deprecation warnings
                    // Places API available - using geocoding-based autocomplete
                }

                // Add click listener
                const clickListener = mapInstance.addListener('click', (event: any) => {
                    if (event.latLng) {
                        const lat = event.latLng.lat();
                        const lng = event.latLng.lng();
                        const coordinates = { lat, lng };

                        // Update marker
                        if (marker) {
                            marker.position = event.latLng;
                        } else {
                            const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
                                position: event.latLng,
                                map: mapInstance,
                                title: 'Selected Location'
                            });
                            setMarker(newMarker);
                        }

                        // Geocode to get address
                        geocoderRef.current.geocode(
                            { location: event.latLng },
                            (results: any[], status: string) => {
                                if (status === 'OK' && results[0]) {
                                    setAddress(results[0].formatted_address);
                                    handleLocationSelect(coordinates, results[0].formatted_address);
                                } else {
                                    const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                                    setAddress(fallbackAddress);
                                    handleLocationSelect(coordinates, fallbackAddress);
                                }
                            }
                        );
                    }
                });

                // Add initial marker if location provided
                if (initialLocation) {
                    const initialMarker = new window.google.maps.marker.AdvancedMarkerElement({
                        position: initialLocation,
                        map: mapInstance,
                        title: 'Branch Location'
                    });
                    setMarker(initialMarker);
                }

                mapInitializedRef.current = true;
                setIsLoading(false);

                return () => {
                    clickListener.remove();
                };
            } catch (err) {
                console.error('❌ Failed to initialize map:', err);
                setError('Failed to initialize map');
                setIsLoading(false);
            }
        };

        initializeMap();

        // Cleanup function
        return () => {
            mapInitializedRef.current = false;
        };
    }, [apiKey, initialLocation]);






    // Update address when external address or initialAddress changes
    useEffect(() => {
        const newAddress = externalAddress || initialAddress;
        setAddress(newAddress);
    }, [externalAddress, initialAddress]);


    // Debug logging removed to prevent infinite re-renders

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center h-64 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="text-center p-6">
                    <MapIcon className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Google Maps API Key Required
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300">
                        Please configure your Google Maps API key in the environment variables.
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-center p-6">
                    <MapIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                        Map Error
                    </h3>
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`} style={{ height }}>

            {/* Header with instructions */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                    <MapIcon className="h-6 w-6 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Select Branch Location
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Type an address above or click directly on the map to select a location. You can drag the red marker to fine-tune the position.
                        </p>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shadow-lg">
                {/* Always render the map div so ref can be attached */}
                <div ref={mapRef} style={{ height: '100%', minHeight: '400px' }} />

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading Google Maps...</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                If this takes too long, check your API key
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimpleGoogleMapPicker;
