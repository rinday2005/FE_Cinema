import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

const ConfirmTicket = () => {
  const [ticketData, setTicketData] = useState(null);
  const ticketRef = useRef(null);
  const navigate = useNavigate();

  // 🔹 Lấy dữ liệu thanh toán từ sessionStorage
  useEffect(() => {
    try {
      const data = sessionStorage.getItem("paymentData");
      if (!data) {
        console.error("Không tìm thấy thông tin thanh toán.");
        return;
      }
      setTicketData(JSON.parse(data));
    } catch (error) {
      console.error("Lỗi khi đọc dữ liệu thanh toán:", error);
    }
  }, []);

  // 🔹 Tải vé xuống file .txt
  const handleDownloadTicket = () => {
    if (!ticketData) return;

    const info = [
      "🎬 CINEMA TICKET",
      "═══════════════════════════════════",
      `Movie: ${ticketData.movieTitle}`,
      `System: ${ticketData.systemName}`,
      `Cluster: ${ticketData.clusterName}`,
      `Hall: ${ticketData.hallName}`,
      `Date: ${ticketData.date}`,
      `Time: ${ticketData.startTime} - ${ticketData.endTime}`,
      `Seats: ${ticketData.selectedSeats?.map((s) => s.seatNumber).join(", ")}`,
      `Total: ${ticketData.total.toLocaleString()}₫`,
      `Payment: ${ticketData.paymentMethod.toUpperCase()}`,
      `Transaction ID: ${ticketData.transactionId}`,
      "═══════════════════════════════════",
    ].join("\n");

    const blob = new Blob([info], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ticket-${ticketData.transactionId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 🔹 Quay lại trang chủ và dọn session
  const handleBackToHome = () => {
    sessionStorage.removeItem("bookingData");
    sessionStorage.removeItem("paymentData");
    window.location.href = "/";
  };

  // 🔹 Quay lại trang thanh toán
  const handleBackToPayment = () => {
    if (!ticketData) return;
    // Phục hồi bookingData từ paymentData để Payment.jsx sử dụng lại
    const bookingData = {
      lockId: ticketData.lockId,
      movieTitle: ticketData.movieTitle,
      moviePoster: ticketData.moviePoster,
      systemName: ticketData.systemName,
      clusterName: ticketData.clusterName,
      hallName: ticketData.hallName,
      date: ticketData.date,
      startTime: ticketData.startTime,
      endTime: ticketData.endTime,
      selectedSeats: ticketData.selectedSeats,
      selectedCombos: ticketData.selectedCombos || [],
      total: ticketData.total,
      cinemaId: ticketData.cinemaId,
      systemId: ticketData.systemId,
    };
    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    navigate("/payment");
  };

  // 🔹 Loading state
  if (!ticketData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl animate-pulse">Đang tải vé...</p>
      </div>
    );
  }

  // 🔹 Chuẩn bị QR Code
  const qrValue = JSON.stringify({
    id: ticketData.transactionId,
    movie: ticketData.movieTitle,
    system: ticketData.systemName,
    cluster: ticketData.clusterName,
    hall: ticketData.hallName,
    date: ticketData.date,
    time: ticketData.startTime,
    seats: ticketData.selectedSeats?.map((s) => s.seatNumber).join(", "),
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* 🔸 Hiệu ứng nền động */}
      <div className="absolute inset-0 opacity-30">
        {["purple", "pink", "indigo"].map((color, i) => (
          <div
            key={color}
            className={`absolute ${
              i === 0
                ? "top-0 left-0"
                : i === 1
                ? "top-0 right-0"
                : "bottom-0 left-1/2"
            } w-96 h-96 bg-${color}-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse`}
            style={{ animationDelay: `${i * 2}s` }}
          ></div>
        ))}
      </div>

      <div ref={ticketRef} className="relative z-10 px-4 py-10">
        <div className="max-w-5xl mx-auto">
          {/* 🔹 Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full mb-4 mx-auto flex items-center justify-center animate-bounce">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-2">🎉 Đặt vé thành công!</h1>
            <p className="text-gray-300">
              Vé điện tử của bạn đã được tạo thành công
            </p>
          </div>

          {/* 🔹 Nội dung vé */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Thông tin vé */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-purple-400">
                🎟️ Thông tin vé
              </h2>

              {/* Movie Info */}
              <div className="flex gap-4 pb-5 border-b border-white/10">
                <img
                  src={ticketData.moviePoster}
                  alt={ticketData.movieTitle}
                  className="w-24 h-36 object-cover rounded-xl shadow-lg"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3">
                    {ticketData.movieTitle}
                  </h3>
                  <p className="text-gray-300">
                    📅 {ticketData.date} — ⏰ {ticketData.startTime} -{" "}
                    {ticketData.endTime}
                  </p>
                </div>
              </div>

              {/* Cinema Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <InfoCard
                  title="Hệ thống rạp"
                  value={ticketData.systemName}
                  color="purple"
                />
                <InfoCard
                  title="Cụm rạp"
                  value={ticketData.clusterName}
                  color="pink"
                />
                <InfoCard
                  title="Phòng chiếu"
                  value={ticketData.hallName}
                  color="indigo"
                />
              </div>

              {/* Seats */}
              <Section title="Ghế đã đặt" icon="💺">
                <div className="flex flex-wrap gap-2">
                  {ticketData.selectedSeats?.map((seat) => (
                    <span
                      key={seat.seatNumber}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500/40 to-pink-500/40 border border-purple-400/60 rounded-xl font-bold"
                    >
                      {seat.seatNumber}
                    </span>
                  ))}
                </div>
              </Section>

              {/* Combo */}
              {ticketData.selectedCombos?.length > 0 && (
                <Section title="Combo đã chọn" icon="🍿">
                  {ticketData.selectedCombos.map((combo, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between bg-white/5 border border-white/10 rounded-xl p-3"
                    >
                      <span>{combo.name}</span>
                      <span>× {combo.quantity}</span>
                    </div>
                  ))}
                </Section>
              )}

              {/* Payment Info */}
              <Section title="Thanh toán" icon="💳">
                <div className="flex justify-between text-xl font-bold mb-3">
                  <span>Tổng cộng:</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-transparent bg-clip-text">
                    {ticketData.total.toLocaleString()}₫
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <PaymentInfo
                    label="Phương thức"
                    value={ticketData.paymentMethod}
                  />
                  <PaymentInfo
                    label="Mã giao dịch"
                    value={ticketData.transactionId}
                  />
                </div>
              </Section>
            </div>

            {/* QR Code */}
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold mb-6 text-center">
                📱 Mã QR Vé
              </h2>
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-30"></div>
                  <div className="relative bg-white rounded-2xl p-4 shadow-2xl">
                    <QRCodeCanvas value={qrValue} size={256} />
                  </div>
                </div>

                <p className="text-gray-300 mb-2 text-center">
                  Quét mã QR này tại rạp để vào xem phim
                </p>
                <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg px-4 py-2 text-purple-300 text-xs font-mono">
                  ID: {ticketData.transactionId.slice(-8)}
                </div>

                <div className="space-y-3 mt-6 w-full">
                  <ActionButton
                    label="Tải vé"
                    gradient="from-blue-500 to-cyan-500"
                    icon="⬇️"
                    onClick={handleDownloadTicket}
                  />
                  <ActionButton
                    label="Quay lại thanh toán"
                    gradient="from-slate-500 to-gray-600"
                    icon="↩️"
                    onClick={handleBackToPayment}
                  />
                  <ActionButton
                    label="Về trang chủ"
                    gradient="from-purple-500 to-pink-500"
                    icon="🏠"
                    onClick={handleBackToHome}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 🔹 Notes */}
          <div className="mt-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-yellow-300 mb-4">
              ⚠️ Lưu ý quan trọng
            </h3>
            <ul className="text-yellow-100 space-y-2">
              <li>• Vui lòng đến rạp trước giờ chiếu 15 phút.</li>
              <li>• Mang theo mã QR để quét tại cổng.</li>
              <li>• Vé không thể hoàn trả sau khi thanh toán.</li>
              <li>• Liên hệ hotline: 1900-xxxx nếu cần hỗ trợ.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔸 Component phụ trợ gọn gàng
const InfoCard = ({ title, value, color }) => (
  <div
    className={`bg-${color}-500/20 border border-${color}-400/30 rounded-xl p-4`}
  >
    <p className={`text-${color}-300 text-xs font-medium`}>{title}</p>
    <p className="text-white font-bold">{value}</p>
  </div>
);

const Section = ({ title, icon, children }) => (
  <div className="pt-4 border-t border-white/10">
    <p className="text-sm text-gray-400 mb-3 flex items-center gap-2 font-semibold">
      <span>{icon}</span> {title}
    </p>
    {children}
  </div>
);

const PaymentInfo = ({ label, value }) => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
    <p className="text-gray-400 mb-1">{label}</p>
    <p className="text-white font-semibold text-xs">{value}</p>
  </div>
);

const ActionButton = ({ label, icon, onClick, gradient }) => (
  <button
    onClick={onClick}
    className={`w-full bg-gradient-to-r ${gradient} hover:scale-105 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2`}
  >
    <span>{icon}</span> {label}
  </button>
);

export default ConfirmTicket;
