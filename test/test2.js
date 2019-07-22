const NganLuong = require("../index");

const nganluong = new NganLuong({
  isSandbox: false,
  merchant_site_code: "60238", //47806",
  secure_pass: "02832329e199281951c712933237715a"
});

//tao url

// var url = nganluong.buildCheckoutUrl({
//   return_url: "http://localhost:3000/callback-payment",
//   affiliate_code: "",
//   buyer_info: "",
//   currency: "vnd",
//   discount: "0",
//   fee_cal: "0",
//   fee_shipping: "0",
//   order_code: "laskjflkasjj8o3jflkdsjv",
//   order_description: "dayladonhang test",
//   price: "1000000",
//   quantity: "1",
//   receiver: "ducmaster02@gmail.com",
//   tax: "0",
//   transaction_info: "day la thong tin giao dich"
// });
// console.log({ url });

// // check don hang
nganluong
  .checkOrderStatus("laskjflkasjj8o3jflkdsjv")
  .then(data => console.log(data))
  .catch(err => console.error(err));

// var result_callback = nganluong.verifyReturnUrl({
//   error_text: "",
//   price: "10000",
//   payment_id: "19682770",
//   transaction_info: "day la thong tin giao dich",
//   order_code: "laskjflkasjj8o3jflkdsjv",
//   payment_type: "2",
//   secure_code: "25a50fe5ef428e35addbbbafbe13dc40",
//   token_nl: "142989-8caae7fc844cc12a2328dc057aca43be"
// });
// console.log(result_callback);
