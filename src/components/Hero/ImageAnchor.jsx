
export const ImageAnchor = ({ currentMonth }) => {
  return (
    <div className="relative min-h-[280px] overflow-hidden sm:min-h-[320px] md:min-h-[360px] lg:h-full lg:min-h-full">
      <img
        src={`https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80`}
        className="absolute inset-0 w-full h-full object-cover"
        alt="Calendar Hero"
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      
      <div className="absolute bottom-8 left-8">
        <h1 className="text-white m-0 text-5xl font-black uppercase tracking-tighter leading-none opacity-90">
          {currentMonth}
        </h1>
        <div className="w-12 h-1 bg-[var(--accent)] mt-4 rounded-full" />
      </div>
    </div>
  );
};
