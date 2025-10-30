import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API, { resolveAssetUrl } from "../../api";
import { getActiveBanners } from "../../data/banners";
import { getActiveCombos } from "../../data/combos";

// import { getShowtimesByMovie } from "../../data/showtimes";

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const navigate = useNavigate();

  const [allMovies, setAllMovies] = useState([]);
  const [hotMovies, setHotMovies] = useState([]);
  const [showingMovies, setShowingMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const banners = getActiveBanners();
  const [combos, setCombos] = useState([]);

  useEffect(() => {
    // Kiểm tra authentication
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      // Parse user data nếu đã đăng nhập
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.clear();
      }
    }

    setLoading(false);
    // fake load notif count (placeholder): read from localStorage or default 0
    try {
      const n = Number(localStorage.getItem("notifCount") || 0);
      setNotifCount(Number.isFinite(n) ? n : 0);
    } catch (_) {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/movies");
        const movies = res.data.movies || [];
        setAllMovies(movies);
        setHotMovies(movies.filter((m) => m.isHot));
        setShowingMovies(movies.filter((m) => m.status === "showing"));
        setComingSoonMovies(movies.filter((m) => m.status === "coming_soon"));
      } catch (e) {
        console.error("Load movies failed", e);
      }
    })();
  }, []);

  // Load combos from backend
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/combos");
        const fromApi = res.data.combos || [];
        if (fromApi.length > 0) setCombos(fromApi);
        else setCombos(getActiveCombos());
      } catch (e) {
        console.error("Load combos failed", e);
        setCombos(getActiveCombos());
      }
    })();
  }, []);

  const searchResults =
    (searchQuery || "").trim().length === 0
      ? []
      : allMovies
          .filter((m) => {
            const q = searchQuery.toLowerCase();
            return (
              (m.title || "").toLowerCase().includes(q) ||
              (m.director || "").toLowerCase().includes(q) ||
              (Array.isArray(m.cast) &&
                m.cast.some((a) => (a || "").toLowerCase().includes(q))) ||
              (Array.isArray(m.genre) &&
                m.genre.some((g) => (g || "").toLowerCase().includes(q)))
            );
          })
          .slice(0, 8);

  // Banner auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // const handleBookTicket = (movie, showtime) => {
  //   if (!user) {
  //     navigate("/login");
  //     return;
  //   }
  //   // TODO: Implement booking logic
  //   console.log("Booking ticket for:", movie.title, showtime);
  // };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // const handleGoToAdmin = () => {
  //   navigate("/admin");
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="meteors-container">
        <div
          className="meteor"
          style={{ left: "10%", animationDelay: "0s", animationDuration: "3s" }}
        ></div>
        <div
          className="meteor"
          style={{ left: "20%", animationDelay: "1s", animationDuration: "4s" }}
        ></div>
        <div
          className="meteor"
          style={{
            left: "30%",
            animationDelay: "2s",
            animationDuration: "3.5s",
          }}
        ></div>
        <div
          className="meteor"
          style={{
            left: "40%",
            animationDelay: "0.5s",
            animationDuration: "4.5s",
          }}
        ></div>
        <div
          className="meteor"
          style={{
            left: "50%",
            animationDelay: "1.5s",
            animationDuration: "3.2s",
          }}
        ></div>
        <div
          className="meteor"
          style={{
            left: "60%",
            animationDelay: "2.5s",
            animationDuration: "4.2s",
          }}
        ></div>
        <div
          className="meteor"
          style={{
            left: "70%",
            animationDelay: "0.8s",
            animationDuration: "3.8s",
          }}
        ></div>
        <div
          className="meteor"
          style={{
            left: "80%",
            animationDelay: "1.8s",
            animationDuration: "4.1s",
          }}
        ></div>
        <div
          className="meteor"
          style={{
            left: "90%",
            animationDelay: "2.8s",
            animationDuration: "3.6s",
          }}
        ></div>
      </div>

      {/* Animated Grid Background */}
      <div className="animated-grid"></div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full animate-float"></div>
      <div
        className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full animate-float"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-32 left-1/3 w-28 h-28 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-white">
              <h1 className="text-4xl font-bold animate-gradient-x bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                CINEMA HOME
              </h1>
              <p className="text-gray-300 mt-2">
                Trải nghiệm điện ảnh tuyệt vời
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Admin Dashboard Button - chỉ hiển thị cho admin */}
              {user &&
                (user.role === "admin" || user.role === "superadmin") && (
                  <button
                    type="button"
                    onClick={() => navigate("/admin")}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white hover:from-orange-600 hover:to-red-600 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Về Dashboard
                  </button>
                )}

              {/* Search */}
              <div className="relative w-72 hidden md:block">
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder="Tìm phim, đạo diễn, diễn viên..."
                  className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none"
                />
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-30 mt-2 w-full bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    {searchResults.map((m) => (
                      <button
                        key={m.movieId}
                        onMouseDown={() => navigate(`/movies/${m.movieId}`)}
                        className="w-full text-left px-4 py-3 hover:bg-white/10 text-white flex items-center gap-3"
                      >
                        <img
                          src={resolveAssetUrl(m.poster)}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "https://via.placeholder.com/80x112?text=No+Img";
                          }}
                          alt={m.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="font-semibold leading-5 line-clamp-1">
                            {m.title}
                          </div>
                          <div className="text-xs text-gray-300 line-clamp-1">
                            {(m.genre || []).join(", ")}
                          </div>
                        </div>
                      </button>
                    ))}
                    {searchResults.length === 8 && (
                      <div className="px-4 py-2 text-xs text-gray-400">
                        Hiển thị 8 kết quả đầu
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notification bell */}
              <button
                className="relative w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 text-white"
                title="Thông báo"
                onClick={() => navigate("/notifications")}
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {notifCount}
                  </span>
                )}
              </button>
              {user ? (
                <>
                  <div className="text-white text-right">
                    <p className="text-sm text-gray-400">Xin chào,</p>
                    <p className="font-semibold">{user.fullName}</p>
                  </div>
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-10 h-10 rounded-full overflow-hidden border border-white/30 hover:scale-105 transition-transform"
                    title="Quản lý hồ sơ"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.fullName || "U"
                        )}&background=8B5CF6&color=fff`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 hover:bg-red-500/30 transition-all duration-300 hover:scale-105"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate("/login")}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => navigate("/register")}
                    className="px-6 py-2 bg-white/10 border border-white/30 rounded-xl text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    Đăng ký
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Animated Banner Carousel */}
        <div className="px-4 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
              {/* Banner Container */}
              <div className="relative w-full h-full">
                {banners.map((banner, index) => (
                  <div
                    key={banner.bannerId}
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
                      index === currentBannerIndex
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0"
                    }`}
                    style={{
                      backgroundImage: `url(${banner.image})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center">
                      <div className="px-8 max-w-2xl">
                        <h2 className="text-4xl font-bold text-white mb-4 animate-fade-in-up">
                          {banner.title}
                        </h2>
                        <p
                          className="text-xl text-gray-200 mb-6 animate-fade-in-up"
                          style={{ animationDelay: "0.2s" }}
                        >
                          {banner.subtitle}
                        </p>
                        <button
                          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 animate-fade-in-up"
                          style={{ animationDelay: "0.4s" }}
                        >
                          {banner.buttonText || "Khám phá ngay"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentBannerIndex
                        ? "bg-white scale-125"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Phim Hot */}
        <div className="px-4 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <svg
                  className="w-8 h-8 mr-3 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Phim Hot
              </h2>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                Xem tất cả →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {hotMovies.map((movie) => (
                <div
                  key={movie.movieId}
                  className="group bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={resolveAssetUrl(movie.poster)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://via.placeholder.com/300x450?text=No+Image";
                      }}
                      alt={movie.title}
                      className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                        HOT
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                        {movie.rating}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <button
                          onClick={() => navigate(`/movies/${movie.movieId}`)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                      {movie.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                      {movie.duration} phút
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {movie.genre.slice(0, 2).map((g, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-yellow-400 text-sm">★★★★★</div>
                      <div className="text-white font-semibold">
                        {formatPrice(120000)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phim đang chiếu */}
        <div className="px-4 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <svg
                  className="w-8 h-8 mr-3 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Phim đang chiếu
              </h2>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                Xem tất cả →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {showingMovies.map((movie) => (
                <div
                  key={movie.movieId}
                  className="group bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={resolveAssetUrl(movie.poster)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://via.placeholder.com/300x450?text=No+Image";
                      }}
                      alt={movie.title}
                      className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                        ĐANG CHIẾU
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                        {movie.rating}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <button
                          onClick={() => navigate(`/movies/${movie.movieId}`)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                      {movie.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                      {movie.duration} phút
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {movie.genre.slice(0, 2).map((g, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-yellow-400 text-sm">★★★★★</div>
                      <div className="text-white font-semibold">
                        {formatPrice(120000)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phim sắp chiếu */}
        <div className="px-4 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <svg
                  className="w-8 h-8 mr-3 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Sắp chiếu
              </h2>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                Xem tất cả →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoonMovies.map((movie) => (
                <div
                  key={movie.movieId}
                  className="group bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={resolveAssetUrl(movie.poster)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://via.placeholder.com/300x450?text=No+Image";
                      }}
                      alt={movie.title}
                      className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                        SẮP CHIẾU
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                        {movie.rating}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2">
                      {movie.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                      {movie.duration} phút
                    </p>
                    <p className="text-gray-400 text-sm mb-3">
                      Khởi chiếu:{" "}
                      {new Date(movie.releaseDate).toLocaleDateString("vi-VN")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {movie.genre.slice(0, 2).map((g, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Combo bắp nước */}
        <div className="px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <svg
                  className="w-8 h-8 mr-3 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Combo bắp nước
              </h2>
              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                Xem tất cả →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {combos.map((combo) => (
                <div
                  key={combo.comboId}
                  className="group bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={combo.image}
                      alt={combo.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                        -
                        {Math.round(
                          (1 - combo.price / combo.originalPrice) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2">
                      {combo.name}
                    </h3>
                    <p className="text-gray-300 text-sm mb-3">
                      {combo.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-bold text-lg">
                          {formatPrice(combo.price)}
                        </span>
                        <span className="text-gray-400 text-sm line-through">
                          {formatPrice(combo.originalPrice)}
                        </span>
                      </div>
                      <button
                        onClick={() => !user && navigate("/login")}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                          user
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
                            : "bg-gray-500/20 border border-gray-500/50 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!user}
                      >
                        {user ? "Mua ngay" : "Cần đăng nhập"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
