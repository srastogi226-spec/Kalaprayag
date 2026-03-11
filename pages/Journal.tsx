
import React, { useState } from 'react';
import { StudioJournalEntry } from '../types';

interface JournalProps {
    entries: StudioJournalEntry[];
}

const Journal: React.FC<JournalProps> = ({ entries }) => {
    const [activeCategory, setActiveCategory] = useState('ALL');

    const categories = ['ALL', 'CRAFT STORIES', 'HOME & STYLE', 'GUIDES'];

    const [activeArticle, setActiveArticle] = useState<StudioJournalEntry | null>(null);

    const filteredEntries = (activeCategory === 'ALL'
        ? entries
        : entries.filter(e => e.category === activeCategory)) || [];

    const featuredEntry = entries.find(e => e.featured) || entries[0];
    const gridEntries = featuredEntry
        ? filteredEntries.filter(e => e.id !== featuredEntry.id)
        : filteredEntries;

    if (activeArticle) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-[#2C2C2C] font-sans selection:bg-[#8B735B]/20">
                <article className="max-w-4xl mx-auto px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <button
                        onClick={() => setActiveArticle(null)}
                        className="flex items-center text-[10px] uppercase tracking-[0.2em] font-bold text-[#999] hover:text-[#2C2C2C] transition-colors mb-12"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Journal
                    </button>

                    <div className="mb-12 text-center">
                        <span className="text-[10px] uppercase tracking-[0.3em] px-3 py-1 bg-[#8B735B]/10 text-[#8B735B] font-bold mb-6 inline-block">
                            {activeArticle.category}
                        </span>
                        <h1 className="text-4xl md:text-6xl serif leading-tight mb-8">
                            {activeArticle.title}
                        </h1>
                        <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest text-[#999]">
                            <span className="font-bold border-r border-[#E5E5E5] pr-6">By {activeArticle.author || 'Anonymous'}</span>
                            <span className="border-r border-[#E5E5E5] pr-6">{new Date(activeArticle.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <span>{activeArticle.readTime}</span>
                        </div>
                    </div>

                    <div className="w-full aspect-[21/9] bg-[#F5F0E8] mb-16 overflow-hidden">
                        <img src={activeArticle.image} className="w-full h-full object-cover" alt={activeArticle.title} />
                    </div>

                    <div className="prose prose-lg md:prose-xl mx-auto text-[#4A4A4A] font-light leading-relaxed mb-16">
                        {/* Splitting content by newline to render paragraphs properly */}
                        {(activeArticle.content || activeArticle.excerpt).split('\n').filter(p => p.trim() !== '').map((paragraph, i) => (
                            <p key={i} className="mb-6">{paragraph}</p>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center pt-12 border-t border-[#E5E5E5]">
                        {activeArticle.tags?.map(tag => (
                            <span key={tag} className="text-[9px] uppercase tracking-[0.2em] border border-[#E5E5E5] px-4 py-2 text-[#999] bg-white">
                                {tag}
                            </span>
                        ))}
                    </div>
                </article>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-[#2C2C2C] font-sans selection:bg-[#8B735B]/20">
            {/* 1. PAGE HEADER */}
            <header className="max-w-7xl mx-auto px-6 mb-16 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
                <span className="text-[10px] uppercase tracking-[0.5em] text-[#8B735B] font-bold mb-4 block">Journal</span>
                <h1 className="text-5xl md:text-7xl serif mb-6 leading-tight">Stories of Craft, <br className="hidden md:block" /> Heritage & Home</h1>
                <p className="text-sm uppercase tracking-widest text-[#999] font-light">Dispatches from India's artisan communities</p>
            </header>

            {/* 2. CATEGORY FILTER BAR */}
            <nav className="max-w-7xl mx-auto px-6 mb-20 border-y border-[#E5E5E5] py-6 overflow-x-auto no-scrollbar">
                <div className="flex justify-center gap-8 min-w-max mx-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`text-[10px] uppercase tracking-[0.3em] px-6 py-2 transition-all duration-300 ${activeCategory === cat
                                ? 'bg-[#2C2C2C] text-white'
                                : 'text-[#8B735B] border border-transparent hover:border-[#8B735B]'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </nav>

            {/* 3. FEATURED ARTICLE (Hero Card) */}
            {featuredEntry && activeCategory === 'ALL' && (
                <section className="max-w-[1400px] mx-auto px-6 mb-32 animate-in fade-in duration-1000 delay-300">
                    <article
                        onClick={() => setActiveArticle(featuredEntry)}
                        className="flex flex-col md:flex-row bg-white border border-[#E5E5E5] overflow-hidden group cursor-pointer"
                    >
                        {/* Left: Image */}
                        <div className="md:w-1/2 aspect-[4/5] md:aspect-auto relative overflow-hidden">
                            <img
                                src={featuredEntry.image}
                                alt={featuredEntry.title}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                        </div>
                        {/* Right: Content */}
                        <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center items-start space-y-8">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] uppercase tracking-[0.3em] px-3 py-1 bg-[#8B735B]/10 text-[#8B735B] font-bold">Featured</span>
                                <span className="text-[10px] uppercase tracking-[0.3em] text-[#999]">{featuredEntry.category}</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl serif leading-tight group-hover:text-[#8B735B] transition-colors">
                                {featuredEntry.title}
                            </h2>

                            <p className="text-lg font-light leading-relaxed text-[#666]">
                                {featuredEntry.excerpt}
                            </p>

                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#8B735B] group-hover:translate-x-2 transition-transform inline-flex items-center">
                                Read Story <svg className="w-3 h-3 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </span>

                            <div className="w-full pt-12 border-t border-[#F5F0E8] flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-bold text-[#999] mt-auto">
                                <span>By {featuredEntry.author}</span>
                                <span>{new Date(featuredEntry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </article>
                </section>
            )}

            {/* 4. ARTICLE GRID */}
            <section className="max-w-7xl mx-auto px-6 mb-32">
                <div className="flex items-center gap-6 mb-16">
                    <span className="text-[10px] uppercase tracking-[0.5em] font-bold whitespace-nowrap">All Articles</span>
                    <div className="h-px bg-[#E5E5E5] w-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-x-12 md:gap-y-20">
                    {gridEntries.map((entry, idx) => (
                        <article
                            key={entry.id}
                            onClick={() => setActiveArticle(entry)}
                            className="group cursor-pointer animate-in fade-in duration-700 flex flex-col h-full"
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            <div className="aspect-[3/2] overflow-hidden bg-[#F5F0E8] mb-8 relative flex-shrink-0">
                                <img
                                    src={entry.image}
                                    alt={entry.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>

                            <div className="space-y-4 flex-grow flex flex-col">
                                <div className="flex justify-between items-center text-[9px] uppercase tracking-[0.3em] text-[#8B735B] font-bold">
                                    <span>{entry.category}</span>
                                    <span className="text-[#999] font-light italic">{entry.readTime}</span>
                                </div>

                                <h3 className="text-2xl serif leading-snug group-hover:text-[#8B735B] transition-colors duration-300">
                                    {entry.title}
                                </h3>

                                <p className="text-sm font-light leading-relaxed text-[#666] line-clamp-3 mb-6">
                                    {entry.excerpt}
                                </p>

                                <div className="pt-6 mt-auto border-t border-[#E5E5E5] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#F5F0E8] border border-[#E5E5E5] flex items-center justify-center text-[10px] font-bold text-[#8B735B]">
                                            {entry.author?.charAt(0) || 'A'}
                                        </div>
                                        <span className="text-[9px] uppercase tracking-widest text-[#999] font-medium">{entry.author || 'Anonymous'}</span>
                                    </div>
                                    <span className="text-[9px] uppercase tracking-widest text-[#999] font-light">
                                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {filteredEntries.length === 0 && (
                    <div className="py-32 text-center">
                        <p className="serif text-2xl italic text-[#999]">No articles found in this category.</p>
                    </div>
                )}
            </section>

            {/* 5. NEWSLETTER SECTION */}
            <section className="bg-[#2C2C2C] py-32 text-center selection:bg-[#8B735B]/40">
                <div className="max-w-2xl mx-auto px-6">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-[#8B735B] font-bold mb-6 block">Newsletter</span>
                    <h2 className="text-4xl md:text-5xl serif text-white mb-6">Stories Worth Keeping</h2>
                    <p className="text-[#999] font-light leading-relaxed mb-12">New craft stories, artisan spotlights — once a month.</p>

                    <form className="max-w-md mx-auto flex flex-col md:flex-row gap-4">
                        <input
                            type="email"
                            placeholder="Your email address"
                            className="flex-1 bg-transparent border-b border-[#E5E5E5]/30 p-4 text-white text-sm focus:outline-none focus:border-[#8B735B] transition-colors placeholder:text-[#999]/30"
                        />
                        <button className="bg-[#8B735B] text-white px-10 py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-[#A68B6F] transition-all">
                            Subscribe
                        </button>
                    </form>
                    <p className="mt-6 text-[10px] uppercase tracking-widest text-[#666]">No spam. Unsubscribe anytime.</p>
                </div>
            </section>

            {/* Footer is expected to be rendered by App.tsx */}
        </div>
    );
};

export default Journal;
