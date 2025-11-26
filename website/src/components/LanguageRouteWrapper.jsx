import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Map URL language codes to i18n language codes
const languageMap = {
  'en': 'en',
  'cn': 'zh-CN',
  'jp': 'ja'
};

// Reverse map for getting URL code from i18n code
const reverseLanguageMap = {
  'en': 'en',
  'zh-CN': 'cn',
  'ja': 'jp'
};

const LanguageRouteWrapper = ({ children, defaultPage }) => {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (lang) {
      const i18nLang = languageMap[lang];
      if (i18nLang) {
        // Valid language code - set it
        if (i18n.language !== i18nLang) {
          i18n.changeLanguage(i18nLang);
        }
      } else {
        // Invalid language code - redirect to default (cn)
        navigate(`/${defaultPage}/cn`, { replace: true });
      }
    } else {
      // If no language in URL, redirect to default language (cn/zh-CN)
      navigate(`/${defaultPage}/cn`, { replace: true });
    }
  }, [lang, i18n, navigate, defaultPage]);

  return children;
};

export default LanguageRouteWrapper;
export { languageMap, reverseLanguageMap };

