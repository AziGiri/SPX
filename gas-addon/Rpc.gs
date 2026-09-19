/**
 * ==========================================================
 *  Rpc.gs â€” Jembatan REST untuk App Hybrid (Capacitor/Cordova)
 * ==========================================================
 *  CARA PASANG:
 *  1. Buka project Apps Script App Pengiriman Paket kamu yang SUDAH
 *     ADA (yang berisi Code.gs dan Index.html).
 *  2. Klik "+" di sebelah "Files" di panel kiri editor > Script.
 *  3. Beri nama file baru ini "Rpc" (otomatis jadi Rpc.gs).
 *  4. Tempel SELURUH isi file ini ke sana. Code.gs & Index.html
 *     TIDAK PERLU diubah sama sekali â€” semua fungsi di Code.gs
 *     (login, getDeliveries, addDelivery, dst) dipakai APA ADANYA
 *     lewat daftar RPC_FUNCTIONS di bawah.
 *  5. Deploy ulang: menu Deploy > Manage deployments > pilih
 *     deployment yang aktif > ikon pensil (Edit) > Version:
 *     "New version" > Deploy.
 *     (WAJIB versi baru, supaya doPost() di file ini ikut aktif.)
 *  6. Pastikan pengaturan deployment: "Execute as: Me",
 *     "Who has access: Anyone". Ini WAJIB karena app Android nanti
 *     memanggil endpoint ini tanpa login Google â€” otentikasi
 *     pengguna (kurir/admin) tetap ditangani sendiri lewat fungsi
 *     login()/loginAndBootstrap() di Code.gs, sama seperti di
 *     versi Web App biasa.
 *  7. Salin URL Web App (diakhiri "/exec") â€” ini yang dipakai
 *     sebagai GAS_ENDPOINT di www/index.html app Android.
 *
 *  CATATAN KEAMANAN:
 *  Endpoint ini hanya mau menjalankan fungsi yang namanya terdaftar
 *  di RPC_FUNCTIONS di bawah â€” fungsi lain (termasuk setupDatabase,
 *  atau fungsi apa pun yang belum didaftarkan) TIDAK BISA dipanggil
 *  lewat sini, walau nama fungsinya ditebak dengan benar. Aturan
 *  admin/non-admin (mis. hanya admin boleh addDelivery, hapus data,
 *  dst) tetap ditegakkan oleh Code.gs sendiri (lihat isAdminUser_())
 *  seperti sebelumnya â€” Rpc.gs ini murni jembatan transport, tidak
 *  menambah/mengurangi hak akses apa pun.
 */

var RPC_FUNCTIONS = {
  login: login,
  loginAndBootstrap: loginAndBootstrap,
  getCourierList: getCourierList,
  getDeliveries: getDeliveries,
  addDelivery: addDelivery,
  updateDelivery: updateDelivery,
  updateDeliveryStatus: updateDeliveryStatus,
  claimDelivery: claimDelivery,
  unclaimDelivery: unclaimDelivery,
  bulkClaimDelivery: bulkClaimDelivery,
  bulkUnclaimDelivery: bulkUnclaimDelivery,
  adminUnclaimDelivery: adminUnclaimDelivery,
  bulkAdminUnclaimDelivery: bulkAdminUnclaimDelivery,
  deleteDelivery: deleteDelivery,
  bulkDeleteDelivery: bulkDeleteDelivery,
  bulkUpdateStatus: bulkUpdateStatus,
  getCODSummary: getCODSummary,
  getDashboardStats: getDashboardStats,
  getCourierBreakdown: getCourierBreakdown,
  getUserList: getUserList,
  addUser: addUser,
  updateUser: updateUser,
  deleteUser: deleteUser,
  getPayrollReport: getPayrollReport,
  addKasbon: addKasbon,
  editKasbon: editKasbon,
  deleteKasbon: deleteKasbon,
  setPayrollPaidStatus: setPayrollPaidStatus
};

// Dipanggil oleh app Android (lewat fetch POST). Body request harus JSON:
// { "fn": "namaFungsi", "args": [arg1, arg2, ...] }
// Dikirim dengan header Content-Type: text/plain (BUKAN application/json)
// dari sisi client â€” supaya browser/WebView tidak mengirim preflight
// OPTIONS request dulu (Apps Script tidak bisa menjawab preflight itu).
// Isinya tetap JSON valid, cuma "label" content-type-nya saja yang
// disamarkan jadi text/plain; di sini tetap di-parse sebagai JSON biasa.
function doPost(e) {
  var response;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Request tidak valid (body kosong).');
    }
    var body = JSON.parse(e.postData.contents);
    var fnName = body.fn;
    var args = body.args || [];
    var fn = RPC_FUNCTIONS[fnName];
    if (typeof fn !== 'function') {
      throw new Error('Fungsi tidak dikenal atau tidak diizinkan: ' + fnName);
    }
    var result = fn.apply(null, args);
    response = { ok: true, result: result };
  } catch (err) {
    response = { ok: false, message: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
