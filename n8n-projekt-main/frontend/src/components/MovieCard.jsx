import { motion } from "framer-motion";
import {
  X,
  Star,
  Heart,
  Play,
  Tv,
  Film,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";

const MovieCard = ({ movie, isLoading, onClose, onAddFavorite, isFavorite }) => {
  const getProviderIcon = (icon) => {
    switch (icon) {
      case "play": return <Play className="w-4 h-4" />;
      case "tv": return <Tv className="w-4 h-4" />;
      case "film": return <Film className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-[57px] bottom-0 w-full sm:w-[400px] lg:w-[420px] glass border-l border-white/5 z-30 overflow-hidden"
      data-testid="movie-card-panel"
    >
      {/* Close button */}
      <Button
        data-testid="close-movie-card"
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70"
      >
        <X className="w-5 h-5" />
      </Button>

      <ScrollArea className="h-full">
        {isLoading || !movie ? (
          /* Loading state */
          <div className="p-6 space-y-4">
            <Skeleton className="w-full h-[200px] rounded-xl" />
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-1/2 h-4" />
            <Skeleton className="w-full h-20" />
            <Skeleton className="w-full h-32" />
          </div>
        ) : (
          /* Content */
          <div className="pb-8">
            {/* Poster */}
            <div className="relative">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={movie.backdrop || movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>
              
              {/* Poster thumbnail */}
              <div className="absolute bottom-4 left-6">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-20 h-28 object-cover rounded-lg border border-white/20 shadow-deep"
                />
              </div>
            </div>

            <div className="px-6 pt-4">
              {/* Title */}
              <h2 className="font-heading text-2xl font-bold mb-1">
                {movie.title_ru || movie.title}
                <span className="text-neutral-400 font-body font-normal ml-3 text-lg">
                  {movie.year}
                </span>
              </h2>
              
              {movie.title_ru && movie.title !== movie.title_ru && (
                <p className="text-neutral-400 text-sm mb-4">{movie.title}</p>
              )}

              {/* Description */}
              <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                {movie.description_ru || movie.description}
              </p>

              {/* Why recommended */}
              <div className="mb-6">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                  Почему он мне рекомендован:
                </h3>
                <ul className="space-y-2">
                  {movie.why_recommended?.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-200">
                      <span className="text-primary mt-1">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {Math.round(movie.rating * 10)}%
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(movie.rating / 2)
                            ? "text-primary fill-primary"
                            : "text-neutral-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Watch buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                {movie.watch_providers?.map((provider, i) => (
                  <a
                    key={i}
                    href={provider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-black font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    {getProviderIcon(provider.icon)}
                    Смотреть
                  </a>
                ))}
                
                <Button
                  data-testid="add-favorite-btn"
                  variant="outline"
                  onClick={() => onAddFavorite(movie.id)}
                  className={`rounded-full ${
                    isFavorite 
                      ? "bg-primary/20 border-primary text-primary" 
                      : "border-white/20 text-white"
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isFavorite ? "fill-primary" : ""}`} />
                  {isFavorite ? "В избранном" : "В избранное"}
                </Button>
              </div>

              {/* Reviews */}
              {movie.reviews && movie.reviews.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4">
                    Отзывы
                  </h3>
                  <div className="space-y-4">
                    {movie.reviews.map((review, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= review.rating
                                    ? "text-primary fill-primary"
                                    : "text-neutral-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-neutral-500">{review.date}</span>
                        </div>
                        <p className="text-sm text-neutral-300">{review.text}</p>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-neutral-400 hover:text-white"
                  >
                    Смотреть все отзывы
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};

export default MovieCard;
