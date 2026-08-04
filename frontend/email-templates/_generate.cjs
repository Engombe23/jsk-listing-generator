/**
 * Generates localized signup + password-reset HTML into:
 *   frontend/email-templates/{lang}/
 *
 * Token: {{CONFIRMATION_URL}} — swapped to {{ .ConfirmationURL }} for Dashboard
 * paste by _build-dashboard.cjs (and in the root English fallbacks below).
 */
const fs = require("fs");
const path = require("path");

const LANGS = {
  en: {
    dir: "ltr",
    signup: {
      title: "Confirm your PartLister account",
      tagline: "Automotive listing tools built for faster, cleaner product listings.",
      badge: "Account confirmation",
      heading: "Confirm your email address",
      body: "Thanks for signing up to PartLister. Confirm your email address to finish creating your account and start generating cleaner automotive listings.",
      helpTitle: "What PartLister helps you do:",
      helpBody: "Enter an OE or OEM number, fetch product data, build listing content, and prepare your listing for export.",
      cta: "Confirm email address",
      linkHint: "If the button does not work, copy and paste this link into your browser:",
      note1: "This email was sent to confirm access to a PartLister account.",
      note2: "If you did not create this account, you can safely ignore this email.",
      footerSlogan: "List smart. Sell more.",
    },
    reset: {
      title: "Reset your PartLister password",
      heading: "Reset your PartLister password",
      body: "We received a request to reset the password for your PartLister account.",
      cta: "Reset password",
      ignore: "If you didn't request this, you can safely ignore this email. Your password will not be changed unless you click the button above.",
      linkHint: "Button not working? Copy and paste this link into your browser:",
      copyright: "© {{year}} PartLister. List smart. Sell more.",
    },
  },
  fr: {
    dir: "ltr",
    signup: {
      title: "Confirmez votre compte PartLister",
      tagline: "Des outils d'annonces auto pour des fiches produits plus rapides et plus propres.",
      badge: "Confirmation du compte",
      heading: "Confirmez votre adresse e-mail",
      body: "Merci de vous être inscrit à PartLister. Confirmez votre adresse e-mail pour terminer la création de votre compte et commencer à générer des annonces automobiles.",
      helpTitle: "Ce que PartLister vous aide à faire :",
      helpBody: "Saisissez un numéro OE ou OEM, récupérez les données produit, créez le contenu de l'annonce et préparez l'export.",
      cta: "Confirmer l'adresse e-mail",
      linkHint: "Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :",
      note1: "Cet e-mail a été envoyé pour confirmer l'accès à un compte PartLister.",
      note2: "Si vous n'avez pas créé ce compte, vous pouvez ignorer cet e-mail.",
      footerSlogan: "Listez malin. Vendez plus.",
    },
    reset: {
      title: "Réinitialisez votre mot de passe PartLister",
      heading: "Réinitialisez votre mot de passe PartLister",
      body: "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte PartLister.",
      cta: "Réinitialiser le mot de passe",
      ignore: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail. Votre mot de passe ne sera modifié que si vous cliquez sur le bouton ci-dessus.",
      linkHint: "Le bouton ne fonctionne pas ? Copiez-collez ce lien dans votre navigateur :",
      copyright: "© {{year}} PartLister. Listez malin. Vendez plus.",
    },
  },
  de: {
    dir: "ltr",
    signup: {
      title: "Bestätigen Sie Ihr PartLister-Konto",
      tagline: "Automotive-Listing-Tools für schnellere, sauberere Produktanzeigen.",
      badge: "Kontenbestätigung",
      heading: "Bestätigen Sie Ihre E-Mail-Adresse",
      body: "Danke für Ihre Anmeldung bei PartLister. Bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto fertigzustellen und Auto-Anzeigen zu erstellen.",
      helpTitle: "Wobei PartLister Ihnen hilft:",
      helpBody: "OE- oder OEM-Nummer eingeben, Produktdaten abrufen, Anzeigentext erstellen und den Export vorbereiten.",
      cta: "E-Mail-Adresse bestätigen",
      linkHint: "Wenn die Schaltfläche nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:",
      note1: "Diese E-Mail wurde gesendet, um den Zugriff auf ein PartLister-Konto zu bestätigen.",
      note2: "Wenn Sie dieses Konto nicht erstellt haben, können Sie diese E-Mail ignorieren.",
      footerSlogan: "Smart listen. Mehr verkaufen.",
    },
    reset: {
      title: "PartLister-Passwort zurücksetzen",
      heading: "PartLister-Passwort zurücksetzen",
      body: "Wir haben eine Anfrage erhalten, das Passwort für Ihr PartLister-Konto zurückzusetzen.",
      cta: "Passwort zurücksetzen",
      ignore: "Wenn Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail. Ihr Passwort wird nur geändert, wenn Sie auf die Schaltfläche oben klicken.",
      linkHint: "Schaltfläche funktioniert nicht? Kopieren Sie diesen Link in Ihren Browser:",
      copyright: "© {{year}} PartLister. Smart listen. Mehr verkaufen.",
    },
  },
  it: {
    dir: "ltr",
    signup: {
      title: "Conferma il tuo account PartLister",
      tagline: "Strumenti per annunci auto: schede prodotto più rapide e pulite.",
      badge: "Conferma account",
      heading: "Conferma il tuo indirizzo e-mail",
      body: "Grazie per esserti registrato a PartLister. Conferma l'e-mail per completare l'account e iniziare a generare annunci automotive.",
      helpTitle: "Cosa ti aiuta a fare PartLister:",
      helpBody: "Inserisci un numero OE o OEM, recupera i dati prodotto, crea il contenuto dell'annuncio e prepara l'export.",
      cta: "Conferma indirizzo e-mail",
      linkHint: "Se il pulsante non funziona, copia e incolla questo link nel browser:",
      note1: "Questa e-mail è stata inviata per confermare l'accesso a un account PartLister.",
      note2: "Se non hai creato questo account, puoi ignorare questa e-mail.",
      footerSlogan: "Elenca in modo smart. Vendi di più.",
    },
    reset: {
      title: "Reimposta la password PartLister",
      heading: "Reimposta la password PartLister",
      body: "Abbiamo ricevuto una richiesta di reimpostazione della password del tuo account PartLister.",
      cta: "Reimposta password",
      ignore: "Se non hai richiesto tu questa operazione, ignora questa e-mail. La password non verrà modificata finché non clicchi il pulsante sopra.",
      linkHint: "Il pulsante non funziona? Copia e incolla questo link nel browser:",
      copyright: "© {{year}} PartLister. Elenca in modo smart. Vendi di più.",
    },
  },
  es: {
    dir: "ltr",
    signup: {
      title: "Confirma tu cuenta de PartLister",
      tagline: "Herramientas de anuncios de auto para fichas de producto más rápidas y limpias.",
      badge: "Confirmación de cuenta",
      heading: "Confirma tu dirección de correo",
      body: "Gracias por registrarte en PartLister. Confirma tu correo para terminar de crear tu cuenta y empezar a generar anuncios de automoción.",
      helpTitle: "En qué te ayuda PartLister:",
      helpBody: "Introduce un número OE u OEM, obtén datos del producto, crea el contenido del anuncio y prepáralo para exportar.",
      cta: "Confirmar correo electrónico",
      linkHint: "Si el botón no funciona, copia y pega este enlace en tu navegador:",
      note1: "Este correo se envió para confirmar el acceso a una cuenta de PartLister.",
      note2: "Si no creaste esta cuenta, puedes ignorar este correo.",
      footerSlogan: "Lista con inteligencia. Vende más.",
    },
    reset: {
      title: "Restablece tu contraseña de PartLister",
      heading: "Restablece tu contraseña de PartLister",
      body: "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de PartLister.",
      cta: "Restablecer contraseña",
      ignore: "Si no solicitaste esto, puedes ignorar este correo. Tu contraseña no cambiará a menos que hagas clic en el botón de arriba.",
      linkHint: "¿El botón no funciona? Copia y pega este enlace en tu navegador:",
      copyright: "© {{year}} PartLister. Lista con inteligencia. Vende más.",
    },
  },
  ar: {
    dir: "rtl",
    signup: {
      title: "أكّد حساب PartLister الخاص بك",
      tagline: "أدوات إعلانات قطع الغيار لإنشاء قوائم منتجات أسرع وأنظف.",
      badge: "تأكيد الحساب",
      heading: "أكّد عنوان بريدك الإلكتروني",
      body: "شكرًا لتسجيلك في PartLister. أكّد بريدك الإلكتروني لإنهاء إنشاء حسابك والبدء في إنشاء إعلانات قطع غيار السيارات.",
      helpTitle: "ما الذي يساعدك PartLister على فعله:",
      helpBody: "أدخل رقم OE أو OEM، واجلب بيانات المنتج، وأنشئ محتوى الإعلان، وجهّزه للتصدير.",
      cta: "تأكيد البريد الإلكتروني",
      linkHint: "إذا لم يعمل الزر، انسخ هذا الرابط والصقه في المتصفح:",
      note1: "أُرسل هذا البريد لتأكيد الوصول إلى حساب PartLister.",
      note2: "إذا لم تنشئ هذا الحساب، يمكنك تجاهل هذا البريد بأمان.",
      footerSlogan: "أدرج بذكاء. بع أكثر.",
    },
    reset: {
      title: "إعادة تعيين كلمة مرور PartLister",
      heading: "إعادة تعيين كلمة مرور PartLister",
      body: "تلقّينا طلبًا لإعادة تعيين كلمة المرور لحساب PartLister الخاص بك.",
      cta: "إعادة تعيين كلمة المرور",
      ignore: "إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد. لن تُغيَّر كلمة المرور إلا إذا نقرت الزر أعلاه.",
      linkHint: "الزر لا يعمل؟ انسخ هذا الرابط والصقه في المتصفح:",
      copyright: "© {{year}} PartLister. أدرج بذكاء. بع أكثر.",
    },
  },
  tr: {
    dir: "ltr",
    signup: {
      title: "PartLister hesabınızı onaylayın",
      tagline: "Daha hızlı, daha temiz ürün ilanları için otomotiv listeleme araçları.",
      badge: "Hesap onayı",
      heading: "E-posta adresinizi onaylayın",
      body: "PartLister'a kaydolduğunuz için teşekkürler. Hesabınızı tamamlamak ve otomotiv ilanları oluşturmaya başlamak için e-posta adresinizi onaylayın.",
      helpTitle: "PartLister size ne konuda yardımcı olur:",
      helpBody: "Bir OE veya OEM numarası girin, ürün verilerini alın, ilan içeriğini oluşturun ve dışa aktarmaya hazırlayın.",
      cta: "E-posta adresini onayla",
      linkHint: "Düğme çalışmazsa bu bağlantıyı tarayıcınıza kopyalayıp yapıştırın:",
      note1: "Bu e-posta bir PartLister hesabına erişimi onaylamak için gönderildi.",
      note2: "Bu hesabı siz oluşturmadıysanız bu e-postayı güvenle yok sayabilirsiniz.",
      footerSlogan: "Akıllı listele. Daha çok sat.",
    },
    reset: {
      title: "PartLister şifrenizi sıfırlayın",
      heading: "PartLister şifrenizi sıfırlayın",
      body: "PartLister hesabınız için bir şifre sıfırlama talebi aldık.",
      cta: "Şifreyi sıfırla",
      ignore: "Bunu siz istemediyseniz bu e-postayı yok sayabilirsiniz. Yukarıdaki düğmeye tıklamadığınız sürece şifreniz değişmez.",
      linkHint: "Düğme çalışmıyor mu? Bu bağlantıyı tarayıcınıza kopyalayıp yapıştırın:",
      copyright: "© {{year}} PartLister. Akıllı listele. Daha çok sat.",
    },
  },
};

