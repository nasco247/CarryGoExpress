import { Calendar, User, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const posts = [
  {
    id: 1,
    title: 'The Future of Home Entertainment: Hisense 2024 Lineup',
    excerpt: 'Discover what makes the new Hisense ULED X and Laser TV models the ultimate choice for your home cinema experience.',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800',
    date: 'Oct 15, 2024',
    author: 'CarryGoExpress Editorial',
    category: 'News'
  },
  {
    id: 2,
    title: 'How to Choose the Right AC for Your Space',
    excerpt: 'A comprehensive guide to understanding BTUs, Inverter technology, and finding the perfect Hisense air conditioner for your room size.',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800',
    date: 'Sep 28, 2024',
    author: 'Sarah Johnson',
    category: 'Guides'
  },
  {
    id: 3,
    title: 'Maximizing Your Smart Fridge Features',
    excerpt: 'Learn how to use the advanced features of your Hisense smart refrigerator to reduce food waste and save energy.',
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800',
    date: 'Sep 10, 2024',
    author: 'Michael Ade',
    category: 'Tips & Tricks'
  }
]

export default function Blog() {
  return (
    <div className="pt-20 min-h-screen bg-veltrix-black text-veltrix-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">CarryGo<span className="text-veltrix-blue">Express</span> Blog</h1>
          <p className="text-lg">Stay updated with the latest tech news, buying guides, and tips to get the most out of your home electronics & appliances.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <article key={post.id} className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-3xl overflow-hidden group hover:border-veltrix-blue transition-colors flex flex-col">
              <div className="aspect-video overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-4 text-xs text-veltrix-gray-500">
                  <span className="px-2.5 py-1 bg-veltrix-gray-900 text-veltrix-gray-300 rounded-full font-medium">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {post.date}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-veltrix-blue transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm leading-relaxed mb-6 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-veltrix-gray-800">
                  <div className="flex items-center gap-2 text-xs">
                    <User className="w-4 h-4 text-veltrix-blue" />
                    <span className="font-medium text-white">{post.author}</span>
                  </div>
                  <Link to="#" className="text-sm font-semibold text-veltrix-blue hover:text-white transition-colors flex items-center gap-1">
                    Read More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button className="px-8 py-3 bg-veltrix-gray-900 text-white font-semibold rounded-xl hover:bg-veltrix-blue hover:text-black transition-all">
            Load More Articles
          </button>
        </div>
      </div>
    </div>
  )
}
