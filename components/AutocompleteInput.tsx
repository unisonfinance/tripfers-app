
import React, { useRef, useEffect, useState } from 'react';
import { Icons } from './Icons';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (address: string) => void;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  placeholder: string;
  hideIcon?: boolean;
  className?: string;
  userLocation?: { lat: number; lng: number };
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ 
    value, onChange, onPlaceSelected, onLocationSelect, placeholder, hideIcon = false, className, userLocation
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const onLocationSelectRef = useRef(onLocationSelect);

  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
    onLocationSelectRef.current = onLocationSelect;
  }, [onPlaceSelected, onLocationSelect]);

  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsApiLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        setIsApiLoaded(true);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isApiLoaded && inputRef.current && !autocompleteRef.current) {
      try {
        const options: any = {
          fields: ["formatted_address", "geometry"],
          types: ["geocode"],
        };

        // Apply location bias if user location is available
        if (userLocation) {
            options.locationBias = {
                radius: 50000, // 50km bias
                center: userLocation
            };
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, options);

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            if (onPlaceSelectedRef.current) {
                onPlaceSelectedRef.current(place.formatted_address);
            }
            if (onLocationSelectRef.current && place.geometry && place.geometry.location) {
                onLocationSelectRef.current({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                });
            }
          }
        });
      } catch (e) {
        console.error("Error initializing Google Autocomplete:", e);
      }
    }
  }, [isApiLoaded, userLocation]);

  return (
    <div className={`relative h-14 w-full ${className || ''}`}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-14 pl-4 p-3.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none transition-colors duration-200 text-[16px] shadow-sm ${hideIcon ? '' : 'pl-10'}`}
        style={{lineHeight: '1.5rem'}}
        autoComplete="off"
      />
      {!hideIcon && <Icons.MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
    </div>
  );
};
