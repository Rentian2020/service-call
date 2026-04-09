import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, MOCK_CATEGORIES } from "../utilities/mockData";

const calcDist = (lat: number | undefined, lng: number | undefined, userLat: number, userLng: number) => {
  if (!lat || !lng) return null;
  const dLat = ((lat - userLat) * Math.PI) / 180;
  const dLng = ((lng - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => onChange(star)}
        className="transition-transform active:scale-90"
      >
        <svg className={`w-7 h-7 ${star <= value ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    ))}
  </div>
);

export const ProviderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark, providers, getOrCreateConversation, userLat, userLng, getProviderReviews, addReview, updateReview, getUserReviewForProvider } = useAppContext();
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [isEditingReview, setIsEditingReview] = useState(false);

  const provider = providers.find((p) => p.id === id);

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-6">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-bold text-gray-700 mb-1">Business not found</p>
          <p className="text-sm text-gray-400 mb-4">This listing may have been removed.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const bookmarked = isBookmarked(provider.id);
  const distance = user ? calcDist(provider.latitude, provider.longitude, userLat, userLng) : null;
  const providerReviews = getProviderReviews(provider.id);
  const userExistingReview = user ? getUserReviewForProvider(provider.id, user.uid) : undefined;

  const handleMessage = () => {
    if (!user) { navigate("/account"); return; }
    const convId = getOrCreateConversation(user.uid, provider);
    navigate(`/chat/${convId}`);
  };

  const handleRequest = () => {
    navigate("/request", { state: { providerId: provider.id } });
  };

  const handleSubmitReview = () => {
    if (!user) { navigate("/account"); return; }
    if (!reviewComment.trim()) {
      setReviewError("Please write a comment before submitting.");
      return;
    }
    if (isEditingReview && userExistingReview) {
      updateReview(userExistingReview.id, { rating: reviewRating, comment: reviewComment.trim() });
    } else {
      addReview({
        providerId: provider.id,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: user.photoURL || undefined,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
    }
    setReviewSubmitted(true);
    setShowReviewForm(false);
    setIsEditingReview(false);
    setReviewComment("");
    setReviewRating(5);
    setReviewError("");
  };

  const handleOpenEditReview = () => {
    if (!userExistingReview) return;
    setReviewRating(userExistingReview.rating);
    setReviewComment(userExistingReview.comment);
    setIsEditingReview(true);
    setShowReviewForm(true);
    setReviewSubmitted(false);
  };

  const handleOpenNewReview = () => {
    setReviewRating(5);
    setReviewComment("");
    setIsEditingReview(false);
    setShowReviewForm(true);
    setReviewSubmitted(false);
  };

  const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.businessName || provider.name)}&background=7c3aed&color=fff&size=400`;

  const providerTypeLabel = provider.providerType === "individual" ? "👤 Solo Pro" : provider.providerType === "business" ? "🏢 Business" : null;
  const providerTypeColor = provider.providerType === "individual" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700";
  const isUnverified = provider.providerType === "individual" && provider.reviewCount < 20;
  const displayCategories = provider.categories && provider.categories.length > 0 ? provider.categories : [provider.category];

  return (
    <div className="page-scroll bg-gray-50">
      {/* Hero */}
      <div className="relative h-64 bg-gray-200">
        <img
          src={imgError ? fallbackImg : provider.imageUrl}
          alt={provider.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Bookmark */}
        <button
          onClick={() => toggleBookmark(provider.id)}
          className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          <svg
            className={`w-5 h-5 ${bookmarked ? "text-blue-500" : "text-gray-700"}`}
            viewBox="0 0 24 24"
            fill={bookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {/* Availability badge */}
        <div className="absolute bottom-4 left-4">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${
            provider.available ? "bg-emerald-500/90 text-white" : "bg-gray-700/80 text-gray-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${provider.available ? "bg-white pulse-dot" : "bg-gray-400"}`} />
            {provider.available ? "Available Now" : "Currently Busy"}
          </span>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-t-3xl -mt-5 relative z-10 mx-0 px-5 pt-5 pb-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-3">
            <h1 className="text-xl font-black text-gray-900">{provider.businessName || provider.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {displayCategories.map(catId => {
                const cat = MOCK_CATEGORIES ? MOCK_CATEGORIES.find((c: {id: string}) => c.id === catId) : null;
                return (
                  <span key={catId} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                    {cat ? `${cat.icon} ${cat.name}` : catId}
                  </span>
                );
              })}
              {providerTypeLabel && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${providerTypeColor}`}>
                  {providerTypeLabel}
                </span>
              )}
              {isUnverified && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600">
                  UNVERIFIED
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-blue-500 font-black text-lg">{formatCurrency(provider.inspectionFee)}</span>
            <p className="text-xs text-gray-400">inspection fee</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 py-3.5 border-y border-gray-50 flex-wrap gap-y-2">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {providerReviews.length > 0 ? (
              <>
                <span className="font-black text-gray-900 text-sm">{provider.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({providerReviews.length} review{providerReviews.length !== 1 ? "s" : ""})</span>
              </>
            ) : (
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Unrated</span>
            )}
          </div>

          {provider.location && (
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="text-sm text-gray-600">{provider.location}</span>
            </div>
          )}

          {distance !== null && (
            <span className="ml-auto bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
              {distance.toFixed(1)} mi away
            </span>
          )}
        </div>

        {/* How It Works */}
        <div className="py-4 border-b border-gray-50">
          <h3 className="text-sm font-black text-gray-900 mb-3">How It Works</h3>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 space-y-3">
            {[
              { icon: "💳", text: `Pay ${formatCurrency(provider.inspectionFee)} inspection fee to book` },
              { icon: "📍", text: "Pro visits your location to assess the job" },
              { icon: "💬", text: "Receive a custom quote for the full work" },
              { icon: "✅", text: "Accept quote & pay only on completion" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">{icon}</span>
                </div>
                <p className="text-xs text-blue-700 font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        {provider.description && (
          <div className="py-4 border-b border-gray-50">
            <h3 className="text-sm font-black text-gray-900 mb-2">About</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{provider.description}</p>
          </div>
        )}

        {/* Specialties */}
        {provider.specialties.length > 0 && (
          <div className="py-4 border-b border-gray-50">
            <h3 className="text-sm font-black text-gray-900 mb-3">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {provider.specialties.map((s) => (
                <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {(provider.phone || provider.website) && (
          <div className="py-4 border-b border-gray-50">
            <h3 className="text-sm font-black text-gray-900 mb-2">Contact</h3>
            {provider.phone && (
              <a href={`tel:${provider.phone}`} className="flex items-center gap-2 text-blue-500 text-sm font-semibold mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {provider.phone}
              </a>
            )}
            {provider.website && (
              <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 text-sm font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                {provider.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        )}

        {/* Reviews Section */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-gray-900">
              Reviews {providerReviews.length > 0 && <span className="text-gray-400 font-normal">({providerReviews.length})</span>}
            </h3>
            {user && !showReviewForm && (
              userExistingReview ? (
                <button
                  onClick={handleOpenEditReview}
                  className="text-xs font-bold text-violet-500 bg-violet-50 px-3 py-1.5 rounded-xl active:bg-violet-100 transition-colors flex items-center gap-1"
                >
                  ✏️ Edit Review
                </button>
              ) : (
                <button
                  onClick={handleOpenNewReview}
                  className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-xl active:bg-blue-100 transition-colors"
                >
                  + Write Review
                </button>
              )
            )}
          </div>

          {/* Review submitted confirmation */}
          {reviewSubmitted && (
            <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2 animate-scale-in">
              <span className="text-lg">✅</span>
              <p className="text-xs font-bold text-emerald-700">{isEditingReview ? "Review updated!" : "Your review has been posted!"}</p>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 animate-scale-in">
              <p className="text-xs font-bold text-gray-700 mb-1">{isEditingReview ? "Update Your Rating" : "Your Rating"}</p>
              <StarRating value={reviewRating} onChange={setReviewRating} />
              <p className="text-xs font-bold text-gray-700 mt-3 mb-1.5">{isEditingReview ? "Update Your Review" : "Your Review"}</p>
              <textarea
                value={reviewComment}
                onChange={(e) => { setReviewComment(e.target.value); setReviewError(""); }}
                placeholder="Share your experience with this business..."
                rows={3}
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm text-gray-700 border border-gray-200 focus:border-blue-300 focus:bg-white transition-colors resize-none"
              />
              {reviewError && <p className="text-xs text-red-500 mt-1">{reviewError}</p>}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setShowReviewForm(false); setReviewError(""); setIsEditingReview(false); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-black active:scale-[0.98] transition-transform"
                >
                  {isEditingReview ? "Update Review" : "Submit Review"}
                </button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {providerReviews.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl">
              <p className="text-3xl mb-2">⭐</p>
              <p className="text-sm font-bold text-gray-500">No reviews yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to leave a review!</p>
              {!user && (
                <button
                  onClick={() => navigate("/account")}
                  className="mt-3 text-xs font-bold text-blue-500 bg-blue-50 px-4 py-2 rounded-xl"
                >
                  Sign in to review
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {providerReviews.map((review) => (
                <div key={review.id} className={`rounded-2xl p-3.5 transition-colors ${user && review.userId === user.uid ? "bg-blue-50 border border-blue-100" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {review.userPhoto ? (
                        <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-blue-600">{review.userName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-gray-800 truncate">{review.userName}</p>
                        {user && review.userId === user.uid && (
                          <span className="text-[9px] font-black bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full">YOU</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">{review.createdAt instanceof Date ? review.createdAt.toLocaleDateString() : new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      {user && review.userId === user.uid && !showReviewForm && (
                        <button onClick={handleOpenEditReview} className="ml-1 text-[10px] text-blue-500 font-bold px-1.5 py-0.5 rounded bg-blue-50 active:bg-blue-100">Edit</button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 safe-bottom">
        {!user ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 text-center">Sign in to book or message this business</p>
            <button
              onClick={() => navigate("/account")}
              className="w-full bg-blue-500 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
            >
              Sign In to Book
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleMessage}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl text-sm active:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Message
            </button>
            <button
              onClick={handleRequest}
              disabled={!provider.available}
              className={`flex-2 flex-1 font-black py-3.5 rounded-2xl text-sm transition-all active:scale-[0.98] ${
                provider.available
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-200"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {provider.available ? `Book · ${formatCurrency(provider.inspectionFee)}` : "Currently Busy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
