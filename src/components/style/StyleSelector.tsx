

// 风格配置 - 与后端 prompt_patterns.json 保持同步
export const STYLE_PATTERNS = {
  ocean_kawaii: {
    name: '海洋风少女系',
    emoji: '🐚',
    keywords: ['ocean', 'kawaii', 'coastal', 'beach'],
    colors: ['mint', 'ocean blue', 'pearl white', 'pastel pink'],
    description: '贝壳、海星、珍珠元素，马卡龙配色',
  },
  bohemian: {
    name: '波西米亚民族风',
    emoji: '🌿',
    keywords: ['bohemian', 'ethnic', 'handcrafted'],
    colors: ['earth tones', 'terracotta', 'cream', 'amber'],
    description: '流苏、编织绳、天然石，大地色系',
  },
  bohemian_natural: {
    name: '波西米亚自然系',
    emoji: '🦋',
    keywords: ['natural', 'organic', 'handwoven'],
    colors: ['sage green', 'cream', 'brown', 'beige'],
    description: '天然石蝴蝶、编织流苏、自然色调',
  },
  ocean_shell: {
    name: '海洋贝壳系',
    emoji: '🐚',
    keywords: ['shell', 'coastal', 'romantic'],
    colors: ['coral pink', 'mint', 'pearl white'],
    description: '天然贝壳、扇贝、海星装饰',
  },
  candy_playful: {
    name: '糖果色童趣系',
    emoji: '🍬',
    keywords: ['candy', 'playful', 'colorful'],
    colors: ['candy pink', 'yellow', 'rainbow'],
    description: '彩色珠子、毛线球、彩虹配色',
  },
  dreamy_star: {
    name: '梦幻星空系',
    emoji: '⭐',
    keywords: ['starry', 'celestial', 'dreamy'],
    colors: ['sky blue', 'gold', 'soft pink'],
    description: '星星月亮吊坠、简约串珠',
  },
  minimalist: {
    name: '简约现代风',
    emoji: '◆',
    keywords: ['minimalist', 'modern', 'geometric'],
    colors: ['gold', 'silver', 'black', 'white'],
    description: '几何形状、金属元素、单色调',
  },
  vintage_elegant: {
    name: '复古典雅风',
    emoji: '👑',
    keywords: ['vintage', 'elegant', 'classic'],
    colors: ['antique gold', 'burgundy', 'ivory'],
    description: '巴洛克珍珠、琥珀、古金色',
  },
} as const;

export type StyleKey = keyof typeof STYLE_PATTERNS;

interface StyleSelectorProps {
  selectedStyle?: StyleKey | null;
  onSelect: (style: StyleKey) => void;
  compact?: boolean;
  showDescription?: boolean;
}

export function StyleSelector({
  selectedStyle,
  onSelect,
  compact = false,
  showDescription = true,
}: StyleSelectorProps) {
  const styles = Object.entries(STYLE_PATTERNS) as [StyleKey, typeof STYLE_PATTERNS[StyleKey]][];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {styles.map(([key, style]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`
              px-2.5 py-1 rounded-full text-xs font-medium transition-all
              ${selectedStyle === key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {style.emoji} {style.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {styles.map(([key, style]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`
            p-3 rounded-xl text-left transition-all
            ${selectedStyle === key
              ? 'bg-primary-50 border-2 border-primary-400 shadow-sm'
              : 'bg-white/50 border border-gray-200 hover:border-gray-300 hover:bg-white/80'
            }
          `}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{style.emoji}</span>
            <span className="text-sm font-medium text-gray-700">{style.name}</span>
          </div>
          {showDescription && (
            <p className="text-xs text-gray-500 leading-relaxed">{style.description}</p>
          )}
          <div className="flex gap-1 mt-2">
            {style.colors.slice(0, 3).map((color, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded"
              >
                {color}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

// 根据风格标签推断风格类型
export function detectStyleFromTags(tags: string[]): StyleKey | null {
  const tagText = tags.join(' ').toLowerCase();

  for (const [key, style] of Object.entries(STYLE_PATTERNS)) {
    for (const keyword of style.keywords) {
      if (tagText.includes(keyword)) {
        return key as StyleKey;
      }
    }
  }

  // 中文关键词匹配
  const chineseMapping: Record<string, StyleKey> = {
    '海洋': 'ocean_kawaii',
    '贝壳': 'ocean_shell',
    '少女': 'ocean_kawaii',
    '波西米亚': 'bohemian',
    '民族': 'bohemian',
    '自然': 'bohemian_natural',
    '蝴蝶': 'bohemian_natural',
    '糖果': 'candy_playful',
    '童趣': 'candy_playful',
    '彩虹': 'candy_playful',
    '星空': 'dreamy_star',
    '梦幻': 'dreamy_star',
    '简约': 'minimalist',
    '现代': 'minimalist',
    '复古': 'vintage_elegant',
    '典雅': 'vintage_elegant',
  };

  for (const [keyword, styleKey] of Object.entries(chineseMapping)) {
    if (tagText.includes(keyword)) {
      return styleKey;
    }
  }

  return null;
}

// 获取风格信息
export function getStyleInfo(styleKey: StyleKey) {
  return STYLE_PATTERNS[styleKey];
}
