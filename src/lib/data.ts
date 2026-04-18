export interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  category: string
  rating: number
  reviews: number
  badge?: 'hot' | 'new' | 'sale'
  gradient: string
  emoji: string
}

export interface Category {
  id: number
  name: string
  slug: string
  count: number
  emoji: string
  gradient: string
}

export interface Testimonial {
  id: number
  name: string
  location: string
  rating: number
  text: string
  initials: string
  color: string
}

export interface Feature {
  id: number
  emoji: string
  title: string
  description: string
  bg: string
  text: string
}

export const featuredProducts: Product[] = [
  {
    id: 1, name: "Macramé Wall Hanging", price: 45, originalPrice: 60,
    category: "Wall Art", rating: 4.8, reviews: 124, badge: 'hot',
    gradient: "from-orange-100 via-amber-50 to-yellow-100", emoji: "🧵",
  },
  {
    id: 2, name: "Handwoven Rattan Lamp", price: 89,
    category: "Lamps & Candles", rating: 4.9, reviews: 87, badge: 'new',
    gradient: "from-amber-100 via-yellow-50 to-orange-50", emoji: "🪔",
  },
  {
    id: 3, name: "Gemstone Bead Necklace", price: 32, originalPrice: 48,
    category: "Jewelry", rating: 4.7, reviews: 203, badge: 'sale',
    gradient: "from-purple-100 via-pink-50 to-rose-100", emoji: "📿",
  },
  {
    id: 4, name: "Crochet Market Tote", price: 38,
    category: "Crochet & Knitting", rating: 4.8, reviews: 156, badge: 'hot',
    gradient: "from-teal-100 via-emerald-50 to-green-100", emoji: "👜",
  },
  {
    id: 5, name: "Abstract Canvas Art", price: 120,
    category: "Art & Paintings", rating: 5.0, reviews: 34, badge: 'new',
    gradient: "from-blue-100 via-indigo-50 to-violet-100", emoji: "🎨",
  },
  {
    id: 6, name: "Silver Leaf Earrings", price: 28,
    category: "Jewelry", rating: 4.6, reviews: 89,
    gradient: "from-rose-100 via-pink-50 to-fuchsia-100", emoji: "✨",
  },
  {
    id: 7, name: "Alpaca Knit Sweater", price: 95,
    category: "Clothing", rating: 4.9, reviews: 67,
    gradient: "from-stone-100 via-amber-50 to-orange-100", emoji: "🧶",
  },
  {
    id: 8, name: "Soy Wax Candle Set", price: 24, originalPrice: 32,
    category: "Lamps & Candles", rating: 4.7, reviews: 312, badge: 'hot',
    gradient: "from-yellow-100 via-amber-50 to-orange-50", emoji: "🕯️",
  },
]

export const trendingProducts: Product[] = [
  {
    id: 9, name: "Dried Flower Wreath", price: 55,
    category: "Wall Art", rating: 4.8, reviews: 45, badge: 'new',
    gradient: "from-pink-100 via-rose-50 to-red-100", emoji: "🌸",
  },
  {
    id: 10, name: "Hand-dyed Silk Scarf", price: 42,
    category: "Clothing", rating: 4.7, reviews: 78,
    gradient: "from-violet-100 via-purple-50 to-indigo-100", emoji: "🧣",
  },
  {
    id: 11, name: "Ceramic Ring Dish", price: 18,
    category: "Art & Crafts", rating: 4.9, reviews: 134, badge: 'hot',
    gradient: "from-cyan-100 via-sky-50 to-blue-100", emoji: "🏺",
  },
  {
    id: 12, name: "Linen Drawstring Bag", price: 29,
    category: "Crochet & Knitting", rating: 4.6, reviews: 56,
    gradient: "from-lime-100 via-green-50 to-emerald-100", emoji: "🎒",
  },
]

export const categories: Category[] = [
  { id: 1, name: "Wall Art & Hangings", slug: "wall-art", count: 48, emoji: "🖼️", gradient: "from-orange-50 to-amber-100" },
  { id: 2, name: "Jewelry & Accessories", slug: "jewelry", count: 125, emoji: "💎", gradient: "from-purple-50 to-pink-100" },
  { id: 3, name: "Crochet & Knitting", slug: "crochet", count: 83, emoji: "🧶", gradient: "from-teal-50 to-emerald-100" },
  { id: 4, name: "Art & Paintings", slug: "paintings", count: 62, emoji: "🎨", gradient: "from-blue-50 to-indigo-100" },
  { id: 5, name: "Clothing", slug: "clothing", count: 37, emoji: "👗", gradient: "from-rose-50 to-pink-100" },
  { id: 6, name: "Lamps & Candles", slug: "lamps", count: 54, emoji: "🕯️", gradient: "from-yellow-50 to-amber-100" },
]

export const testimonials: Testimonial[] = [
  {
    id: 1, name: "Sarah Mitchell", location: "New York, USA", rating: 5,
    text: "The macramé wall hanging I ordered is absolutely stunning! The craftsmanship is impeccable and the seller was incredibly responsive. Arrived beautifully packaged and even more gorgeous in person.",
    initials: "SM", color: "bg-orange-200 text-orange-800",
  },
  {
    id: 2, name: "James Thompson", location: "London, UK", rating: 5,
    text: "I've bought jewelry from many places, but ArtisanNest pieces are truly one-of-a-kind. The beaded necklace has become my most-asked-about accessory. Worth every single penny!",
    initials: "JT", color: "bg-purple-200 text-purple-800",
  },
  {
    id: 3, name: "Priya Krishnamurthy", location: "Mumbai, India", rating: 5,
    text: "The crochet tote bag exceeded all expectations. The quality of the yarn, the tightness of the weave — it's a true work of art. I've already ordered two more as gifts for friends!",
    initials: "PK", color: "bg-teal-200 text-teal-800",
  },
]

export const features: Feature[] = [
  {
    id: 1, emoji: "✋", title: "Handcrafted with Love",
    description: "Every item is uniquely made by skilled artisans, ensuring quality and authenticity in each piece you receive.",
    bg: "bg-orange-100", text: "text-orange-600",
  },
  {
    id: 2, emoji: "🔒", title: "Secure Payments",
    description: "Shop with confidence. SSL encryption and multiple secure payment options protect your every transaction.",
    bg: "bg-blue-100", text: "text-blue-600",
  },
  {
    id: 3, emoji: "🚚", title: "Fast Delivery",
    description: "Each order is carefully packaged by the artisan and delivered directly to your doorstep, worldwide.",
    bg: "bg-teal-100", text: "text-teal-600",
  },
  {
    id: 4, emoji: "🎨", title: "Support Local Artists",
    description: "Every purchase directly supports independent creators. You're funding art and keeping handmade traditions alive.",
    bg: "bg-purple-100", text: "text-purple-600",
  },
]

export const stats = [
  { value: "2,400+", label: "Products" },
  { value: "850+", label: "Artisans" },
  { value: "12K+", label: "Customers" },
  { value: "4.9★", label: "Avg. Rating" },
]
