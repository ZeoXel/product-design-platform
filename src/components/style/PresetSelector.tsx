import { useEffect, useState } from 'react';
import type {
  ProductType,
  StyleKey,
  ProductTypePreset,
  StylePreset,
  DesignPreset,
} from '../../types';
import { getPresets } from '../../services/api';

interface PresetSelectorProps {
  selectedProductType: ProductType;
  selectedStyle: StyleKey;
  onProductTypeChange: (type: ProductType) => void;
  onStyleChange: (style: StyleKey) => void;
  onPresetChange?: (preset: DesignPreset | null) => void;
  compact?: boolean;
  showDescription?: boolean;
}

export function PresetSelector({
  selectedProductType,
  selectedStyle,
  onProductTypeChange,
  onStyleChange,
  onPresetChange,
  compact = false,
  showDescription = true,
}: PresetSelectorProps) {
  const [productTypes, setProductTypes] = useState<ProductTypePreset[]>([]);
  const [styles, setStyles] = useState<StylePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'product' | 'style'>('product');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const data = await getPresets();
      setProductTypes(data.product_types);
      setStyles(data.styles);
      setError(null);
    } catch (err) {
      setError('加载预设失败');
      console.error('Failed to load presets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductTypeSelect = (type: ProductType) => {
    onProductTypeChange(type);
    const selectedProduct = productTypes.find(p => p.id === type);
    const selectedStyleData = styles.find(s => s.id === selectedStyle);
    if (onPresetChange && selectedProduct && selectedStyleData) {
      onPresetChange({
        product_type: selectedProduct,
        style: selectedStyleData,
      });
    }
  };

  const handleStyleSelect = (style: StyleKey) => {
    onStyleChange(style);
    const selectedProduct = productTypes.find(p => p.id === selectedProductType);
    const selectedStyleData = styles.find(s => s.id === style);
    if (onPresetChange && selectedProduct && selectedStyleData) {
      onPresetChange({
        product_type: selectedProduct,
        style: selectedStyleData,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
        <span className="ml-2 text-sm text-gray-500">加载预设...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 py-2">
        {error}
        <button
          onClick={loadPresets}
          className="ml-2 text-primary-500 hover:underline"
        >
          重试
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {/* 产品类型 - 紧凑模式 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">产品类型</label>
          <div className="flex flex-wrap gap-1.5">
            {productTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleProductTypeSelect(type.id as ProductType)}
                className={`
                  px-2.5 py-1 rounded-full text-xs font-medium transition-all
                  ${selectedProductType === type.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {type.icon} {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* 风格 - 紧凑模式 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">风格</label>
          <div className="flex flex-wrap gap-1.5">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id as StyleKey)}
                className={`
                  px-2.5 py-1 rounded-full text-xs font-medium transition-all
                  ${selectedStyle === style.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {style.icon} {style.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('product')}
          className={`
            px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${activeTab === 'product'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }
          `}
        >
          产品类型
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`
            px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${activeTab === 'style'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }
          `}
        >
          风格
        </button>
      </div>

      {/* 产品类型选择 */}
      {activeTab === 'product' && (
        <div className="grid grid-cols-2 gap-2">
          {productTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleProductTypeSelect(type.id as ProductType)}
              className={`
                p-3 rounded-xl text-left transition-all
                ${selectedProductType === type.id
                  ? 'bg-blue-50 border-2 border-blue-400 shadow-sm'
                  : 'bg-white/50 border border-gray-200 hover:border-gray-300 hover:bg-white/80'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{type.icon}</span>
                <span className="text-sm font-medium text-gray-700">{type.name}</span>
              </div>
              {showDescription && (
                <>
                  <p className="text-xs text-gray-500 mb-1.5">{type.name_en}</p>
                  <div className="flex gap-1 flex-wrap">
                    {type.typical_hardware.slice(0, 2).map((hw, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded"
                      >
                        {hw}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 风格选择 */}
      {activeTab === 'style' && (
        <div className="grid grid-cols-2 gap-2">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => handleStyleSelect(style.id as StyleKey)}
              className={`
                p-3 rounded-xl text-left transition-all
                ${selectedStyle === style.id
                  ? 'bg-primary-50 border-2 border-primary-400 shadow-sm'
                  : 'bg-white/50 border border-gray-200 hover:border-gray-300 hover:bg-white/80'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{style.icon}</span>
                <span className="text-sm font-medium text-gray-700">{style.name}</span>
              </div>
              {showDescription && (
                <>
                  <p className="text-xs text-gray-500 mb-1.5">{style.name_en}</p>
                  <div className="flex gap-1 flex-wrap">
                    {style.color_palette.primary.slice(0, 3).map((color, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 当前选择摘要 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 mb-1">当前预设</p>
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {productTypes.find(p => p.id === selectedProductType)?.icon || '📦'}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {productTypes.find(p => p.id === selectedProductType)?.name || selectedProductType}
          </span>
          <span className="text-gray-300">+</span>
          <span className="text-lg">
            {styles.find(s => s.id === selectedStyle)?.icon || '✨'}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {styles.find(s => s.id === selectedStyle)?.name || selectedStyle}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PresetSelector;
