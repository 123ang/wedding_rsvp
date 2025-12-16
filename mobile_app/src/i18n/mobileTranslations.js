// Simple mobile translation table for EN, Malay, Japanese

export const SUPPORTED_LANGUAGES = {
  en: { id: 'en', label: 'English', nativeLabel: 'English' },
  ms: { id: 'ms', label: 'Malay', nativeLabel: 'Bahasa Melayu' },
  ja: { id: 'ja', label: 'Japanese', nativeLabel: '日本語' },
};

const translations = {
  en: {
    'login.title': 'Wedding Guest Login',
    'login.subtitle':
      'Enter the phone number you used when submitting your RSVP on the website.',
    'login.phoneLabel': 'Phone number',
    'login.placeholder': '01X-XXXXXXX',
    'login.button': 'Continue',
    'login.helper':
      'No account or password needed. We just check that your phone number exists in the RSVP records.',
    'login.notFoundTitle': 'Not found',
    'login.notFoundMessage':
      'We could not find an RSVP with this phone number. Please use the same phone you used on the website.',
    'login.errorTitle': 'Error',

    'rsvp.titleBride': 'Bride Wedding RSVP',
    'rsvp.titleGroom': 'Groom Wedding RSVP',
    'rsvp.subtitle': 'Please fill in the information below to confirm your attendance.',
    'rsvp.field.name': 'Name *',
    'rsvp.field.email': 'Email',
    'rsvp.field.phone': 'Phone number *',
    'rsvp.field.attending': 'Will you attend? *',
    'rsvp.attending.yes': '✓ I will attend',
    'rsvp.attending.no': '✗ I cannot attend',
    'rsvp.field.guests': 'Number of guests *',
    'rsvp.field.organization': 'Organization',
    'rsvp.field.relationship': 'Relationship',
    'rsvp.field.remark': 'Remark',
    'rsvp.guests.label': '{{count}} person',
    'rsvp.submit': 'Submit RSVP',
    'rsvp.successTitle': 'Success! 🎉',
    'rsvp.successMessage': 'Your RSVP has been submitted successfully!',
    'rsvp.errorTitle': 'Error',

    'settings.language': 'Language',
    'settings.language.desc': 'Change app language',
    'languageSelect.title': 'Choose Language',
  },
  ms: {
    'login.title': 'Log Masuk Tetamu',
    'login.subtitle':
      'Masukkan nombor telefon yang anda gunakan semasa hantar RSVP di laman web.',
    'login.phoneLabel': 'Nombor telefon',
    'login.placeholder': '01X-XXXXXXX',
    'login.button': 'Teruskan',
    'login.helper':
      'Tiada akaun atau kata laluan diperlukan. Kami hanya semak nombor telefon anda wujud dalam rekod RSVP.',
    'login.notFoundTitle': 'Tidak jumpa',
    'login.notFoundMessage':
      'Kami tidak jumpa RSVP dengan nombor telefon ini. Sila guna nombor telefon yang sama seperti di laman web.',
    'login.errorTitle': 'Ralat',

    'rsvp.titleBride': 'RSVP Majlis Pengantin Perempuan',
    'rsvp.titleGroom': 'RSVP Majlis Pengantin Lelaki',
    'rsvp.subtitle': 'Sila isi maklumat di bawah untuk mengesahkan kehadiran anda.',
    'rsvp.field.name': 'Nama *',
    'rsvp.field.email': 'E-mel',
    'rsvp.field.phone': 'Nombor telefon *',
    'rsvp.field.attending': 'Adakah anda akan hadir? *',
    'rsvp.attending.yes': '✓ Saya akan hadir',
    'rsvp.attending.no': '✗ Saya tidak dapat hadir',
    'rsvp.field.guests': 'Bilangan tetamu *',
    'rsvp.field.organization': 'Organisasi',
    'rsvp.field.relationship': 'Hubungan',
    'rsvp.field.remark': 'Catatan',
    'rsvp.guests.label': '{{count}} orang',
    'rsvp.submit': 'Hantar RSVP',
    'rsvp.successTitle': 'Berjaya! 🎉',
    'rsvp.successMessage': 'RSVP anda telah dihantar dengan jayanya!',
    'rsvp.errorTitle': 'Ralat',

    'settings.language': 'Bahasa',
    'settings.language.desc': 'Tukar bahasa aplikasi',
    'languageSelect.title': 'Pilih Bahasa',
  },
  ja: {
    'login.title': 'ゲストログイン',
    'login.subtitle':
      'ウェブサイトでRSVPを送信したときの電話番号を入力してください。',
    'login.phoneLabel': '電話番号',
    'login.placeholder': '01X-XXXXXXX',
    'login.button': '続行',
    'login.helper':
      'アカウントやパスワードは不要です。RSVP記録に電話番号があるか確認するだけです。',
    'login.notFoundTitle': '見つかりません',
    'login.notFoundMessage':
      'この電話番号のRSVPは見つかりませんでした。ウェブサイトで使用した番号を入力してください。',
    'login.errorTitle': 'エラー',

    'rsvp.titleBride': '新婦側のRSVP',
    'rsvp.titleGroom': '新郎側のRSVP',
    'rsvp.subtitle': 'ご出席確認のため、以下の情報をご記入ください。',
    'rsvp.field.name': 'お名前 *',
    'rsvp.field.email': 'メールアドレス',
    'rsvp.field.phone': '電話番号 *',
    'rsvp.field.attending': 'ご出席について *',
    'rsvp.attending.yes': '✓ 出席します',
    'rsvp.attending.no': '✗ 出席できません',
    'rsvp.field.guests': '人数 *',
    'rsvp.field.organization': '所属',
    'rsvp.field.relationship': '新郎新婦との関係',
    'rsvp.field.remark': '備考',
    'rsvp.guests.label': '{{count}} 名',
    'rsvp.submit': 'RSVPを送信',
    'rsvp.successTitle': '送信完了 🎉',
    'rsvp.successMessage': 'RSVPを正常に送信しました！',
    'rsvp.errorTitle': 'エラー',

    'settings.language': '言語',
    'settings.language.desc': 'アプリの言語を変更',
    'languageSelect.title': '言語を選択',
  },
};

export const translate = (lang, key, vars = {}) => {
  const table = translations[lang] || translations.en;
  const template = table[key] || translations.en[key] || key;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : '',
  );
};


