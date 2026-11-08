import { Badge } from '@/components/ui/badge';
import type { PostCategory } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: PostCategory;
  className?: string;
}

// Define colors for categories - can be expanded
const categoryColors: Record<PostCategory, string> = {
  '商品情報': 'bg-blue-100 text-blue-700 border-blue-300',
  '発注': 'bg-green-100 text-green-700 border-green-300',
  'オペレーション': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'iPad': 'bg-purple-100 text-purple-700 border-purple-300',
  'お知らせ': 'bg-red-100 text-red-700 border-red-300',
  'その他': 'bg-gray-100 text-gray-700 border-gray-300',
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium", 
        categoryColors[category] || categoryColors['その他'],
        className
      )}
    >
      {category}
    </Badge>
  );
}
