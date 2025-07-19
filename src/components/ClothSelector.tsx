import React, { useState, useRef } from 'react';
import { Upload, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ClothingItem } from './MobileInterface';

interface ClothSelectorProps {
  onClothingSelect: (item: ClothingItem) => void;
  onClothingUpload: (imageDataUrl: string) => void;
  selectedClothing: ClothingItem | null;
  onNext: () => void;
  onOptionsChange: (options: { photoType: string; category: string }) => void;
}

const ClothSelector: React.FC<ClothSelectorProps> = ({ 
  onClothingSelect, 
  onClothingUpload, 
  selectedClothing, 
  onNext,
  onOptionsChange
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for options
  const [photoType, setPhotoType] = useState('auto');
  const [category, setCategory] = useState('auto');
  const [showSettings, setShowSettings] = useState(false);

  // Sample clothing catalog - in production, this would come from an API
  const clothingCatalog: ClothingItem[] = [
    {
      id: '1',
      name: 'Blue Denim Jacket',
      image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '2',
      name: 'White Cotton T-Shirt',
      image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '3',
      name: 'Red Sweater',
      image: '/garments/man-shirt.png'
    },
    {
      id: '4',
      name: 'Black Formal Shirt',
      image: '/garments/women-dress.png'
    },
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
              {/* Removed: <p className="text-white/80 text-xs capitalize">{item.category}</p> */}
            </div>
            {selectedClothing?.id === item.id && (
              <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Garment Settings Section (Dropdown) */}
      <div className="bg-white/10 rounded-lg mt-6 border border-blue-200">
        <button
          type="button"
          className="w-full flex items-center justify-between px-5 py-4 focus:outline-none text-blue-900 font-semibold text-base hover:bg-blue-50 transition-colors"
          onClick={() => setShowSettings((v) => !v)}
        >
          <span>Garment Settings</span>
          {showSettings ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        {showSettings && (
          <div className="px-5 pb-5 pt-2">
            {/* Photo Type Option */}
            <div className="mb-6">
              <label className="block text-blue-800 font-semibold mb-2">Photo Type</label>
              <div className="flex flex-col gap-3">
                <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${photoType === 'auto' ? 'border-blue-400 bg-blue-50' : 'border-blue-100 bg-white'}` }>
                  <input type="radio" name="photoType" value="auto" checked={photoType === 'auto'} onChange={() => setPhotoType('auto')} className="mt-1" />
                  <div>
                    <div className="font-medium text-blue-900">Auto</div>
                    <div className="text-xs text-blue-600">Let the API determine the photo type</div>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${photoType === 'flat-lay' ? 'border-blue-400 bg-blue-50' : 'border-blue-100 bg-white'}` }>
                  <input type="radio" name="photoType" value="flat-lay" checked={photoType === 'flat-lay'} onChange={() => setPhotoType('flat-lay')} className="mt-1" />
                  <div>
                    <div className="font-medium text-blue-900">Flat-Lay</div>
                    <div className="text-xs text-blue-600">Garment photographed flat without a model</div>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${photoType === 'model' ? 'border-blue-400 bg-blue-50' : 'border-blue-100 bg-white'}` }>
                  <input type="radio" name="photoType" value="model" checked={photoType === 'model'} onChange={() => setPhotoType('model')} className="mt-1" />
                  <div>
                    <div className="font-medium text-blue-900">Model</div>
                    <div className="text-xs text-blue-600">Garment worn by a model</div>
                  </div>
                </label>
              </div>
            </div>
            {/* Category Option */}
            <div>
              <label className="block text-blue-800 font-semibold mb-2">Category</label>
              <div className="flex gap-4">
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${category === 'auto' ? 'bg-blue-100 text-blue-900 border border-blue-400' : 'bg-white text-blue-700 border border-blue-100'}` }>
                  <input type="radio" name="category" value="auto" checked={category === 'auto'} onChange={() => setCategory('auto')} className="accent-blue-500" />
                  Auto
                </label>
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${category === 'tops' ? 'bg-blue-100 text-blue-900 border border-blue-400' : 'bg-white text-blue-700 border border-blue-100'}` }>
                  <input type="radio" name="category" value="tops" checked={category === 'tops'} onChange={() => setCategory('tops')} className="accent-blue-500" />
                  Tops
                </label>
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${category === 'bottoms' ? 'bg-blue-100 text-blue-900 border border-blue-400' : 'bg-white text-blue-700 border border-blue-100'}` }>
                  <input type="radio" name="category" value="bottoms" checked={category === 'bottoms'} onChange={() => setCategory('bottoms')} className="accent-blue-500" />
                  Bottoms
                </label>
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${category === 'one-pieces' ? 'bg-blue-100 text-blue-900 border border-blue-400' : 'bg-white text-blue-700 border border-blue-100'}` }>
                  <input type="radio" name="category" value="one-pieces" checked={category === 'one-pieces'} onChange={() => setCategory('one-pieces')} className="accent-blue-500" />
                  One-pieces
                </label>
              </div>
            </div>
          </div>
        )}
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

      {/* Next Button */}
      {selectedClothing && (
        <button
          onClick={() => {
            onOptionsChange({ photoType, category });
            onNext();
          }}
          className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
        >
          Next
        </button>
      )}
    </div>
  );
};

export default ClothSelector;