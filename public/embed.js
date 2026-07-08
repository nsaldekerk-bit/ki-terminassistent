(function () {
  var currentScript = document.currentScript;
  var siteKey = currentScript.getAttribute("data-key");
  if (!siteKey) {
    console.error("[ki-terminassistent] embed.js: missing data-key attribute on the <script> tag.");
    return;
  }

  var scriptUrl = new URL(currentScript.src);
  var origin = scriptUrl.origin;

  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", "Chat öffnen");
  bubble.textContent = "Chat";
  bubble.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483000;width:56px;height:56px;" +
    "border-radius:9999px;border:none;background:#111827;color:#fff;font-size:13px;" +
    "cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.2);";

  var iframe = null;
  var isOpen = false;

  function ensureIframe() {
    if (iframe) return iframe;
    iframe = document.createElement("iframe");
    iframe.src = origin + "/embed/" + encodeURIComponent(siteKey);
    iframe.title = "Chat";
    iframe.style.cssText =
      "position:fixed;bottom:88px;right:20px;z-index:2147483000;width:360px;height:520px;" +
      "max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);border:none;border-radius:12px;" +
      "box-shadow:0 4px 24px rgba(0,0,0,0.25);";
    document.body.appendChild(iframe);
    return iframe;
  }

  bubble.addEventListener("click", function () {
    isOpen = !isOpen;
    var el = ensureIframe();
    el.style.display = isOpen ? "block" : "none";
  });

  document.body.appendChild(bubble);
})();
