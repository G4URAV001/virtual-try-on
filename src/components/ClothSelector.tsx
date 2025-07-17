import React, { useState, useRef } from 'react';
import { Upload, Check } from 'lucide-react';
import { ClothingItem } from './MobileInterface';

interface ClothSelectorProps {
  onClothingSelect: (item: ClothingItem) => void;
  onClothingUpload: (imageDataUrl: string) => void;
  selectedClothing: ClothingItem | null;
}

const ClothSelector: React.FC<ClothSelectorProps> = ({ 
  onClothingSelect, 
  onClothingUpload, 
  selectedClothing 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample clothing catalog - in production, this would come from an API
  const clothingCatalog: ClothingItem[] = [
    {
      id: '1',
      name: 'Blue Denim Jacket',
      image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'jacket'
    },
    {
      id: '2',
      name: 'White Cotton T-Shirt',
      image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'shirt'
    },
    {
      id: '3',
      name: 'Red Sweater',
      image: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'sweater'
    },
    {
      id: '4',
      name: 'Black Formal Shirt',
      image: 'https://images.pexels.com/photos/5698955/pexels-photo-5698955.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'shirt'
    },
    {
      id: '5',
      name: 'Gray Hoodie',
      image: 'https://images.pexels.com/photos/7679471/pexels-photo-7679471.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'hoodie'
    },
    {
      id: '6',
      name: 'Green Cardigan',
      image: 'https://images.pexels.com/photos/7679838/pexels-photo-7679838.jpeg?auto=compress&cs=tinysrgb&w=400',
      category: 'cardigan'
    }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        onClothingUpload(imageDataUrl);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Select Clothing</h2>
        <p className="text-gray-600">Choose from our catalog or upload your own</p>
      </div>

      {/* Upload Custom Clothing */}
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Upload Your Own Clothing
            </>
          )}
        </button>

        <div className="flex items-center justify-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">or choose from catalog</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
      </div>

      {/* Clothing Grid */}
      <div className="grid grid-cols-2 gap-4">
        {clothingCatalog.map((item) => (
          <div
            key={item.id}
            onClick={() => onClothingSelect(item)}
            className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
              selectedClothing?.id === item.id
                ? 'ring-2 ring-blue-500 ring-offset-2 transform scale-105'
                : 'hover:shadow-lg hover:scale-105'
            }`}
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white font-medium text-sm">{item.name}</p>
              <p className="text-white/80 text-xs capitalize">{item.category}</p>
            </div>
            {selectedClothing?.id === item.id && (
              <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedClothing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-blue-500 mr-3" />
            <div>
              <p className="text-blue-800 font-medium">{selectedClothing.name}</p>
              <p className="text-blue-600 text-sm">Selected for try-on</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClothSelector;