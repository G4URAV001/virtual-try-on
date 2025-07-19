import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Dice5 } from 'lucide-react';

interface ProcessingOptionsProps {
  onTryOn: (options: {
    runMode: 'performance' | 'balanced' | 'quality';
    seed: string;
    modelVersion: 'v1.6' | 'v1.5';
  }) => void;
}

const getRandomSeed = () => String(Math.floor(100000 + Math.random() * 900000));

const ProcessingOptions: React.FC<ProcessingOptionsProps> = ({ onTryOn }) => {
  const [runMode, setRunMode] = useState<'performance' | 'balanced' | 'quality'>('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [seed, setSeed] = useState(getRandomSeed());
  const [modelVersion, setModelVersion] = useState<'v1.6' | 'v1.5'>('v1.6');

  const handleRandomizeSeed = () => setSeed(getRandomSeed());

  const handleTryOn = () => {
    onTryOn({ runMode, seed, modelVersion });
  };

  return (
    <div className="bg-white/10 rounded-lg p-6 border border-blue-200 max-w-md mx-auto mt-8">
      {/* Run Mode */}
      <div className="mb-6">
        <label className="block text-blue-900 font-semibold mb-3">Run Mode</label>
        <div className="flex flex-col gap-3">
          <label className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${runMode === 'performance' ? 'border-blue-500 bg-blue-50' : 'border-blue-100 bg-white'}` }>
            <input type="radio" name="runMode" value="performance" checked={runMode === 'performance'} onChange={() => setRunMode('performance')} className="mt-1" />
            <div>
              <div className="font-medium text-blue-900">Performance</div>
              <div className="text-xs text-blue-600">Faster generation with good quality</div>
            </div>
          </label>
          <label className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${runMode === 'balanced' ? 'border-blue-500 bg-blue-50' : 'border-blue-100 bg-white'}` }>
            <input type="radio" name="runMode" value="balanced" checked={runMode === 'balanced'} onChange={() => setRunMode('balanced')} className="mt-1" />
            <div>
              <div className="font-medium text-blue-900">Balanced</div>
              <div className="text-xs text-blue-600">Good balance between speed and quality</div>
            </div>
          </label>
          <label className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${runMode === 'quality' ? 'border-blue-500 bg-blue-50' : 'border-blue-100 bg-white'}` }>
            <input type="radio" name="runMode" value="quality" checked={runMode === 'quality'} onChange={() => setRunMode('quality')} className="mt-1" />
            <div>
              <div className="font-medium text-blue-900">Quality</div>
              <div className="text-xs text-blue-600">Highest quality but slower generation</div>
            </div>
          </label>
        </div>
      </div>
      {/* Show Advanced Settings Toggle */}
      <button
        type="button"
        className="w-full flex items-center justify-center py-3 mb-2 text-blue-700 font-medium hover:underline"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <span className="mr-2">⚙️</span>
          {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
          {showAdvanced ? <ChevronUp className="h-5 w-5 ml-2" /> : <ChevronDown className="h-5 w-5 ml-2" />}
        </span>
      </button>
      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="mt-4 space-y-6">
          {/* Seed */}
          <div>
            <label className="block text-blue-900 font-semibold mb-2">Seed</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={seed}
                maxLength={6}
                pattern="[0-9]{6}"
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  setSeed(val);
                }}
                className="w-24 px-2 py-1 rounded border border-blue-200 bg-white text-blue-900 font-mono text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={handleRandomizeSeed}
                className="p-2 rounded bg-blue-100 hover:bg-blue-200 border border-blue-200"
                title="Randomize Seed"
              >
                <Dice5 className="h-5 w-5 text-blue-700" />
              </button>
            </div>
          </div>
          {/* Model Version */}
          <div>
            <label className="block text-blue-900 font-semibold mb-2">Model Version</label>
            <div className="flex flex-col gap-3">
              <label className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${modelVersion === 'v1.6' ? 'border-blue-500 bg-blue-50' : 'border-blue-100 bg-white'}` }>
                <input type="radio" name="modelVersion" value="v1.6" checked={modelVersion === 'v1.6'} onChange={() => setModelVersion('v1.6')} className="mt-1" />
                <div>
                  <div className="font-medium text-blue-900">v1.6 (Latest)</div>
                  <div className="text-xs text-blue-600">Recommended production model</div>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${modelVersion === 'v1.5' ? 'border-blue-500 bg-blue-50' : 'border-blue-100 bg-white'}` }>
                <input type="radio" name="modelVersion" value="v1.5" checked={modelVersion === 'v1.5'} onChange={() => setModelVersion('v1.5')} className="mt-1" />
                <div>
                  <div className="font-medium text-blue-900">v1.5</div>
                  <div className="text-xs text-blue-600">Original model for backwards compatibility</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
      {/* Try On Button */}
      <button
        onClick={handleTryOn}
        className="w-full mt-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
      >
        Try On Virtual Outfit
      </button>
    </div>
  );
};

export default ProcessingOptions; 