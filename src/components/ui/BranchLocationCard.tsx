import React from 'react';
import { MapIcon } from '@heroicons/react/outline';
import { MapCoordinates } from '../../types';
import { generateStaticMapUrl } from '../../utils/mapUtils';

interface BranchLocationCardProps {
    branchName: string;
    address: string;
    coordinates?: MapCoordinates;
    mapSnapshotUrl?: string;
    className?: string;
}

const BranchLocationCard: React.FC<BranchLocationCardProps> = ({
    branchName,
    address,
    coordinates,
    mapSnapshotUrl,
    className = ''
}) => {
    // Generate static map URL if coordinates are available and no snapshot URL provided
    const staticMapUrl = mapSnapshotUrl || (coordinates ? generateStaticMapUrl(coordinates, address) : null);


    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
            {/* Branch Name */}
            <div className="flex items-start space-x-3 mb-3">
                <MapIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {branchName}
                    </h3>
                </div>
            </div>

            {/* Address */}
            <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address:
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {address}
                </p>
            </div>

            {/* Coordinates */}
            {coordinates && (
                <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Coordinates:
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-mono">
                        {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </p>
                </div>
            )}

            {/* Static Map Snapshot */}
            {staticMapUrl && (
                <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location:
                    </p>
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                        <img
                            src={staticMapUrl}
                            alt={`Map of ${branchName}`}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                                // Fallback if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />
                        <div
                            className="hidden items-center justify-center h-48 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        >
                            <div className="text-center">
                                <MapIcon className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">Map unavailable</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchLocationCard;
