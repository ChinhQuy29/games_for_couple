import { INGREDIENTS, RECIPES, isPlate, type Held, type Item, type RecipeId } from '../shared';

/** An ingredient with little badges for what's been done to it. */
export function ItemIcon({ item, size = 'text-3xl' }: { item: Pick<Item, 'ing' | 'chopped' | 'cooked' | 'burnt'>; size?: string }) {
  return (
    <span className={`relative inline-flex ${size} leading-none`} title={describe(item)}>
      <span style={item.burnt ? { filter: 'grayscale(1) brightness(0.35)' } : undefined}>{INGREDIENTS[item.ing].emoji}</span>
      <span className="absolute -bottom-1 -right-2 flex text-[0.45em]">
        {item.chopped && <span>🔪</span>}
        {item.cooked && !item.burnt && <span>🔥</span>}
        {item.burnt && <span>💨</span>}
      </span>
    </span>
  );
}

export function HeldIcon({ held, size = 'text-3xl' }: { held: Held | null; size?: string }) {
  if (!held) return null;
  if (!isPlate(held)) return <ItemIcon item={held} size={size} />;
  return (
    <span className={`relative inline-flex items-center justify-center ${size} leading-none`} title="Plate">
      <span>🍽️</span>
      {held.items.length > 0 && (
        <span className="absolute inset-0 flex flex-wrap items-center justify-center gap-0 text-[0.42em]">
          {held.items.map((i) => (
            <ItemIcon key={i.id} item={i} size="text-[1em]" />
          ))}
        </span>
      )}
    </span>
  );
}

export function describe(i: Pick<Item, 'ing' | 'chopped' | 'cooked' | 'burnt'>): string {
  if (i.burnt) return `Burnt ${INGREDIENTS[i.ing].name.toLowerCase()}`;
  return [i.chopped && 'chopped', i.cooked && 'cooked', INGREDIENTS[i.ing].name.toLowerCase()].filter(Boolean).join(' ');
}

/** A recipe's parts as icons, e.g. 🍅🔪 🧅🔪🔥. */
export function RecipeParts({ recipe }: { recipe: RecipeId }) {
  return (
    <span className="flex flex-wrap gap-2">
      {RECIPES[recipe].parts.map((p) => {
        const [ing, ...steps] = p.split('+');
        return (
          <ItemIcon
            key={p}
            item={{ ing: ing as Item['ing'], chopped: steps.includes('chop'), cooked: steps.includes('cook'), burnt: false }}
            size="text-2xl"
          />
        );
      })}
    </span>
  );
}
