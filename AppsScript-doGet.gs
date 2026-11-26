/**
 * Add this doGet and its helpers to the existing Apps Script project.
 * Keep the existing doPost(e) unchanged. This reads Sheet1 and returns only
 * the diary fields used by the dashboard as JSON.
 */
function doGet(e) {
  try {
    var book = SpreadsheetApp.getActiveSpreadsheet();
    if (!book) throw new Error("Spreadsheet is not bound to this Apps Script project.");

    var sheet = book.getSheetByName("Sheet1");
    if (!sheet) throw new Error("Sheet1 was not found.");

    var values = sheet.getDataRange().getValues();
    if (!values.length) return diaryOutput_({ ok: true, records: [] }, e);

    var headers = values.shift().map(diaryHeaderKey_);
    var timezone = book.getSpreadsheetTimeZone();
    var records = values.filter(function (row) {
      return row.some(function (value) { return value !== "" && value !== null; });
    }).map(function (row) {
      var storedP = diaryCell_(row, headers, ["p", "prayers"]);
      if (typeof storedP === "string") {
        try { storedP = JSON.parse(storedP); } catch (ignore) { storedP = null; }
      }

      var prayers = ["Fajr", "Zuhr", "Asr", "Maghrib", "Isha"].map(function (prayer, i) {
        var stored = Array.isArray(storedP) ? storedP[i] : storedP && (storedP[prayer] || storedP["p" + (i + 1)]);
        if (typeof stored === "string") {
          try { stored = JSON.parse(stored); } catch (ignore) { stored = { s: stored, r: "" }; }
        }
        stored = stored && typeof stored === "object" ? stored : {};
        var status = stored.s || stored.status || diaryCell_(row, headers, [
          prayer, prayer + " status", prayer + " s", "p" + (i + 1), "p" + (i + 1) + " status"
        ]);
        var reason = stored.r || stored.reason || diaryCell_(row, headers, [
          prayer + " reason", prayer + " r", "p" + (i + 1) + " reason", "reason " + prayer
        ]);
        return { s: diaryStatus_(status), r: String(reason || "").trim() };
      });

      var date = diaryCell_(row, headers, ["date", "diary date"]);
      if (date instanceof Date && !isNaN(date.getTime())) date = Utilities.formatDate(date, timezone, "yyyy-MM-dd");
      else date = String(date || "").slice(0, 10);

      return {
        name: String(diaryCell_(row, headers, ["name", "person", "person name"]) || "").trim(),
        date: date,
        day: diaryCell_(row, headers, ["day", "total day"]),
        quran: diaryFlag_(diaryCell_(row, headers, ["quran", "quran complete", "quran completion"])),
        lecture: diaryFlag_(diaryCell_(row, headers, ["lecture", "lecture complete", "lecture completion"])),
        p: prayers,
        social: diaryNumber_(diaryCell_(row, headers, ["social", "social min", "social minutes", "social media", "social media min", "social media minutes"])),
        note: String(diaryCell_(row, headers, ["note", "notes"]) || "")
      };
    });

    return diaryOutput_({ ok: true, records: records }, e);
  } catch (error) {
    // Do not return stack traces, spreadsheet identifiers, or account details.
    console.error("Diary GET failed: " + error.message);
    return diaryOutput_({ ok: false, error: "Could not read diary records from Sheet1." }, e);
  }
}

function diaryOutput_(value, e) {
  var body = JSON.stringify(value);
  var callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    // JSONP fallback for browsers blocked by cross-origin fetch. Only allow a
    // plain generated JavaScript identifier; never accept arbitrary code.
    if (!/^[A-Za-z_$][0-9A-Za-z_$]{0,79}$/.test(callback)) {
      return ContentService.createTextOutput("Invalid callback.")
        .setMimeType(ContentService.MimeType.TEXT);
    }
    return ContentService.createTextOutput("/**/" + callback + "(" + body + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function diaryHeaderKey_(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function diaryCell_(row, headers, aliases) {
  var keys = aliases.map(diaryHeaderKey_);
  for (var i = 0; i < headers.length; i++) {
    if (keys.indexOf(headers[i]) !== -1) return row[i];
  }
  return "";
}

function diaryStatus_(value) {
  var s = String(value || "").trim().toLowerCase();
  if (["j", "jamaat", "جماعت", "جماعت کے ساتھ"].indexOf(s) !== -1) return "Jamaat";
  if (["a", "akele", "alone", "اکیلے"].indexOf(s) !== -1) return "Akele";
  if (["n", "nahi", "not prayed", "نہیں", "نہیں پڑھی"].indexOf(s) !== -1) return "Nahi";
  return "";
}

function diaryFlag_(value) {
  if (value === true || value === 1) return 1;
  if (value === false || value === 0 || value === "") return value === "" ? null : 0;
  var s = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "✅", "✔", "ہاں"].indexOf(s) !== -1) return 1;
  if (["0", "false", "no", "n", "❌", "✗", "نہیں"].indexOf(s) !== -1) return 0;
  return null;
}

function diaryNumber_(value) {
  if (value === "" || value === null || value === undefined) return null;
  var n = Number(value);
  return isFinite(n) ? n : null;
}