function contentDirection(t) {
  // Keep <html>/body LTR always — dir="rtl" on <html> poisons Supabase's
  // Dashboard editor (and some mail wrappers) for every language in the file.
  // RTL is scoped to the Arabic content wrapper only.
  const rtl = t.dir === "rtl";
  return {
    dir: rtl ? "rtl" : "ltr",
    textAlign: rtl ? "right" : "left",
  };
}

function signupHtml(lang, t) {
  const { dir, textAlign } = contentDirection(t);
  return `<!DOCTYPE html>
<html lang="${lang}" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(t.signup.title)}</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#0f172a; direction:ltr;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" dir="${dir}" style="background-color:#f4f7fb; padding:40px 16px; direction:${dir}; text-align:${textAlign};">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" dir="${dir}" style="max-width:620px; background-color:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 12px 40px rgba(15, 23, 42, 0.08); direction:${dir}; text-align:${textAlign};">

          <tr>
            <td style="padding:34px 34px 24px 34px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #e0f2fe 100%); border-bottom:1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <img src="https://partlister.app/logo.png" alt="PartLister" width="180" style="display:block; width:180px; max-width:100%; height:auto; border:0;" />
                    <div style="margin-top:12px; font-size:14px; color:#475569;">
                      ${escapeHtml(t.signup.tagline)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:38px 34px 16px 34px;">

              <div style="display:inline-block; padding:7px 11px; border-radius:999px; background-color:#eff6ff; color:#135DFF; font-size:12px; font-weight:700; letter-spacing:0.3px; text-transform:uppercase;">
                ${escapeHtml(t.signup.badge)}
              </div>

              <h1 style="margin:20px 0 12px 0; font-size:30px; line-height:1.2; letter-spacing:-0.8px; color:#0f172a;">
                ${escapeHtml(t.signup.heading)}
              </h1>

              <p style="margin:0 0 20px 0; font-size:16px; line-height:1.7; color:#475569;">
                ${escapeHtml(t.signup.body)}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0; border:1px solid #e2e8f0; border-radius:14px; background-color:#f8fafc;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px 0; font-size:14px; font-weight:700; color:#0f172a;">
                      ${escapeHtml(t.signup.helpTitle)}
                    </p>

                    <p style="margin:0; font-size:14px; line-height:1.7; color:#475569;">
                      ${escapeHtml(t.signup.helpBody)}
                    </p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0 26px 0;">
                <tr>
                  <td align="center" bgcolor="#135DFF" style="border-radius:10px; background:linear-gradient(135deg, #135DFF, #0ea5e9);">
                    <a href="{{CONFIRMATION_URL}}" style="display:inline-block; padding:15px 24px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;">
                      ${escapeHtml(t.signup.cta)}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 22px 0; font-size:14px; line-height:1.7; color:#64748b;">
                ${escapeHtml(t.signup.linkHint)}
              </p>

              <p style="margin:0; padding:14px 16px; background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; font-size:13px; line-height:1.6; color:#135DFF; word-break:break-all;">
                {{CONFIRMATION_URL}}
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding:20px 34px 34px 34px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #e2e8f0;">
                <tr>
                  <td style="padding-top:22px;">
                    <p style="margin:0 0 8px 0; font-size:13px; line-height:1.6; color:#64748b;">
                      ${escapeHtml(t.signup.note1)}
                    </p>

                    <p style="margin:0; font-size:13px; line-height:1.6; color:#64748b;">
                      ${escapeHtml(t.signup.note2)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 34px; background-color:#0f172a;">
              <p style="margin:0; font-size:13px; line-height:1.6; color:#cbd5e1; font-weight:700;">
                PartLister
              </p>
              <p style="margin:4px 0 0 0; font-size:12px; line-height:1.6; color:#94a3b8;">
                ${escapeHtml(t.signup.footerSlogan)}
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}

function resetHtml(lang, t) {
  const { dir, textAlign } = contentDirection(t);
  const year = new Date().getFullYear();
  const copyright = t.reset.copyright.replace("{{year}}", String(year));
  return `<!DOCTYPE html>
<html lang="${lang}" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(t.reset.title)}</title>
</head>
  <body style="margin:0; padding:0; background:#f6f8fc; font-family:Arial, Helvetica, sans-serif; color:#0f1f3d; direction:ltr;">
    <table width="100%" cellpadding="0" cellspacing="0" dir="${dir}" style="background:#f6f8fc; padding:40px 16px; direction:${dir}; text-align:${textAlign};">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" dir="${dir}" style="max-width:560px; background:#ffffff; border:1px solid #dbe4f0; border-radius:18px; overflow:hidden; direction:${dir}; text-align:${textAlign};">

            <tr>
              <td align="center" style="padding:34px 32px 18px;">
                <img
                  src="https://partlister.app/logo.png"
                  alt="PartLister"
                  style="width:180px; max-width:100%; height:auto; margin-bottom:24px;"
                >

                <h1 style="margin:0; font-size:28px; line-height:1.25; color:#0f1f3d;">
                  ${escapeHtml(t.reset.heading)}
                </h1>

                <p style="margin:14px 0 0; font-size:15px; line-height:1.6; color:#5c6b82;">
                  ${escapeHtml(t.reset.body)}
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:10px 32px 30px;">
                <a href="{{CONFIRMATION_URL}}"
                   style="display:inline-block; background:#0b63f6; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:15px 28px; border-radius:12px;">
                  ${escapeHtml(t.reset.cta)}
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 26px;">
                <p style="margin:0; font-size:14px; line-height:1.6; color:#5c6b82;">
                  ${escapeHtml(t.reset.ignore)}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 32px; background:#f8fafd; border-top:1px solid #e5edf6;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#8a97aa;">
                  ${escapeHtml(t.reset.linkHint)}<br>
                  <a href="{{CONFIRMATION_URL}}" style="color:#0b63f6; word-break:break-all;">{{CONFIRMATION_URL}}</a>
                </p>
              </td>
            </tr>

          </table>

          <p style="margin:20px 0 0; font-size:12px; color:#98a4b6;">
            ${escapeHtml(copyright)}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const root = path.join(__dirname);

for (const [lang, t] of Object.entries(LANGS)) {
  const dir = path.join(root, lang);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "signup-confirmation.html"), signupHtml(lang, t), "utf8");
  fs.writeFileSync(path.join(dir, "password-reset.html"), resetHtml(lang, t), "utf8");
  console.log("wrote", lang);
}

function toDashboardToken(html) {
  return html.split("{{CONFIRMATION_URL}}").join("{{ .ConfirmationURL }}");
}

// Root English files use Dashboard Go token for single-lang paste fallback
fs.writeFileSync(
  path.join(root, "signup-confirmation.html"),
  toDashboardToken(fs.readFileSync(path.join(root, "en", "signup-confirmation.html"), "utf8")),
  "utf8",
);
fs.writeFileSync(
  path.join(root, "password-reset.html"),
  toDashboardToken(fs.readFileSync(path.join(root, "en", "password-reset.html"), "utf8")),
  "utf8",
);
console.log("synced root English Dashboard fallbacks");
