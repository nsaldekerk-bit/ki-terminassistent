(function () {
  var currentScript = document.currentScript;
  var siteKey = currentScript.getAttribute("data-key");
  if (!siteKey) {
    console.error("[ki-terminassistent] embed.js: missing data-key attribute on the <script> tag.");
    return;
  }

  var origin = new URL(currentScript.src).origin;
  var Z = "2147483000";

  var calIcon =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
  var closeIcon =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  var launcher = document.createElement("button");
  launcher.setAttribute("aria-label", "Termin buchen – Assistent öffnen");
  launcher.innerHTML = calIcon;
  launcher.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:" + Z + ";width:60px;height:60px;" +
    "border-radius:9999px;border:none;color:#fff;cursor:pointer;display:flex;" +
    "align-items:center;justify-content:center;" +
    "background:linear-gradient(150deg,#ec6a1e,#c4520e);" +
    "box-shadow:0 8px 24px -6px rgba(196,82,14,0.6),0 2px 8px rgba(0,0,0,0.2);" +
    "transition:transform .15s ease,box-shadow .15s ease;";
  launcher.onmouseenter = function () {
    launcher.style.transform = "scale(1.06)";
  };
  launcher.onmouseleave = function () {
    launcher.style.transform = "scale(1)";
  };

  var iframe = null;
  var isOpen = false;

  function ensureIframe() {
    if (iframe) return iframe;
    iframe = document.createElement("iframe");
    iframe.src = origin + "/embed/" + encodeURIComponent(siteKey);
    iframe.title = "Terminassistent";
    iframe.setAttribute("allow", "clipboard-write");
    iframe.style.cssText =
      "position:fixed;bottom:92px;right:20px;z-index:" + Z + ";width:400px;height:640px;" +
      "max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);border:none;border-radius:18px;" +
      "background:#171a1f;box-shadow:0 24px 60px -20px rgba(0,0,0,0.6),0 4px 14px -6px rgba(0,0,0,0.4);" +
      "opacity:0;transform:translateY(12px);transition:opacity .2s ease,transform .2s ease;";
    document.body.appendChild(iframe);
    return iframe;
  }

  launcher.addEventListener("click", function () {
    isOpen = !isOpen;
    var el = ensureIframe();
    if (isOpen) {
      el.style.display = "block";
      // next frame so the transition runs
      requestAnimationFrame(function () {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
      launcher.innerHTML = closeIcon;
      launcher.setAttribute("aria-label", "Assistent schließen");
    } else {
      el.style.opacity = "0";
      el.style.transform = "translateY(12px)";
      setTimeout(function () {
        if (!isOpen) el.style.display = "none";
      }, 200);
      launcher.innerHTML = calIcon;
      launcher.setAttribute("aria-label", "Termin buchen – Assistent öffnen");
    }
  });

  document.body.appendChild(launcher);
})();
