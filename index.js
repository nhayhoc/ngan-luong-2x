const createMd5Hash = require("md5");
const axios = require("axios");
const querystring = require("querystring");

class NganLuong {
  /**
   * @typedef {Object} NganLuongInit
   * @property {Boolean} isSandbox True nếu là sandbox
   * @property {string} merchant_site_code Mã website/ merchant đã khai báo tại nganluong (ID kết nối)
   * @property {string} secure_pass Mật khẩu kết nối tương ứng merchant_site_code
   */
  /**
   * Khởi tạo đối tượng
   * @param  {NganLuongInit} nganluong_init tin từ Ngan luong
   */
  constructor(nganluong_init) {
    let { isSandbox, merchant_site_code, secure_pass } = nganluong_init;
    this.isSandbox = isSandbox;
    this.payment_gateway = isSandbox
      ? "https://sandbox.nganluong.vn:8088/nl35/checkout.php"
      : " https://www.nganluong.vn/checkout.php";
    this.merchant_site_code = merchant_site_code;
    this.secure_pass = secure_pass;
  }
  /**
   * @typedef {Object} InfoPayment
 
   * @property {String} return_url Địa chỉ url callback sau khi thanh toán
   * @property {String} receiver Email ngân lượng chủ tài khoản
   * @property {String} order_code Mã đơn hàng
   * @property {String} price Giá đơn hàng
   * @property {String} currency Nhận giá trị 'vnd' hoặc 'usd'
   * @property {String} quantity Số lượng đơn hàng
   * @property {String} tax Số tiền thuế
   * @property {String} discount Số tiền giảm giá
   * @property {String} fee_cal Nhận giá trị 0 hoặc 1 (xem thêm tại document của NL)
   * @property {String} fee_shipping Phí vận chuyển
   * @property {String} affiliate_code Mã đối tác tham gia chương trình liên kết
   * @property {String} buyer_info  "Họ tên người mua \*\|\* Địa chỉ Email \*\|\* Điện thoại \*\|\* Địa chỉ nhận hàng"
   * @property {String} order_description Mô tả về đơn hàng
   * @property {String} transaction_info Thông tin giao dịch
   */
  /**
   * Tạo url redirect thanh toán
   * @param  {InfoPayment} arrParam
   * @return {String} url redirect qua trang thanh toán Ngân Lượng
   */
  buildCheckoutUrl(arrParam) {
    const params = [`merchant_site_code=${encodeURI(this.merchant_site_code)}`];
    Object.keys(arrParam).forEach(key => {
      const value = arrParam[key];
      if (value == null || value.length === 0) {
        // skip empty params (but they must be optional)
        return;
      }
      if (
        value.length > 0 &&
        key != "payment_gateway" &&
        key != "secure_pass"
      ) {
        params.push(`${key}=${encodeURI(value)}`);
      }
    });

    let result = this.payment_gateway + "?" + params.join("&");
    let security_code = "";
    security_code += "" + this.merchant_site_code;
    security_code += " " + arrParam.return_url;
    security_code += " " + arrParam.receiver; // tài khoản ngân lượng
    security_code += " " + arrParam.transaction_info;
    security_code += " " + arrParam.order_code;
    security_code += " " + arrParam.price;
    security_code += " " + arrParam.currency; // hỗ trợ 2 loại tiền tệ currency usd,vnd
    security_code += " " + arrParam.quantity; // số lượng mặc định 1
    security_code += " " + arrParam.tax;
    security_code += " " + arrParam.discount;
    security_code += " " + arrParam.fee_cal;
    security_code += " " + arrParam.fee_shipping;
    security_code += " " + arrParam.order_description;
    security_code += " " + arrParam.buyer_info;
    security_code += " " + arrParam.affiliate_code;
    security_code += " " + this.secure_pass;
    let md5 = createMd5Hash(security_code);
    result += "&secure_code=" + md5;
    return result;
  }
  /**
   * @typedef ReturnParams
   * @property {String} transaction_info Thông tin giao dịch
   * @property {Number} price Giá đơn hàng
   * @property {Number} payment_id Mã giao dịch tại NgânLượng.vn
   * @property {Number} payment_type Hình thức thanh toán
   * @property {String} error_text Mô tả lỗi nếu có
   * @property {String} secure_code Mã checksum
   * @property {String} token_nl Token ngân lượng trả về
   * @property {String} order_code Mã đơn hàng
   */
  /**
   * @typedef VerifyResult
   * @property {Boolean} isSuccess true nếu thành công
   * @property {Number} payment_id Mã giao dịch tại NgânLượng.vn
   * @property {String} error_text Mô tả lỗi nếu có
   * @property {String} token_nl Token ngân lượng trả về
   * @property {String} order_code Mã đơn hàng
   */
  /**
   * @param  {ReturnParams} query
   * @return {VerifyResult} Thông tin xác nhận thanh toán
   */
  verifyReturnUrl(query) {
    let {
      transaction_info,
      price,
      payment_id,
      payment_type,
      error_text,
      secure_code,
      token_nl,
      order_code
    } = query;
    let verify_secure_code =
      " " +
      transaction_info +
      " " +
      order_code +
      " " +
      price +
      " " +
      payment_id +
      " " +
      payment_type +
      " " +
      error_text +
      " " +
      this.merchant_site_code +
      " " +
      this.secure_pass;

    return {
      isSuccess: createMd5Hash(verify_secure_code) === secure_code,
      payment_id,
      error_text,
      order_code,
      token_nl
    };
  }
  /**
   *
   * @param {String} order_code
   * @return Promise<Object> Thông tin của đơn hàng
   */
  checkOrderStatus(order_code) {
    const url = this.isSandbox
      ? "https://sandbox.nganluong.vn:8088/nl35/service/order/checkV2"
      : " https://www.nganluong.vn/service/order/checkV2";
    const data = {
      merchant_id: this.merchant_site_code,
      order_code,
      checksum: createMd5Hash(`${order_code}|${this.secure_pass}`)
    };

    return new Promise((res, rej) => {
      axios({
        method: "post",
        url,
        data: querystring.stringify(data),
        headers: {
          "content-Type": "application/x-www-form-urlencoded"
        }
      })
        .then(d =>
          res({
            message: this.getReturnUrlStatus(d.data.error_code),
            ...d.data
          })
        )
        .catch(err => rej(err));
    });
  }
  getReturnUrlStatus(responseCode, locale = "vn") {
    const responseCodeTable = {
      "00": {
        vn: "Giao dịch thành công",
        en: "Approved"
      },
      "02": {
        vn: "Địa chỉ IP của merchant gọi tới NganLuong.vn không được chấp nhận",
        en: "Invalid IP Address"
      },
      "03": {
        vn:
          "Sai tham số gửi tới NganLuong.vn (có tham số sai tên hoặc kiểu dữ liệu)",
        en: "Sent data is not in the right format"
      },
      "04": {
        vn: "Tên hàm API do merchant gọi tới không hợp lệ (không tồn tại)",
        en: "API function name not found"
      },
      "05": {
        vn: "Sai version của API",
        en: "Wrong API version"
      },
      "06": {
        vn: "Mã merchant không tồn tại hoặc chưa được kích hoạt",
        en: "Merchant code not found or not activated yet"
      },
      "07": {
        vn: "Sai mật khẩu của merchant",
        en: "Wrong merchant password"
      },
      "08": {
        vn: "Tài khoản người bán hàng không tồn tại",
        en: "Seller account not found"
      },
      "09": {
        vn: "Tài khoản người nhận tiền đang bị phong tỏa",
        en: "Receiver account is frozen"
      },
      10: {
        vn: "Hóa đơn thanh toán không hợp lệ",
        en: "Invalid payment bill"
      },
      11: {
        vn: "Số tiền thanh toán không hợp lệ",
        en: "Invalid amount"
      },
      12: {
        vn: "Đơn vị tiền tệ không hợp lệ",
        en: "Invalid money currency"
      },
      29: {
        vn: "Token không tồn tại",
        en: "Token not found"
      },
      80: {
        vn: "Không thêm được đơn hàng",
        en: "Can't add more order"
      },
      81: {
        vn: "Đơn hàng chưa được thanh toán",
        en: "The order has not yet been paid"
      },
      110: {
        vn: "Địa chỉ email tài khoản nhận tiền không phải email chính",
        en: "The email address is not the primary email"
      },
      111: {
        vn: "Tài khoản nhận tiền đang bị khóa",
        en: "Receiver account is locked"
      },
      113: {
        vn: "Tài khoản nhận tiền chưa cấu hình là người bán nội dung số",
        en: "Receiver account is not configured as digital content sellers"
      },
      114: {
        vn: "Giao dịch đang thực hiện, chưa kết thúc",
        en: "Pending transaction"
      },
      115: {
        vn: "Giao dịch bị hủy",
        en: "Cancelled transaction"
      },
      118: {
        vn: "tax_amount không hợp lệ",
        en: "Invalid tax_amount"
      },
      119: {
        vn: "discount_amount không hợp lệ",
        en: "Invalid discount_amount"
      },
      120: {
        vn: "fee_shipping không hợp lệ",
        en: "Invalid fee_shipping"
      },
      121: {
        vn: "return_url không hợp lệ",
        en: "Invalid return_url"
      },
      122: {
        vn: "cancel_url không hợp lệ",
        en: "Invalid cancel_url"
      },
      123: {
        vn: "items không hợp lệ",
        en: "Invalid items"
      },
      124: {
        vn: "transaction_info không hợp lệ",
        en: "Invalid transaction_info"
      },
      125: {
        vn: "quantity không hợp lệ",
        en: "Invalid quantity"
      },
      126: {
        vn: "order_description không hợp lệ",
        en: "Invalid order_description"
      },
      127: {
        vn: "affiliate_code không hợp lệ",
        en: "Invalid affiliate_code"
      },
      128: {
        vn: "time_limit không hợp lệ",
        en: "Invalid time_limit"
      },
      129: {
        vn: "buyer_fullname không hợp lệ",
        en: "Invalid buyer_fullname"
      },
      130: {
        vn: "buyer_email không hợp lệ",
        en: "Invalid buyer_email"
      },
      131: {
        vn: "buyer_mobile không hợp lệ",
        en: "Invalid buyer_mobile"
      },
      132: {
        vn: "buyer_address không hợp lệ",
        en: "Invalid buyer_address"
      },
      133: {
        vn: "total_item không hợp lệ",
        en: "Invalid total_item"
      },
      134: {
        vn: "payment_method, bank_code không hợp lệ",
        en: "Invalid payment_method, bank_code"
      },
      135: {
        vn: "Lỗi kết nối tới hệ thống ngân hàng",
        en: "Error connecting to banking system"
      },
      140: {
        vn: "Đơn hàng không hỗ trợ thanh toán trả góp",
        en: "The order does not support installment payments"
      },
      99: {
        vn: "Lỗi không được định nghĩa hoặc không rõ nguyên nhân",
        en: "Unknown error"
      },
      default: {
        vn: "Giao dịch thất bại",
        en: "Failured"
      }
    };

    const respondText = responseCodeTable[responseCode];

    return respondText
      ? respondText[locale]
      : responseCodeTable.default[locale];
  }
}

module.exports = NganLuong;
