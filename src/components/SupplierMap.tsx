// src/components/SupplierMap.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { DocumentData } from 'firebase/firestore';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";

// This function creates our custom colored map icons
const getRiskIcon = (risk: string) => {
    const color = {
        'High': '#EF4444',   // Red
        'Medium': '#F59E0B', // Amber
        'Low': '#10B981'    // Emerald
    }[risk] || '#6B7280';    // Gray

    const iconHtml = `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

export default function SupplierMap({ suppliers }: { suppliers: DocumentData[] }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Supplier Risk Map</h3>
            <MapContainer center={[20, 0]} zoom={2} style={{ height: '500px', width: '100%' }} className="rounded-lg z-10">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {suppliers.map(supplier => (
                    supplier.lat && supplier.lng && (
                        <Marker 
                            key={supplier.id} 
                            position={[supplier.lat, supplier.lng]}
                            icon={getRiskIcon(supplier.predictedRisk)}
                        >
                            <Popup>
                                <div className="font-sans">
                                    <p className="font-bold text-base">{supplier.name}</p>
                                    <p className="text-sm text-gray-600">{supplier.country}</p>
                                    <p className="text-sm">Risk: <span className="font-semibold">{supplier.predictedRisk}</span></p>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
}