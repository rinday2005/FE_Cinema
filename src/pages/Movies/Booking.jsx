import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
// nếu bạn dùng combo data frontend:
import { getActiveCombos } from "../../data/combos";

const Booking = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  // Params từ MovieDetail
  // const movieId = params.get("movieId") || "";
  const showtimeId = params.get("showtimeId") || "";
  const date = params.get("date") || "";
  const startTime = params.get("startTime") || "";
  const endTime = params.get("endTime") || "";
  const systemName = params.get("systemName") || "";
  const clusterName = params.get("clusterName") || "";
  const hallName = params.get("hallName") || "";
  const movieTitle = params.get("movieTitle") || "";
  const moviePoster = params.get("moviePoster") || "/images/default-poster.jpg";
  const seatTypeParam = params.get("seatType") || "regular";
  const seatPriceParam = Number(params.get("price")) || 0;

  // ----------------- STATE -----------------
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [combos, setCombos] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState({});
  const [lockId, setLockId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  // Mock / Real seats: bạn có thể fetch từ BE /showtimes/:showtimeId/seats
  const [seatsFromServer, setSeatsFromServer] = useState(null);
  const [showtimeData, setShowtimeData] = useState(null);

  // ----------------- MOCK SEATS -----------------
  const buildMockSeats = (
    rows = 9,
    cols = 14,
    priceBySeatType = { regular: 100000, vip: 150000 }
  ) => {
    const seats = [];
    const vipRows = [4, 5];
    const aislePositions = [2, 10];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (aislePositions.includes(c + 1)) continue;
        const seatNumber = `${String.fromCharCode(65 + r)}${c + 1}`;
        const isVipRow = vipRows.includes(r + 1);
        seats.push({
          seatNumber,
          type: isVipRow ? "vip" : "regular",
          status: "available",
          price: isVipRow ? priceBySeatType.vip : priceBySeatType.regular,
          row: r + 1,
          col: c + 1,
        });
      }
    }
    return seats;
  };

  // ----------------- LOAD COMBOS -----------------
  useEffect(() => {
    try {
      const active = getActiveCombos?.() || [];
      setCombos(active);
    } catch (err) {
      setCombos([]);
    }
  }, []);

  // ----------------- SHOWTIME DATA -----------------
  useEffect(() => {
    if (seatPriceParam > 0) {
      const regularPrice = seatPriceParam;
      const vipPrice = Math.round(regularPrice * 1.4);
      setShowtimeData({
        priceBySeatType: { regular: regularPrice, vip: vipPrice },
      });
    } else {
      setShowtimeData({ priceBySeatType: { regular: 100000, vip: 150000 } });
    }
  }, [seatPriceParam]);

  // ----------------- LOAD SEATS (AUTO REFRESH 5S) -----------------
  useEffect(() => {
    let cancelled = false;

    const loadSeats = async () => {
      if (!showtimeId) {
        setSeatsFromServer(
          buildMockSeats(9, 14, showtimeData?.priceBySeatType)
        );
        return;
      }

      try {
        // 1️⃣ Lấy dữ liệu suất chiếu
        const res = await axios.get(
          `http://localhost:5000/api/showtimes/${showtimeId}`
        );
        if (cancelled) return;
        const showtime = res.data;

        // 2️⃣ Lấy ghế cơ bản
        const baseSeats =
          showtime.seatData?.length > 0
            ? showtime.seatData
            : buildMockSeats(9, 14, showtimeData?.priceBySeatType);

        // 3️⃣ Lấy danh sách ghế đang bị lock
        const lockRes = await axios.get(
          `http://localhost:5000/api/seat-locks/showtime/${showtimeId}`
        );
        const lockedSeats = lockRes.data?.lockedSeats || [];

        // 4️⃣ Merge trạng thái: sold > occupied > locked > available
        const mergedSeats = baseSeats.map((s) => {
          // Nếu ghế đã sold hoặc reserved, giữ nguyên status
          if (s.status === "sold" || s.status === "reserved") {
            return { ...s, status: s.status };
          }
          
          // Kiểm tra ghế có bị lock không
          const isLocked = lockedSeats.some(
            (ls) => ls.seatNumber === s.seatNumber
          );
          
          if (s.status === "occupied") return { ...s, status: "occupied" };
          if (isLocked) return { ...s, status: "locked" };
          return { ...s, status: "available" };
        });

        if (!cancelled) setSeatsFromServer(mergedSeats);
      } catch (err) {
        console.error("❌ loadSeats error:", err);
        if (!cancelled)
          setSeatsFromServer(
            buildMockSeats(9, 14, showtimeData?.priceBySeatType)
          );
      }
    };

    // 🔄 Lần đầu load
    loadSeats();

    // 🔁 Refresh mỗi 5s để cập nhật realtime
    const interval = setInterval(loadSeats, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [showtimeId, showtimeData]);

  // ----------------- TIMER COUNTDOWN -----------------
  useEffect(() => {
    if (!lockId || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          toast.error("Hết thời gian giữ ghế!");
          setLockId(null);
          localStorage.removeItem("lockedSeats");
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [lockId, timeLeft]);

  // ----------------- TOTAL PRICE -----------------
  const total = useMemo(() => {
    const seatTotal = selectedSeats.reduce((sum, seat) => {
      const seatPrice =
        seat.price ||
        (seat.type === "vip"
          ? showtimeData?.priceBySeatType?.vip || 150000
          : showtimeData?.priceBySeatType?.regular || 100000);
      return sum + seatPrice;
    }, 0);

    const comboTotal = Object.entries(selectedCombos).reduce(
      (sum, [id, qty]) => {
        const combo = combos.find((c) => c.comboId === id || c._id === id);
        return sum + (combo?.price || 0) * qty;
      },
      0
    );

    return seatTotal + comboTotal;
  }, [selectedSeats, selectedCombos, combos, showtimeData]);

  // ----------------- TOGGLE SEAT -----------------
  const toggleSeat = (seat) => {
    if (!seat) return;
    
    // Kiểm tra các trạng thái không cho phép chọn
    if (seat.status === "sold") {
      toast.error("Ghế đã được bán");
      return;
    }
    if (seat.status === "reserved" || seat.status === "occupied") {
      toast.error("Ghế đã được đặt");
      return;
    }
    if (seat.status === "locked") {
      toast.error("Ghế đang được giữ bởi người khác");
      return;
    }
    if (seat.status !== "available") {
      toast.error("Ghế không khả dụng");
      return;
    }

    setSelectedSeats((prev) =>
      prev.some((s) => s.seatNumber === seat.seatNumber)
        ? prev.filter((p) => p.seatNumber !== seat.seatNumber)
        : [...prev, seat]
    );
  };

  // ----------------- LOCK SEATS -----------------
  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) return toast.error("Chọn ít nhất 1 ghế");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await axios.post(
        "http://localhost:5000/api/seat-locks/lock",
        {
          showtimeId,
          seatNumbers: selectedSeats.map((seat) => seat.seatNumber),
          userId: user._id,
          userEmail: user.email,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { lockId, expiresIn } = response.data;
      setLockId(lockId);
      setTimeLeft(expiresIn);

      toast.success("Đã giữ ghế — bạn có 10 phút để thanh toán");

      // Chuyển đến trang Payment
      const bookingData = {
        movieTitle,
        moviePoster,
        date,
        startTime,
        endTime,
        systemName,
        clusterName,
        hallName,
        selectedSeats,
        selectedCombos,
        total,
        showtimeId,
        lockId,
      };
      sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
      navigate("/payment");
    } catch (err) {
      console.error("Lock error:", err);
      if (err.response?.status === 409) {
        const { conflictingSeats } = err.response.data;
        toast.error(`Ghế ${conflictingSeats.join(", ")} đã được giữ hoặc đặt.`);
      } else {
        toast.error(err?.response?.data?.message || "Không thể giữ ghế.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ----------------- CONFIRM BOOKING -----------------
  const handleConfirm = async () => {
    if (!lockId) return toast.error("Bạn cần giữ ghế trước");
    if (selectedSeats.length === 0) return toast.error("Chọn ghế trước");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/bookings/confirm",
        {
          showtimeId,
          seatIds: selectedSeats.map((s) => s.seatNumber),
          lockId,
          combos: Object.entries(selectedCombos)
            .filter(([_, q]) => q > 0)
            .map(([comboId, quantity]) => ({ comboId, quantity })),
          paymentMethod: "card",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đặt vé thành công!");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      console.error("Confirm error:", err);
      toast.error(err?.response?.data?.message || "Đặt vé thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800/50 p-6 rounded-2xl mb-6 border border-gray-700">
          <div className="flex items-center gap-4">
            {moviePoster && (
              <img
                src={moviePoster}
                alt="poster"
                className="w-24 h-32 object-cover rounded"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">{movieTitle || "Đặt vé"}</h2>
              <p className="text-gray-300">
                {date} • {startTime} - {endTime}
              </p>
              <p className="text-gray-300">
                {systemName} • {clusterName} • {hallName}
              </p>
              <p className="mt-2">
                Loại ghế:{" "}
                <span className="font-semibold">
                  {seatTypeParam.toUpperCase()}
                </span>
              </p>
              <p className="mt-1 text-yellow-300 font-bold">
                Giá/ghế: {seatPriceParam.toLocaleString()}₫
              </p>
            </div>
          </div>
          {lockId && (
            <div className="mt-4 p-3 bg-green-800/30 rounded">
              Đang giữ ghế — mã: <span className="font-mono">{lockId}</span> —
              thời gian còn lại: {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
          {/* Screen */}
          <div className="text-center mb-8">
            <div className="text-white text-2xl font-bold mb-2">MÀN HÌNH</div>
            <div className="w-full h-2 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full mx-auto"></div>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full mx-auto mt-1"></div>
          </div>

          {/* Cinema Layout */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-2">
              {/* Left Section - 2 ghế */}
              <div className="grid grid-cols-2 gap-1">
                {Array.from({ length: 9 }, (_, row) =>
                  Array.from({ length: 2 }, (_, col) => {
                    const seatNumber = `${String.fromCharCode(65 + row)}${
                      col + 1
                    }`;
                    const seat = (seatsFromServer || []).find(
                      (s) => s.seatNumber === seatNumber
                    );
                    if (!seat)
                      return (
                        <div
                          key={`empty-${row}-${col}`}
                          className="w-8 h-8"
                        ></div>
                      );

                    const isSelected = selectedSeats.some(
                      (s) => s.seatNumber === seat.seatNumber
                    );
                    const isReserved =
                      seat.status === "sold" ||
                      seat.status === "reserved" ||
                      seat.status === "occupied" ||
                      seat.status === "locked";
                    const disabled = isReserved || Boolean(lockId);

                    return (
                      <button
                        key={seat.seatNumber}
                        onClick={() => !disabled && toggleSeat(seat)}
                        disabled={disabled}
                        className={`w-8 h-8 rounded-md transition-all duration-200 flex items-center justify-center relative ${
                          isSelected
                            ? "bg-pink-500 text-white scale-110 shadow-lg border border-pink-300"
                            : isReserved
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : seat.type === "vip"
                            ? "bg-red-500 text-white hover:bg-red-600 hover:scale-105"
                            : "bg-purple-500 text-white hover:bg-purple-600 hover:scale-105"
                        }`}
                        title={`${
                          seat.seatNumber
                        } - ${seat.type.toUpperCase()} - ${seat.price.toLocaleString()}₫${
                          seat.status === "locked" ? " (Đang được giữ)" : ""
                        }`}
                      >
                        {isSelected ? (
                          <span className="text-xs font-bold">
                            {seat.seatNumber}
                          </span>
                        ) : (
                          <div className="w-5 h-4 bg-current rounded-sm relative">
                            <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-0.5 bg-current rounded-t-sm"></div>
                            <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-current rounded-full"></div>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Center Aisle */}
              <div className="flex items-center">
                <div className="w-2 h-54 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 text-xs font-bold transform -rotate-90">
                    AISLE
                  </div>
                </div>
              </div>

              {/* Middle Section - 8 ghế */}
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 9 }, (_, row) =>
                  Array.from({ length: 8 }, (_, col) => {
                    const seatNumber = `${String.fromCharCode(65 + row)}${
                      col + 3
                    }`;
                    const seat = (seatsFromServer || []).find(
                      (s) => s.seatNumber === seatNumber
                    );
                    if (!seat)
                      return (
                        <div
                          key={`empty-${row}-${col}`}
                          className="w-8 h-8"
                        ></div>
                      );

                    const isSelected = selectedSeats.some(
                      (s) => s.seatNumber === seat.seatNumber
                    );
                    const isReserved =
                      seat.status === "sold" ||
                      seat.status === "reserved" ||
                      seat.status === "occupied" ||
                      seat.status === "locked";
                    const disabled = isReserved || Boolean(lockId);

                    return (
                      <button
                        key={seat.seatNumber}
                        onClick={() => !disabled && toggleSeat(seat)}
                        disabled={disabled}
                        className={`w-8 h-8 rounded-md transition-all duration-200 flex items-center justify-center relative ${
                          isSelected
                            ? "bg-pink-500 text-white scale-110 shadow-lg border border-pink-300"
                            : isReserved
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : seat.type === "vip"
                            ? seat.isCenterVip
                              ? "bg-red-500 border-2 border-green-400 text-white hover:bg-red-600 hover:scale-105"
                              : "bg-red-500 text-white hover:bg-red-600 hover:scale-105"
                            : "bg-purple-500 text-white hover:bg-purple-600 hover:scale-105"
                        }`}
                        title={`${
                          seat.seatNumber
                        } - ${seat.type.toUpperCase()} - ${seat.price.toLocaleString()}₫${
                          seat.status === "sold" ? " (Đã bán)" : 
                          seat.status === "locked" ? " (Đang được giữ)" : ""
                        }`}
                      >
                        {isSelected ? (
                          <span className="text-xs font-bold">
                            {seat.seatNumber}
                          </span>
                        ) : (
                          <div className="w-5 h-4 bg-current rounded-sm relative">
                            <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-0.5 bg-current rounded-t-sm"></div>
                            <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-current rounded-full"></div>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Center Aisle */}
              <div className="flex items-center">
                <div className="w-2 h-54 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 text-xs font-bold transform -rotate-90">
                    AISLE
                  </div>
                </div>
              </div>

              {/* Right Section - 4 ghế */}
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 9 }, (_, row) =>
                  Array.from({ length: 4 }, (_, col) => {
                    const seatNumber = `${String.fromCharCode(65 + row)}${
                      col + 11
                    }`;
                    const seat = (seatsFromServer || []).find(
                      (s) => s.seatNumber === seatNumber
                    );
                    if (!seat)
                      return (
                        <div
                          key={`empty-${row}-${col}`}
                          className="w-8 h-8"
                        ></div>
                      );

                    const isSelected = selectedSeats.some(
                      (s) => s.seatNumber === seat.seatNumber
                    );
                    const isReserved =
                      seat.status === "sold" ||
                      seat.status === "reserved" ||
                      seat.status === "occupied" ||
                      seat.status === "locked";
                    const disabled = isReserved || Boolean(lockId);

                    return (
                      <button
                        key={seat.seatNumber}
                        onClick={() => !disabled && toggleSeat(seat)}
                        disabled={disabled}
                        className={`w-8 h-8 rounded-md transition-all duration-200 flex items-center justify-center relative ${
                          isSelected
                            ? "bg-pink-500 text-white scale-110 shadow-lg border border-pink-300"
                            : isReserved
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : seat.type === "vip"
                            ? "bg-red-500 text-white hover:bg-red-600 hover:scale-105"
                            : "bg-purple-500 text-white hover:bg-purple-600 hover:scale-105"
                        }`}
                        title={`${
                          seat.seatNumber
                        } - ${seat.type.toUpperCase()} - ${seat.price.toLocaleString()}₫${
                          seat.status === "locked" ? " (Đang được giữ)" : ""
                        }`}
                      >
                        {isSelected ? (
                          <span className="text-xs font-bold">
                            {seat.seatNumber}
                          </span>
                        ) : (
                          <div className="w-5 h-4 bg-current rounded-sm relative">
                            <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-0.5 bg-current rounded-t-sm"></div>
                            <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-current rounded-full"></div>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-600 rounded-md flex items-center justify-center">
                <div className="w-4 h-3 bg-gray-600 rounded-sm relative">
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-0.5 bg-current rounded-t-sm"></div>
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-current rounded-full"></div>
                </div>
              </div>
              <span className="text-gray-300 text-sm">Đã đặt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded-md flex items-center justify-center">
                <div className="w-4 h-3 bg-red-500 rounded-sm relative">
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-0.5 bg-current rounded-t-sm"></div>
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-current rounded-full"></div>
                </div>
              </div>
              <span className="text-gray-300 text-sm">Ghế VIP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-500 rounded-md flex items-center justify-center">
                <div className="w-4 h-3 bg-purple-500 rounded-sm relative">
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-0.5 bg-current rounded-t-sm"></div>
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-current rounded-full"></div>
                </div>
              </div>
              <span className="text-gray-300 text-sm">Ghế thường</span>
            </div>
          </div>

          {/* Combo */}
          <h3 className="text-xl font-semibold mb-3">Chọn combo (tuỳ chọn)</h3>
          <div className="space-y-3 mb-6">
            {combos.length === 0 ? (
              <div className="text-gray-400">Không có combo</div>
            ) : (
              combos.map((combo) => (
                <div
                  key={combo.comboId}
                  className="flex items-center justify-between bg-gray-700/40 p-3 rounded"
                >
                  <div>
                    <div className="font-semibold">{combo.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-bold text-yellow-300">
                        {combo.price.toLocaleString("vi-VN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                        ₫
                      </div>
                      <div className="text-xs text-gray-400">
                        {combo.description}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      step="1"
                      value={selectedCombos[combo.comboId] || 0}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Loại bỏ leading zeros và xử lý input
                        const cleanValue = inputValue.replace(/^0+/, "") || "0";

                        if (cleanValue === "0" || cleanValue === "") {
                          setSelectedCombos((prev) => ({
                            ...prev,
                            [combo.comboId]: 0,
                          }));
                        } else {
                          const value = parseInt(cleanValue, 10);
                          if (!isNaN(value) && value >= 0 && value <= 99) {
                            console.log(
                              "Combo input change:",
                              combo.comboId,
                              value
                            );
                            setSelectedCombos((prev) => ({
                              ...prev,
                              [combo.comboId]: value,
                            }));
                          }
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      onBlur={(e) => {
                        // Format lại input khi blur để loại bỏ leading zeros
                        const value = parseInt(e.target.value, 10) || 0;
                        e.target.value = value.toString();
                      }}
                      onKeyDown={(e) => {
                        // Chỉ cho phép số, backspace, delete, arrow keys
                        if (
                          !/[0-9]/.test(e.key) &&
                          ![
                            "Backspace",
                            "Delete",
                            "ArrowLeft",
                            "ArrowRight",
                            "Tab",
                          ].includes(e.key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                      className="w-16 text-black rounded p-1 text-center border border-gray-300 focus:border-blue-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total & buttons */}
          <div className="flex items-center justify-between bg-gray-700/30 p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="text-white text-lg">
                {selectedSeats.length} Seats
              </div>
              {selectedSeats.length > 0 && (
                <div className="text-sm text-gray-300">
                  {selectedSeats.filter((s) => s.type === "regular").length}{" "}
                  Regular +{" "}
                  {selectedSeats.filter((s) => s.type === "vip").length} VIP
                  {Object.entries(selectedCombos).some(
                    ([_, qty]) => qty > 0
                  ) && <span> + Combo</span>}
                </div>
              )}
              <div className="text-3xl font-bold text-white">
                {total.toLocaleString()}₫
              </div>
            </div>

            <div className="flex gap-3">
              {!lockId ? (
                <button
                  onClick={handleLockSeats}
                  disabled={selectedSeats.length === 0 || loading}
                  className="bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-xl font-bold text-white text-lg disabled:opacity-50 transition-all duration-200 hover:scale-105"
                >
                  {loading ? "Đang giữ..." : "Buy Now"}
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 hover:scale-105"
                >
                  {loading ? "Đang xử lý..." : "Confirm Booking"}
                </button>
              )}

              <button
                onClick={() => navigate(-1)}
                className="px-6 py-4 bg-gray-600 hover:bg-gray-500 rounded-xl text-white transition-all duration-200"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
