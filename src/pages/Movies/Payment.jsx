import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import QRCode from "qrcode";
import axios from "axios";

const Payment = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [loading, setLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState("");

  // 🧩 Lấy dữ liệu đặt vé từ sessionStorage
  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (!data) {
      toast.error("Không tìm thấy thông tin đặt vé");
      navigate("/");
      return;
    }
    try {
      setBookingData(JSON.parse(data));
    } catch (err) {
      toast.error("Dữ liệu đặt vé không hợp lệ");
      navigate("/");
    }
  }, [navigate]);

  // 🔹 Tạo mã QR MoMo
  const generateMoMoQR = async (amount) => {
    try {
      const qrString = `momo://transfer?amount=${amount}&note=${encodeURIComponent(
        `Thanh toán vé xem phim - ${bookingData.movieTitle}`
      )}&orderId=MOMO_${Date.now()}`;

      const qrDataURL = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
      });

      setQrCodeDataURL(qrDataURL);
      setShowQRCode(true);
    } catch (err) {
      console.error("QR error:", err);
      toast.error("Không thể tạo mã QR");
    }
  };

  // 🧾 Hàm gửi xác nhận thanh toán đến backend
  const confirmBooking = async (method = paymentMethod, skipNavigate = false) => {
    if (!bookingData) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !token) {
        toast.error("Bạn cần đăng nhập để thanh toán");
        navigate("/login");
        return;
      }

      // Chuẩn hóa dữ liệu gửi lên server
      const payload = {
        lockId: bookingData.lockId,
        userId: user._id,
        bookingData: {
          userEmail: user.email,
          movieTitle: bookingData.movieTitle,
          moviePoster: bookingData.moviePoster,
          systemName: bookingData.systemName,
          clusterName: bookingData.clusterName,
          hallName: bookingData.hallName,
          date: bookingData.date,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          selectedSeats: bookingData.selectedSeats,
          selectedCombos: bookingData.selectedCombos || [],
          total: bookingData.total,
          paymentMethod: method,
          cinemaId: bookingData.cinemaId,
          systemId: bookingData.systemId,
        },
      };

      const resp = await axios.post(
        "http://localhost:5000/api/seat-locks/confirm",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Booking confirmed:", resp.data);

      // Lưu thông tin thanh toán để hiển thị ở trang xác nhận
      const paymentData = {
        ...bookingData,
        transactionId: resp.data.booking?._id || `TXN_${Date.now()}`,
        paymentMethod: method,
      };
      sessionStorage.setItem("paymentData", JSON.stringify(paymentData));
      
      // XÓA bookingData sau khi thanh toán thành công
      sessionStorage.removeItem("bookingData");

      toast.success("Thanh toán thành công!");
      if (!skipNavigate) {
        navigate("/confirm-ticket");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Thanh toán thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  // 🟣 Xử lý khi chọn thanh toán
  const handlePayment = async () => {
    if (paymentMethod === "momo") {
      await generateMoMoQR(bookingData.total);
    } else {
      await confirmBooking(paymentMethod);
    }
  };

  // ✅ Người dùng xác nhận đã thanh toán MoMo thành công (điều hướng lạc quan)
  const handleMoMoPaymentSuccess = async () => {
    if (!bookingData) return;
    // Điều hướng ngay tới trang xác nhận với dữ liệu tạm thời
    const tempPaymentData = {
      ...bookingData,
      transactionId: `TXN_${Date.now()}`,
      paymentMethod: "momo",
    };
    sessionStorage.setItem("paymentData", JSON.stringify(tempPaymentData));
    sessionStorage.removeItem("bookingData");
    navigate("/confirm-ticket");

    // Gửi xác nhận thật lên server ở nền, không chặn UI
    confirmBooking("momo", true).catch(() => {});
    setShowQRCode(false);
  };

  if (!bookingData) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300"
            >
              <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 group-hover:bg-white/10 group-hover:border-purple-400/50 transition-all">
                <svg
                  className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </div>
              <span className="font-medium">Quay lại</span>
            </button>

            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="p-2 bg-purple-500/20 rounded-xl">💳</span>
              Thanh toán
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Thông tin đặt vé */}
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
                Chi tiết đặt vé
              </h2>

              <div className="space-y-4">
                {/* Movie Info */}
                <div className="flex gap-4 pb-4 border-b border-white/10">
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-25"></div>
                    <img
                      src={bookingData.moviePoster}
                      alt={bookingData.movieTitle}
                      className="relative w-20 h-28 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {bookingData.movieTitle}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
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
                        {bookingData.date}
                      </p>
                      <p className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
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
                        {bookingData.startTime} - {bookingData.endTime}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cinema Info */}
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="text-sm text-gray-400">
                        Hệ thống rạp
                      </span>
                    </div>
                    <p className="text-white font-semibold">
                      {bookingData.systemName}
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-pink-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-sm text-gray-400">Cụm rạp</span>
                    </div>
                    <p className="text-white font-semibold">
                      {bookingData.clusterName}
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                        />
                      </svg>
                      <span className="text-sm text-gray-400">Phòng chiếu</span>
                    </div>
                    <p className="text-white font-semibold">
                      {bookingData.hallName}
                    </p>
                  </div>
                </div>

                {/* Seats */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Ghế đã chọn:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bookingData.selectedSeats?.map((seat, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 rounded-lg text-sm text-white font-semibold shadow-lg"
                      >
                        {seat.seatNumber}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Combos */}
                {bookingData.selectedCombos?.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Combo đã chọn:
                    </p>
                    <div className="space-y-2">
                      {bookingData.selectedCombos.map((combo, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
                        >
                          <span className="text-white">🍿 {combo.name}</span>
                          <span className="text-gray-300">
                            × {combo.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-white">
                      Tổng thanh toán:
                    </span>
                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                      {bookingData.total.toLocaleString()}₫
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Phương thức thanh toán
              </h2>

              {!showQRCode ? (
                <div className="space-y-6">
                  {/* Payment Options */}
                  <div className="space-y-3">
                    {[
                      {
                        value: "momo",
                        label: "MoMo",
                        icon: "📱",
                        color: "from-pink-500 to-rose-500",
                      },
                      {
                        value: "vnpay",
                        label: "VNPay",
                        icon: "🏦",
                        color: "from-blue-500 to-cyan-500",
                      },
                      {
                        value: "visa",
                        label: "Visa/Mastercard",
                        icon: "💳",
                        color: "from-purple-500 to-indigo-500",
                      },
                    ].map((method) => (
                      <label
                        key={method.value}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          paymentMethod === method.value
                            ? `bg-gradient-to-r ${method.color} border-transparent shadow-lg`
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-5 h-5"
                        />
                        <span className="text-2xl">{method.icon}</span>
                        <span className="text-white font-semibold flex-1">
                          {method.label}
                        </span>
                        {paymentMethod === method.value && (
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* Payment Button */}
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Đang xử lý...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Thanh toán ngay
                      </span>
                    )}
                  </button>

                  {/* Security Note */}
                  <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4 text-center">
                    <p className="text-green-300 text-sm flex items-center justify-center gap-2">
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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Giao dịch được bảo mật an toàn
                    </p>
                  </div>
                </div>
              ) : (
                /* QR Code Display */
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 flex flex-col items-center">
                    <img
                      src={qrCodeDataURL}
                      alt="MoMo QR Code"
                      className="w-64 h-64 mb-4"
                    />
                    <p className="text-center text-gray-700 text-sm">
                      Quét mã QR bằng ứng dụng MoMo để thanh toán
                    </p>
                  </div>

                  <button
                    onClick={handleMoMoPaymentSuccess}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6 py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Đang xác nhận...
                      </span>
                    ) : (
                      "✓ Tôi đã thanh toán"
                    )}
                  </button>

                  <button
                    onClick={() => setShowQRCode(false)}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300"
                  >
                    Hủy và chọn phương thức khác
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Styles for Animations */}
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        .animate-blob {
          animation: blob 20s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Payment;
